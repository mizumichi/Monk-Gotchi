import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';

// $amplify/env/ is a virtual module generated after first sandbox run.
// Use process.env directly — same values, avoids the pre-generation chicken-and-egg issue.
// Cast needed: process.env is string|undefined but DataClientEnv requires string (AWS injects all required vars at runtime).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(process.env as any);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

type Handler = Schema['generateHarvestAdvice']['functionHandler'];

const SYSTEM_INSTRUCTION = [
  'あなたは健康習慣トラッキングアプリの「週次ふりかえり」コーチです。',
  'ユーザーが7日間で記録した行動の集計データだけを見て、短く前向きなふりかえりを返します。',
  'ルール:',
  '- 医療的な診断・断定はしない。すべて「記録した行動からの推定」として書く。',
  '- 責めない。できなかったことではなく、次にできる小さな一歩を促す。',
  '- 具体的に。最も伸びしろのあるカテゴリ（数値が低い軸）に触れる。',
  '- 日本語。verdict は1文。goodPoints は1〜2件、advice は2〜3件。各1〜2文。',
  '- 出力は指定の JSON スキーマのみ。前置き・マークダウン・コードブロックは出さない。',
].join('\n');

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    verdict:    { type: 'string' },
    goodPoints: { type: 'array', items: { type: 'string' } },
    advice:     { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'goodPoints', 'advice'],
};

export const handler: Handler = async (event) => {
  const { harvestId, summary } = event.arguments;
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: 'user', parts: [{ text: '今週の集計データ:\n' + JSON.stringify(summary) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            maxOutputTokens: 512,
            temperature: 0.7,
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('empty Gemini response');

    const advice = JSON.parse(text);
    const ok =
      advice && typeof advice.verdict === 'string' && advice.verdict.length > 0 &&
      Array.isArray(advice.goodPoints) && advice.goodPoints.length >= 1 &&
      Array.isArray(advice.advice) && advice.advice.length >= 1;
    if (!ok) throw new Error('schema mismatch');

    await client.models.Harvest.update({
      id: harvestId,
      aiAdvice: advice,
      aiStatus: 'done',
      aiGeneratedAt: new Date().toISOString(),
      aiModel: model,
    });
    return advice;
  } catch (e) {
    await client.models.Harvest.update({ id: harvestId, aiStatus: 'error' });
    throw e;
  }
};

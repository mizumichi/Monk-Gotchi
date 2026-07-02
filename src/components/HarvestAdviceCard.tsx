"use client";

import { useEffect, useState } from 'react';
import { buildHarvestSummary, loadCycleLogs, requestHarvestAdvice, type HarvestSummary } from '@/lib/harvestAdvice';

type Advice = { verdict: string; goodPoints: string[]; advice: string[] };
type CardStatus = 'done' | 'pending' | 'error' | 'none';

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";
const GREEN = '#5A7A33';
const SECONDARY = '#A8987F';
const TEXT = '#43382A';
const DIVIDER = '#EDE5D4';
const BORDER = '#E6DBC4';

function parseAdvice(raw: unknown): Advice | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (
      obj &&
      typeof obj.verdict === 'string' && obj.verdict.length > 0 &&
      Array.isArray(obj.goodPoints) &&
      Array.isArray(obj.advice)
    ) {
      return obj as Advice;
    }
  } catch { /* ignore */ }
  return null;
}

export type HarvestForAdvice = {
  id: string;
  cycleStartDate: string;
  harvestedAt?: string | null;
  rank?: string | null;
  fruitCount?: number | null;
  totalScore?: number | null;
  aiStatus?: string | null;
  aiAdvice?: unknown;
};

export function HarvestAdviceCard({ harvest }: { harvest: HarvestForAdvice }) {
  const initialAdvice = parseAdvice(harvest.aiAdvice);
  const initialStatus: CardStatus =
    (harvest.aiStatus as CardStatus | null | undefined) ??
    (initialAdvice ? 'done' : 'none');

  const [status, setStatus] = useState<CardStatus>(initialStatus);
  const [advice, setAdvice] = useState<Advice | null>(initialAdvice);

  // Sync when parent refetches and aiStatus transitions (e.g., pending → done after Lambda)
  useEffect(() => {
    const newAdvice = parseAdvice(harvest.aiAdvice);
    const newStatus: CardStatus =
      (harvest.aiStatus as CardStatus | null | undefined) ??
      (newAdvice ? 'done' : 'none');
    setStatus(newStatus);
    setAdvice(newAdvice);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvest.aiStatus]);

  const handleGenerate = async () => {
    setStatus('pending');
    try {
      const logs = await loadCycleLogs(
        harvest.cycleStartDate,
        harvest.harvestedAt ?? new Date().toISOString(),
      );
      const summary = buildHarvestSummary({
        fullLogs: logs,
        cycleStartDate: harvest.cycleStartDate,
        harvestedAt: harvest.harvestedAt ?? new Date().toISOString(),
        rank: (harvest.rank ?? 'mid') as HarvestSummary['rank'],
        fruitCount: harvest.fruitCount ?? 0,
        totalScore: harvest.totalScore ?? 0,
      });
      const res = await requestHarvestAdvice(harvest.id, summary);
      const next = parseAdvice(res?.data ?? null);
      if (next) {
        setAdvice(next);
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch (e) {
      console.error('[harvest-ai] regenerate failed', e);
      setStatus('error');
    }
  };

  if (status === 'done' && advice) {
    return (
      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '10px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: SECONDARY, letterSpacing: '.08em' }}>
          ✦ 今週のふりかえり
        </p>

        <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: TEXT, lineHeight: 1.6 }}>
          {advice.verdict}
        </p>

        {advice.goodPoints.length > 0 && (
          <div>
            <p style={{ margin: '0 0 5px', fontSize: '10.5px', fontWeight: 700, color: GREEN, letterSpacing: '.04em' }}>良かったこと</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {advice.goodPoints.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: GREEN, fontSize: '11px', lineHeight: '1.7', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '12px', color: TEXT, lineHeight: 1.6 }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {advice.advice.length > 0 && (
          <div>
            <p style={{ margin: '0 0 5px', fontSize: '10.5px', fontWeight: 700, color: GREEN, letterSpacing: '.04em' }}>次のサイクルへ</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {advice.advice.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: GREEN, fontSize: '11px', lineHeight: '1.7', flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: '12px', color: TEXT, lineHeight: 1.6 }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ margin: 0, borderTop: `1px solid ${DIVIDER}`, paddingTop: '7px', fontSize: '10px', color: SECONDARY, lineHeight: 1.5 }}>
          記録した行動からの推定です
        </p>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '10px', paddingTop: '14px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontFamily: FONT }}>
        <div
          className="animate-spin"
          style={{ width: '18px', height: '18px', border: `2.5px solid ${BORDER}`, borderTopColor: GREEN, borderRadius: '50%', flexShrink: 0 }}
        />
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: SECONDARY }}>今週の記録を読みかえしています…</p>
        <p style={{ margin: 0, fontSize: '10.5px', color: '#B6A485' }}>実はもう果樹園に貯まっています</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '10px', paddingTop: '12px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontFamily: FONT }}>
        <p style={{ margin: 0, fontSize: '12px', color: SECONDARY, textAlign: 'center', lineHeight: 1.6 }}>
          ☁ ひとことをまとめられませんでした。<br />収穫は記録ずみです。
        </p>
        <button
          onClick={handleGenerate}
          style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: GREEN, background: '#EBF1DC', border: '1.5px solid #CFE0AE', borderRadius: '999px', padding: '7px 16px', cursor: 'pointer' }}
        >
          もう一度ためす
        </button>
      </div>
    );
  }

  // status === 'none': old harvest with no advice
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'center', fontFamily: FONT }}>
      <button
        onClick={handleGenerate}
        style={{ fontFamily: FONT, fontWeight: 700, fontSize: '11.5px', color: SECONDARY, background: 'transparent', border: `1.5px solid ${BORDER}`, borderRadius: '999px', padding: '6px 14px', cursor: 'pointer' }}
      >
        ✦ アドバイスを生成
      </button>
    </div>
  );
}

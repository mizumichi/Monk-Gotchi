"use client";

import { useEffect } from "react";
import type { Stage } from "@/lib/date";
import {
  getCharacterByCode,
  resolveCharacterCode,
  type CharacterMaster,
} from "@/data/characters";

interface Props {
  dayNumber: number;
  stage: Stage;
  midType?: string | null;
  finalType?: string | null;
}

const FALLBACK: CharacterMaster = {
  code: 'Monk-Egg',
  nameJp: '不明なキャラ',
  stage: 'egg',
  tier: 'progress',
  emoji: '❓',
  description: '',
  conditionText: '',
};

function resolveDisplayCharacter(
  stage: Stage,
  midType: string | null | undefined,
  finalType: string | null | undefined
): CharacterMaster {
  if (stage === 'egg') return getCharacterByCode('Monk-Egg') ?? FALLBACK;
  if (stage === 'early') return getCharacterByCode('Monk-Baby') ?? FALLBACK;

  if (stage === 'mid') {
    const code = resolveCharacterCode(midType);
    const char = getCharacterByCode(code);
    return char?.stage === 'mid' ? char : (getCharacterByCode('Heibon-Monk') ?? FALLBACK);
  }

  // final
  const code = resolveCharacterCode(finalType);
  const char = getCharacterByCode(code);
  return char?.stage === 'final' ? char : (getCharacterByCode('Average-San') ?? FALLBACK);
}

export default function CharacterDisplay({ dayNumber, stage, midType, finalType }: Props) {
  const char = resolveDisplayCharacter(stage, midType, finalType);

  useEffect(() => {
    console.log("[CharacterDisplay] dayNumber:", dayNumber, "stage:", stage, "midType:", midType, "finalType:", finalType);
  }, [dayNumber, stage, midType, finalType]);

  return (
    <div className="border-2 border-violet-500 bg-zinc-900 p-5 flex flex-col items-center gap-2 sm:min-w-[160px]">
      <div
        className="text-7xl leading-none select-none"
        role="img"
        aria-label={`キャラクター: ${char.nameJp}`}
      >
        {char.emoji}
      </div>
      <p className="font-mono font-bold text-zinc-100 text-sm tracking-wide">
        {char.nameJp}
      </p>

    </div>
  );
}

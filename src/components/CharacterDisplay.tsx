"use client";

import { useEffect } from "react";
import type { Stage } from "@/lib/date";
import { CHARACTERS, type CharacterId } from "@/data/characters";

interface Props {
  dayNumber: number;
  stage: Stage;
  midType?: string | null;
  finalType?: string | null;
}

function resolveCharacterId(
  stage: Stage,
  midType: string | null | undefined,
  finalType: string | null | undefined
): CharacterId {
  if (stage === "egg") return "egg";
  if (stage === "early") return "early";
  if (stage === "mid") {
    if (midType && midType in CHARACTERS) return midType as CharacterId;
    return "normal";
  }
  if (stage === "final") {
    if (finalType && finalType in CHARACTERS) return finalType as CharacterId;
    return "average";
  }
  return "egg";
}

export default function CharacterDisplay({ dayNumber, stage, midType, finalType }: Props) {
  const charId = resolveCharacterId(stage, midType, finalType);
  const char = CHARACTERS[charId];

  useEffect(() => {
    console.log("[CharacterDisplay] dayNumber:", dayNumber, "stage:", stage, "midType:", midType, "finalType:", finalType);
  }, [dayNumber, stage, midType, finalType]);

  return (
    <div className="border-2 border-violet-500 bg-zinc-900 p-5 flex flex-col items-center gap-2 sm:min-w-[160px]">
      <div
        className="text-7xl leading-none select-none"
        role="img"
        aria-label={`キャラクター: ${char.name}`}
      >
        {char.emoji}
      </div>
      <p className="font-mono font-bold text-zinc-100 text-sm tracking-wide">
        {char.name}
      </p>
      <p className="font-mono text-xs text-violet-400 tracking-widest">
        Day {dayNumber} / 7
      </p>
    </div>
  );
}

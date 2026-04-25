"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { client } from "@/lib/amplifyClient";
import {
  getCurrentDateString,
  getRealCurrentDateString,
  setDateOverride,
  calculateDayNumber,
  getStage,
  type Stage,
} from "@/lib/date";
import { checkEvolution } from "@/lib/evolution";
import type { Schema } from "../../amplify/data/resource";

type Character = Schema["Character"]["type"];

export interface AdvanceDayResult {
  evolved: boolean;
  newStage?: string;
  midType?: string;
  finalType?: string;
}

export interface RebornResult {
  success: boolean;
  recordedType?: string;
}

export interface UseCharacterResult {
  character: Character | null;
  dayNumber: number;
  stage: Stage;
  midType: string | null | undefined;
  finalType: string | null | undefined;
  cycleStartDate: string;
  dateOverride: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  advanceDay: () => Promise<AdvanceDayResult>;
  checkAndEvolve: () => Promise<AdvanceDayResult>;
  resetDate: () => Promise<void>;
  rebornAsEgg: () => Promise<RebornResult>;
}

export function useCharacter(enabled: boolean = true): UseCharacterResult {
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateOverride, setDateOverrideState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dateOverride");
    }
    return null;
  });

  const fetchOrCreate = useCallback(async () => {
    console.log("[useCharacter] fetchOrCreate start");
    setIsLoading(true);
    setError(null);
    try {
      const { userId } = await getCurrentUser();
      const { data: list, errors: listErrors } = await client.models.Character.list();
      console.log("[useCharacter] list result:", list, "errors:", listErrors);

      if (list && list.length > 0) {
        setCharacter(list[0]);
      } else {
        const today = getCurrentDateString();
        const { data: created, errors: createErrors } = await client.models.Character.create({
          userId,
          cycleStartDate: today,
          stage: "egg",
          categoryScores: JSON.stringify({}),
        });
        console.log("[useCharacter] create result:", created, "errors:", JSON.stringify(createErrors, null, 2));
        if (created) setCharacter(created);
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      console.error("[useCharacter] fetchOrCreate error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchOrCreate();
  }, [enabled, fetchOrCreate]);

  const today = getCurrentDateString();
  const cycleStartDate = character?.cycleStartDate ?? today;
  const dayNumber = calculateDayNumber(cycleStartDate);
  const stage = getStage(dayNumber);

  // キャラの進化をDBに反映し、結果を返す内部ヘルパー
  const applyEvolution = useCallback(
    async (char: Character): Promise<AdvanceDayResult> => {
      try {
        const { data: allLogs } = await client.models.DailyLog.list();
        const result = checkEvolution(char, allLogs ?? []);
        if (!result) return { evolved: false };

        const { data: evolved } = await client.models.Character.update({
          id: char.id,
          stage: result.stage,
          ...(result.midType != null && { midType: result.midType }),
          ...(result.finalType != null && { finalType: result.finalType }),
        });
        if (evolved) setCharacter(evolved);

        console.log("[applyEvolution] evolved to:", result.stage, result.midType, result.finalType);
        return {
          evolved: true,
          newStage: result.stage,
          midType: result.midType,
          finalType: result.finalType,
        };
      } catch (err) {
        console.error("[applyEvolution] error:", err);
        return { evolved: false };
      }
    },
    []
  );

  const checkAndEvolve = useCallback(async (): Promise<AdvanceDayResult> => {
    if (!character) return { evolved: false };
    return applyEvolution(character);
  }, [character, applyEvolution]);

  const advanceDay = useCallback(async (): Promise<AdvanceDayResult> => {
    if (!character) {
      console.log("[advanceDay] character is null, skipping");
      return { evolved: false };
    }
    try {
      // dateOverride を1日進めるだけ。
      // dayNumber = today(=dateOverride) - cycleStartDate + 1 なので、
      // cycleStartDate も同時にずらすと +2日になってしまうため cycleStartDate は触らない。
      const currentDateStr = getCurrentDateString();
      const currentDateObj = new Date(currentDateStr + "T00:00:00Z");
      currentDateObj.setUTCDate(currentDateObj.getUTCDate() + 1);
      const newDateOverride = currentDateObj.toISOString().slice(0, 10);
      setDateOverride(newDateOverride);
      setDateOverrideState(newDateOverride);
      console.log("[advanceDay] dateOverride →", newDateOverride);

      // localStorage に書いた直後に applyEvolution を呼ぶと
      // calculateDayNumber → getCurrentDateString() が新しい dateOverride を参照する
      return applyEvolution(character);
    } catch (err) {
      console.error("[advanceDay] exception:", err);
      return { evolved: false };
    }
  }, [character, applyEvolution]);

  const resetDate = useCallback(async () => {
    if (!character) return;
    try {
      setDateOverride(null);
      setDateOverrideState(null);

      const today = getRealCurrentDateString();
      console.log("[resetDate] resetting cycleStartDate to:", today);
      const { data: updated } = await client.models.Character.update({
        id: character.id,
        cycleStartDate: today,
        stage: "egg",
        midType: null,
        finalType: null,
      });
      if (updated) setCharacter(updated);
    } catch (err) {
      console.error("[resetDate] exception:", err);
    }
  }, [character]);

  const rebornAsEgg = useCallback(async (): Promise<RebornResult> => {
    if (!character?.finalType) {
      console.log("[rebornAsEgg] finalType is not set, skipping");
      return { success: false };
    }
    const finalType = character.finalType;
    const now = new Date().toISOString();
    const today = getRealCurrentDateString();

    try {
      // CharacterDex を確認して upsert
      const { data: dexList } = await client.models.CharacterDex.list({
        filter: { characterType: { eq: finalType } },
      });

      if (dexList && dexList.length > 0) {
        await client.models.CharacterDex.update({
          id: dexList[0].id,
          obtainedCount: (dexList[0].obtainedCount ?? 1) + 1,
          lastObtainedAt: now,
        });
        console.log("[rebornAsEgg] dex updated for:", finalType, "count:", (dexList[0].obtainedCount ?? 1) + 1);
      } else {
        await client.models.CharacterDex.create({
          characterType: finalType,
          firstObtainedAt: now,
          lastObtainedAt: now,
          obtainedCount: 1,
        });
        console.log("[rebornAsEgg] dex created for:", finalType);
      }

      // dateOverride をクリアして Character を卵にリセット
      setDateOverride(null);
      setDateOverrideState(null);

      const { data: updated } = await client.models.Character.update({
        id: character.id,
        cycleStartDate: today,
        stage: "egg",
        midType: null,
        finalType: null,
      });
      if (updated) setCharacter(updated);

      return { success: true, recordedType: finalType };
    } catch (err) {
      console.error("[rebornAsEgg] error:", err);
      return { success: false };
    }
  }, [character]);

  return {
    character,
    dayNumber,
    stage,
    midType: character?.midType,
    finalType: character?.finalType,
    cycleStartDate,
    dateOverride,
    isLoading,
    error,
    refetch: fetchOrCreate,
    advanceDay,
    checkAndEvolve,
    resetDate,
    rebornAsEgg,
  };
}

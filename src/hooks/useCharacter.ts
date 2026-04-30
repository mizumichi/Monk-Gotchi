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
import { getCycleInfo, type CycleInfo } from "@/lib/cycle";
import { evolveMid, evolveFinal, type DailyLogLike } from "@/lib/evolution";
import { calcSleepHoursXp } from "@/lib/sleepXp";
import { getTaskById } from "@/data/tasks";
import type { Schema } from "../../amplify/data/resource";

type Character = Schema["Character"]["type"];
type AmplifyDailyLog = Schema["DailyLog"]["type"];

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
  cycleInfo: CycleInfo;
  midType: string | null | undefined;
  finalType: string | null | undefined;
  cycleStartDate: string;
  dateOverride: string | null;
  isLoading: boolean;
  error: Error | null;
  numericValues: Record<string, number>;
  evolutionCode: { code: string; phase: 'mid' | 'final' } | null;
  clearEvolutionCode: () => void;
  refetch: () => Promise<void>;
  advanceDay: () => Promise<AdvanceDayResult>;
  checkAndEvolve: () => Promise<AdvanceDayResult>;
  resetDate: () => Promise<void>;
  rebornAsEgg: () => Promise<RebornResult>;
  submitNumericValue: (taskId: string, value: number) => Promise<void>;
  clearNumericValue: (taskId: string) => Promise<void>;
}

function toLogLike(amplifyLogs: AmplifyDailyLog[]): DailyLogLike[] {
  const byDate = new Map<string, DailyLogLike>();
  for (const log of amplifyLogs) {
    const entry = byDate.get(log.date) ?? { date: log.date, completedTaskIds: [], numericValues: {} };
    entry.completedTaskIds.push(log.taskId);
    if (log.numericValues) {
      try {
        const nv = typeof log.numericValues === 'string'
          ? JSON.parse(log.numericValues)
          : log.numericValues;
        if (nv && typeof nv === 'object' && !Array.isArray(nv)) {
          for (const [k, v] of Object.entries(nv)) {
            if (typeof v === 'number' && entry.numericValues) {
              entry.numericValues[k] = v;
            }
          }
        }
      } catch { /* skip malformed */ }
    }
    byDate.set(log.date, entry);
  }
  return Array.from(byDate.values());
}

export function useCharacter(enabled: boolean = true): UseCharacterResult {
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [numericValues, setNumericValues] = useState<Record<string, number>>({});
  const [evolutionCode, setEvolutionCode] = useState<{ code: string; phase: 'mid' | 'final' } | null>(null);
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

  // Load today's numeric values from DailyLog
  useEffect(() => {
    if (!enabled) return;
    async function loadNumericValues() {
      try {
        const today = getCurrentDateString();
        const { data } = await client.models.DailyLog.list({
          filter: { date: { eq: today } },
        });
        const parsed: Record<string, number> = {};
        for (const log of data ?? []) {
          if (log.numericValues) {
            try {
              const nv = typeof log.numericValues === 'string'
                ? JSON.parse(log.numericValues)
                : log.numericValues;
              if (nv && typeof nv[log.taskId] === 'number') {
                parsed[log.taskId] = nv[log.taskId];
              }
            } catch { /* skip malformed */ }
          }
        }
        setNumericValues(parsed);
      } catch (err) {
        console.error("[useCharacter] loadNumericValues error:", err);
      }
    }
    loadNumericValues();
  }, [enabled]);

  const today = getCurrentDateString();
  const cycleStartDate = character?.cycleStartDate ?? today;
  const dayNumber = calculateDayNumber(cycleStartDate);
  const stage = getStage(dayNumber);
  const cycleInfo = getCycleInfo(character?.cycleStartDate);

  // Phase-based evolution trigger
  useEffect(() => {
    if (!character || !enabled) return;
    const { phase } = cycleInfo;
    const startDate = character.cycleStartDate;
    const charId = character.id;
    const currentMidType = character.midType;
    const currentFinalType = character.finalType;
    if (!startDate) return;

    const shouldEvolveMid = phase === 'mid' && !currentMidType;
    const shouldEvolveFinal = (phase === 'final' || phase === 'overflow') && !currentFinalType;
    if (!shouldEvolveMid && !shouldEvolveFinal) return;

    let cancelled = false;
    async function runEvolution() {
      try {
        const { data: allLogs } = await client.models.DailyLog.list();
        if (cancelled) return;
        const logs = toLogLike(allLogs ?? []);
        if (shouldEvolveMid) {
          const result = evolveMid(logs, startDate);
          console.log("[useCharacter] evolveMid →", result.code, result.debug);
          const { data: updated } = await client.models.Character.update({
            id: charId,
            stage: 'mid',
            midType: result.code,
          });
          if (!cancelled && updated) {
            setCharacter(updated);
            setEvolutionCode({ code: result.code, phase: 'mid' });
          }
        } else {
          const result = evolveFinal(logs, startDate);
          console.log("[useCharacter] evolveFinal →", result.code, result.debug);
          const { data: updated } = await client.models.Character.update({
            id: charId,
            stage: 'final',
            finalType: result.code,
          });
          if (!cancelled && updated) {
            setCharacter(updated);
            setEvolutionCode({ code: result.code, phase: 'final' });
          }
        }
      } catch (err) {
        console.error("[useCharacter] evolution error:", err);
      }
    }
    runEvolution();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id, cycleInfo.phase, character?.midType, character?.finalType, enabled]);

  const clearEvolutionCode = useCallback(() => setEvolutionCode(null), []);

  const checkAndEvolve = useCallback(async (): Promise<AdvanceDayResult> => {
    // Evolution is now triggered automatically by the phase-based useEffect
    return { evolved: false };
  }, []);

  const advanceDay = useCallback(async (): Promise<AdvanceDayResult> => {
    if (!character) {
      console.log("[advanceDay] character is null, skipping");
      return { evolved: false };
    }
    try {
      const currentDateStr = getCurrentDateString();
      const currentDateObj = new Date(currentDateStr + "T00:00:00Z");
      currentDateObj.setUTCDate(currentDateObj.getUTCDate() + 1);
      const newDateOverride = currentDateObj.toISOString().slice(0, 10);
      setDateOverride(newDateOverride);
      setDateOverrideState(newDateOverride);
      console.log("[advanceDay] dateOverride →", newDateOverride);
      return { evolved: false };
    } catch (err) {
      console.error("[advanceDay] exception:", err);
      return { evolved: false };
    }
  }, [character]);

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
    if (!character) {
      console.log("[rebornAsEgg] character is null, skipping");
      return { success: false };
    }
    const finalType = character.finalType;
    const now = new Date().toISOString();
    const today = getRealCurrentDateString();

    try {
      // Record to CharacterDex only when finalType is set
      if (finalType) {
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
      }

      setDateOverride(null);
      setDateOverrideState(null);
      setEvolutionCode(null);

      const { data: updated } = await client.models.Character.update({
        id: character.id,
        cycleStartDate: today,
        stage: "egg",
        midType: null,
        finalType: null,
      });
      if (updated) setCharacter(updated);

      return { success: true, recordedType: finalType ?? undefined };
    } catch (err) {
      console.error("[rebornAsEgg] error:", err);
      return { success: false };
    }
  }, [character]);

  const submitNumericValue = useCallback(async (taskId: string, value: number) => {
    try {
      const { userId } = await getCurrentUser();
      const today = getCurrentDateString();
      const task = getTaskById(taskId);
      if (!task) return;
      const ratio = calcSleepHoursXp(value);
      const mainPts = Math.round(task.mainXp * ratio);
      const subPts = task.subXp != null ? Math.round(task.subXp * ratio) : 0;

      const { data: existing } = await client.models.DailyLog.list({
        filter: { date: { eq: today }, taskId: { eq: taskId } },
      });

      const numericValuesPayload = JSON.stringify({ [taskId]: value });

      if (existing && existing.length > 0) {
        await client.models.DailyLog.update({
          id: existing[0].id,
          points: mainPts + subPts,
          numericValues: numericValuesPayload,
        });
      } else {
        await client.models.DailyLog.create({
          userId,
          date: today,
          taskId,
          points: mainPts + subPts,
          completedAt: new Date().toISOString(),
          numericValues: numericValuesPayload,
        });
      }

      setNumericValues((prev) => ({ ...prev, [taskId]: value }));
    } catch (err) {
      console.error("[useCharacter] submitNumericValue error:", err);
    }
  }, []);

  const clearNumericValue = useCallback(async (taskId: string) => {
    try {
      const today = getCurrentDateString();
      const { data: existing } = await client.models.DailyLog.list({
        filter: { date: { eq: today }, taskId: { eq: taskId } },
      });
      if (existing && existing.length > 0) {
        await client.models.DailyLog.delete({ id: existing[0].id });
      }
      setNumericValues((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    } catch (err) {
      console.error("[useCharacter] clearNumericValue error:", err);
    }
  }, []);

  return {
    character,
    dayNumber,
    stage,
    cycleInfo,
    midType: character?.midType,
    finalType: character?.finalType,
    cycleStartDate,
    dateOverride,
    isLoading,
    error,
    numericValues,
    evolutionCode,
    clearEvolutionCode,
    refetch: fetchOrCreate,
    advanceDay,
    checkAndEvolve,
    resetDate,
    rebornAsEgg,
    submitNumericValue,
    clearNumericValue,
  };
}

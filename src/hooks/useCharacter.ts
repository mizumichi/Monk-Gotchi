"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { client } from "@/lib/amplifyClient";
import {
  getCurrentDateString,
  getRealCurrentDateString,
  setDateOverride,
} from "@/lib/date";
import { getCycleInfo, type CycleInfo } from "@/lib/cycle";
import { calcSleepHoursXp } from "@/lib/sleepXp";
import { getTaskById } from "@/data/tasks";
import { getTreeRank } from "@/lib/evolution";
import type { Schema } from "../../amplify/data/resource";

type Character = Schema["Character"]["type"];
type AmplifyDailyLog = Schema["DailyLog"]["type"];

export interface HarvestResult {
  success: boolean;
}

export interface UseCharacterResult {
  cycleInfo: CycleInfo;
  cycleStartDate: string;
  dateOverride: string | null;
  isLoading: boolean;
  error: Error | null;
  numericValues: Record<string, number>;
  refetch: () => Promise<void>;
  advanceDay: () => Promise<void>;
  resetDate: () => Promise<void>;
  harvest: (totalScore: number) => Promise<HarvestResult>;
  submitNumericValue: (taskId: string, value: number) => Promise<void>;
  clearNumericValue: (taskId: string) => Promise<void>;
  purgeAllData: () => Promise<void>;
}

export function useCharacter(enabled: boolean = true): UseCharacterResult {
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [numericValues, setNumericValues] = useState<Record<string, number>>({});
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
        const allData: AmplifyDailyLog[] = [];
        let nt: string | null | undefined;
        do {
          const res = await client.models.DailyLog.list({
            filter: { date: { eq: today } },
            ...(nt ? { nextToken: nt } : {}),
          });
          allData.push(...(res.data ?? []));
          nt = res.nextToken;
        } while (nt);
        const parsed: Record<string, number> = {};
        for (const log of allData) {
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
  const cycleInfo = getCycleInfo(character?.cycleStartDate);

  const advanceDay = useCallback(async (): Promise<void> => {
    if (!character) return;
    try {
      const currentDateStr = getCurrentDateString();
      const currentDateObj = new Date(currentDateStr + "T00:00:00Z");
      currentDateObj.setUTCDate(currentDateObj.getUTCDate() + 1);
      const newDateOverride = currentDateObj.toISOString().slice(0, 10);
      setDateOverride(newDateOverride);
      setDateOverrideState(newDateOverride);
      console.log("[advanceDay] dateOverride →", newDateOverride);
    } catch (err) {
      console.error("[advanceDay] exception:", err);
    }
  }, [character]);

  const purgeAllData = useCallback(async (): Promise<void> => {
    if (!character) return;
    try {
      let nt: string | null | undefined;
      do {
        const res = await client.models.DailyLog.list(
          nt ? { nextToken: nt } : {}
        );
        await Promise.all((res.data ?? []).map(log => client.models.DailyLog.delete({ id: log.id })));
        nt = res.nextToken;
      } while (nt);

      const today = getRealCurrentDateString();
      const { data: updated } = await client.models.Character.update({
        id: character.id,
        cycleStartDate: today,
      });
      if (updated) setCharacter(updated);
      setNumericValues({});
      setDateOverride(null);
      setDateOverrideState(null);
    } catch (err) {
      console.error('[purgeAllData] error:', err);
    }
  }, [character]);

  const resetDate = useCallback(async () => {
    if (!character) return;
    try {
      setDateOverride(null);
      setDateOverrideState(null);

      const today = getRealCurrentDateString();
      const { data: updated } = await client.models.Character.update({
        id: character.id,
        cycleStartDate: today,
      });
      if (updated) setCharacter(updated);
    } catch (err) {
      console.error("[resetDate] exception:", err);
    }
  }, [character]);

  const harvest = useCallback(async (totalScore: number): Promise<HarvestResult> => {
    if (!character) return { success: false };
    try {
      const { rank, fruitCount } = getTreeRank(totalScore);
      const harvestedAt = new Date().toISOString();
      const today = getRealCurrentDateString();

      await client.models.Harvest.create({
        harvestedAt,
        cycleStartDate: character.cycleStartDate,
        totalScore,
        rank,
        fruitCount,
      });

      setDateOverride(null);
      setDateOverrideState(null);

      const { data: updated } = await client.models.Character.update({
        id: character.id,
        cycleStartDate: today,
      });
      if (updated) setCharacter(updated);

      return { success: true };
    } catch (err) {
      console.error("[harvest] error:", err);
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
    cycleInfo,
    cycleStartDate,
    dateOverride,
    isLoading,
    error,
    numericValues,
    refetch: fetchOrCreate,
    advanceDay,
    resetDate,
    harvest,
    submitNumericValue,
    clearNumericValue,
    purgeAllData,
  };
}

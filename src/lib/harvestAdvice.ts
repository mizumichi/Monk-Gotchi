"use client";

import { client } from './amplifyClient';
import { getTaskById, calcCategoryScores, type Category } from '@/data/tasks';
import { calcSleepHoursXp } from '@/lib/sleepXp';
import { buildAggregatesForDays, type DailyLogLike } from '@/lib/evolution';

// Matches §4 of PHASE_HARVEST_AI_SPEC.md — numbers only, no free-text fields.
export type HarvestSummary = {
  cycleStartDate: string;
  harvestedAt: string;
  rank: 'low' | 'mid' | 'high';
  fruitCount: number;
  totalScore: number;
  perDay: { day: number; total: number }[];
  perCategory: {
    strength: number; sleep: number; nutrition: number;
    environment: number; mental: number;
  };
  slothDays: number;
  topTasks?: string[];
  mood?: { morningAvg: number; eveningAvg: number };
};

const CATEGORIES: Category[] = ['strength', 'sleep', 'nutrition', 'environment', 'mental'];

// Replicates the internal buildDayScores logic from evolution.ts (not exported).
function computeDayXp(log: DailyLogLike): number {
  const numericForScores: Record<string, number> = {};
  for (const taskId of log.completedTaskIds) {
    const task = getTaskById(taskId);
    if (!task || task.taskKind !== 'numeric') continue;
    const rawValue = log.numericValues?.[taskId];
    if (rawValue == null) continue;
    const ratio = calcSleepHoursXp(rawValue);
    numericForScores[`${taskId}_main`] = Math.round(task.mainXp * ratio);
    if (task.subXp != null) numericForScores[`${taskId}_sub`] = Math.round(task.subXp * ratio);
  }
  const scores = calcCategoryScores(log.completedTaskIds, numericForScores);
  return CATEGORIES.reduce((sum, cat) => sum + scores[cat], 0);
}

function dateToCycleDay(dateStr: string, cycleStartDate: string): number {
  const start = new Date(cycleStartDate + 'T00:00:00Z');
  const d = new Date(dateStr + 'T00:00:00Z');
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// Build a numbers-only summary from the cycle's DailyLog data.
// fullLogs is DailyLogLike[] from useRecentLogs — reusable for G-3 re-generation.
export function buildHarvestSummary(params: {
  fullLogs: DailyLogLike[];
  cycleStartDate: string;
  harvestedAt: string;
  rank: 'low' | 'mid' | 'high';
  fruitCount: number;
  totalScore: number;
}): HarvestSummary {
  const { fullLogs, cycleStartDate, harvestedAt, rank, fruitCount, totalScore } = params;

  const agg = buildAggregatesForDays(fullLogs, cycleStartDate, 7);

  const perDay = fullLogs
    .map(log => ({ day: dateToCycleDay(log.date, cycleStartDate), total: computeDayXp(log) }))
    .filter(({ day }) => day >= 1 && day <= 7)
    .sort((a, b) => a.day - b.day);

  const taskFreq = new Map<string, number>();
  for (const log of fullLogs) {
    for (const taskId of log.completedTaskIds) {
      taskFreq.set(taskId, (taskFreq.get(taskId) ?? 0) + 1);
    }
  }
  const topTasks = [...taskFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return {
    cycleStartDate,
    harvestedAt,
    rank,
    fruitCount,
    totalScore,
    perDay,
    perCategory: agg.earnedXp,
    slothDays: agg.slothDays,
    ...(topTasks.length > 0 ? { topTasks } : {}),
  };
}

// Fire the generateHarvestAdvice mutation.
// Callers may await or fire-and-forget via .catch().
// summary is passed as object — a.json() accepts object directly.
export async function requestHarvestAdvice(harvestId: string, summary: HarvestSummary) {
  return client.mutations.generateHarvestAdvice({ harvestId, summary });
}

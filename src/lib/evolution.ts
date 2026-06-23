import { calcCategoryScores, getTaskById, type Category } from "@/data/tasks";
import { calcSleepHoursXp } from "@/lib/sleepXp";

// ── 入力型 ────────────────────────────────────────────────────────────────────

export interface DailyLogLike {
  date: string;
  completedTaskIds: string[];
  numericValues?: Record<string, number> | null;
}

// ── 定数 ──────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ['strength', 'sleep', 'nutrition', 'environment', 'mental'];

// 44パターンのシミュレーションで確定した7日間の MaxPossible
const MAX_POSSIBLE_7DAY: Record<Category, number> = {
  strength:     800,
  sleep:        918,
  nutrition:    995,
  environment:  377,
  mental:      1077,
};

// full_day 判定: 1日あたりこれ以上獲得でそのカテゴリ達成とみなす
const DAILY_TARGET: Record<Category, number> = {
  strength:    30,
  sleep:       35,
  nutrition:   30,
  environment: 10,
  mental:      20,
};

// 1日合計XP がこの値未満ならサボり日
const SLOTH_THRESHOLD = 30;

function maxPossibleForDays(days: number): Record<Category, number> {
  const ratio = days / 7;
  return {
    strength:    Math.round(MAX_POSSIBLE_7DAY.strength    * ratio),
    sleep:       Math.round(MAX_POSSIBLE_7DAY.sleep       * ratio),
    nutrition:   Math.round(MAX_POSSIBLE_7DAY.nutrition   * ratio),
    environment: Math.round(MAX_POSSIBLE_7DAY.environment * ratio),
    mental:      Math.round(MAX_POSSIBLE_7DAY.mental      * ratio),
  };
}

// ── 集計ヘルパー ──────────────────────────────────────────────────────────────

export interface Aggregates {
  earnedXp: Record<Category, number>;
  pcts: Record<Category, number>;
  slothDays: number;
  fullDays: number;
  daysCount: number;
}

function buildDayScores(day: DailyLogLike): Record<Category, number> {
  const numericForScores: Record<string, number> = {};
  for (const taskId of day.completedTaskIds) {
    const task = getTaskById(taskId);
    if (!task || task.taskKind !== 'numeric') continue;
    const rawValue = day.numericValues?.[taskId];
    if (rawValue == null) continue;
    const ratio = calcSleepHoursXp(rawValue);
    numericForScores[`${taskId}_main`] = Math.round(task.mainXp * ratio);
    if (task.subXp != null) numericForScores[`${taskId}_sub`] = Math.round(task.subXp * ratio);
  }
  return calcCategoryScores(day.completedTaskIds, numericForScores);
}

function buildAggregates(logs: DailyLogLike[], daysCount: number): Aggregates {
  const earnedXp: Record<Category, number> = {
    strength: 0, sleep: 0, nutrition: 0, environment: 0, mental: 0,
  };
  let slothDays = 0;
  let fullDays = 0;

  for (const day of logs) {
    const dayScores = buildDayScores(day);
    const dayTotal = CATEGORIES.reduce((sum, cat) => sum + dayScores[cat], 0);
    for (const cat of CATEGORIES) earnedXp[cat] += dayScores[cat];
    if (dayTotal < SLOTH_THRESHOLD) slothDays++;
    if (CATEGORIES.every(cat => dayScores[cat] >= DAILY_TARGET[cat])) fullDays++;
  }

  const maxPoss = maxPossibleForDays(daysCount);
  const pcts = {} as Record<Category, number>;
  for (const cat of CATEGORIES) {
    pcts[cat] = earnedXp[cat] / maxPoss[cat];
  }

  return { earnedXp, pcts, slothDays, fullDays, daysCount };
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function filterLogsToWindow(
  logs: DailyLogLike[],
  cycleStartDate: string,
  daysCount: number,
): DailyLogLike[] {
  const endDate = addDaysToDateStr(cycleStartDate, daysCount - 1);
  return logs.filter(log => log.date >= cycleStartDate && log.date <= endDate);
}

// デバッグ・テスト用の集計公開関数
export function buildAggregatesForDays(
  logs: DailyLogLike[],
  cycleStartDate: string,
  daysCount: number,
): Aggregates {
  return buildAggregates(filterLogsToWindow(logs, cycleStartDate, daysCount), daysCount);
}

// ── 木の育成ランク判定 ────────────────────────────────────────────────────────

export type TreeRank = 'low' | 'mid' | 'high';

export interface TreeResult {
  rank: TreeRank;
  fruitCount: number;
}

// score = 現在サイクルの累計XP
export function getTreeRank(score: number): TreeResult {
  if (score < 350) return { rank: 'low',  fruitCount: 1 };
  if (score < 700) return { rank: 'mid',  fruitCount: 3 };
  const f = Math.min(12, Math.round(6 + ((score - 700) / 350) * 6));
  return { rank: 'high', fruitCount: f };
}

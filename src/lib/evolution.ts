import { calcCategoryScores, getTaskById, type Category } from "@/data/tasks";
import { calcSleepHoursXp } from "@/lib/sleepXp";
import { calculateDayNumber, getStage } from "@/lib/date";
import type { Schema } from "../../amplify/data/resource";

// ── 入力型 ────────────────────────────────────────────────────────────────────

export interface DailyLogLike {
  date: string;
  completedTaskIds: string[];
  numericValues?: Record<string, number> | null;
}

// ── 出力型 ────────────────────────────────────────────────────────────────────

export type MidCharacterCode = 'Wakaki-Monk' | 'Heibon-Monk' | 'Daraku-Monk';

export type FinalCharacterCode =
  | 'Sage-Monk' | 'Overlord-Monk' | 'Hermit-Monk' | 'Wise-Monk' | 'Zen-Master' | 'Sun-Sage'
  | 'Guardian' | 'Warrior' | 'Ascetic' | 'Scholar' | 'Dreamer' | 'Walker' | 'Average-San'
  | 'Burnout-Monk' | 'Otaku-Monk' | 'Insomnia-Warrior' | 'Debuchi-Monk' | 'Slothchi-King';

export type FinalTier = 'legendary' | 'standard' | 'humorous';

export interface MidEvolutionResult {
  code: MidCharacterCode;
  rank: 'good' | 'normal' | 'bad';
  debug?: { avgPct: number; slothDays: number };
}

export interface FinalEvolutionResult {
  code: FinalCharacterCode;
  tier: FinalTier;
  debug?: {
    pcts: Record<Category, number>;
    totalPct: number;
    slothDays: number;
    fullDays: number;
  };
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

// 特化判定マップ(legendary / standard)
const SPECIALIST_MAP: Record<Category, FinalCharacterCode> = {
  strength:    'Overlord-Monk',
  nutrition:   'Hermit-Monk',
  mental:      'Wise-Monk',
  sleep:       'Zen-Master',
  environment: 'Sun-Sage',
};

const STANDARD_MAP: Record<Category, FinalCharacterCode> = {
  strength:    'Warrior',
  nutrition:   'Ascetic',
  mental:      'Scholar',
  sleep:       'Dreamer',
  environment: 'Walker',
};

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

// ── 中期判定(Day 1-4) ────────────────────────────────────────────────────────

export function evolveMid(logs: DailyLogLike[], cycleStartDate: string): MidEvolutionResult {
  const filtered = filterLogsToWindow(logs, cycleStartDate, 4);
  const { pcts, slothDays } = buildAggregates(filtered, 4);

  const avgPct = CATEGORIES.reduce((sum, cat) => sum + pcts[cat], 0) / CATEGORIES.length;
  const debug = { avgPct, slothDays };

  // 良: 平均50%以上 かつ サボり1日以内
  if (avgPct >= 0.50 && slothDays <= 1) {
    return { code: 'Wakaki-Monk', rank: 'good', debug };
  }
  // 悪: 平均25%未満 または サボり3日以上
  if (avgPct < 0.25 || slothDays >= 3) {
    return { code: 'Daraku-Monk', rank: 'bad', debug };
  }
  // 普通
  return { code: 'Heibon-Monk', rank: 'normal', debug };
}

// ── 最終判定(Day 1-7) ────────────────────────────────────────────────────────

export function evolveFinal(logs: DailyLogLike[], cycleStartDate: string): FinalEvolutionResult {
  const filtered = filterLogsToWindow(logs, cycleStartDate, 7);
  const { pcts, slothDays, fullDays } = buildAggregates(filtered, 7);

  const totalPct  = CATEGORIES.reduce((sum, cat) => sum + pcts[cat], 0) / CATEGORIES.length;
  const maxCat    = CATEGORIES.reduce((a, b) => pcts[a] >= pcts[b] ? a : b);
  const maxPct    = pcts[maxCat];
  const minPct    = Math.min(...CATEGORIES.map(cat => pcts[cat]));
  const highAxes  = CATEGORIES.filter(cat => pcts[cat] >= 0.60).length;
  const debug     = { pcts, totalPct, slothDays, fullDays };

  const legendary = (code: FinalCharacterCode): FinalEvolutionResult => ({ code, tier: 'legendary', debug });
  const standard  = (code: FinalCharacterCode): FinalEvolutionResult => ({ code, tier: 'standard',  debug });
  const humorous  = (code: FinalCharacterCode): FinalEvolutionResult => ({ code, tier: 'humorous',  debug });

  // ── 1. LEGENDARY ──
  const legendaryBase = fullDays >= 4 && slothDays === 0;
  if (legendaryBase) {
    // 1a. 聖僧: 全軸均等高水準
    if (minPct >= 0.65 && totalPct >= 0.72) {
      return legendary('Sage-Monk');
    }
    // 1b. 5種特化: 最強軸が80%以上 かつ 最弱軸45%以上
    if (maxPct >= 0.80 && minPct >= 0.45) {
      return legendary(SPECIALIST_MAP[maxCat]);
    }
    // 1c. 高水準バランス救済: 3軸60%以上 かつ 最弱45%以上 かつ 平均60%以上
    if (highAxes >= 3 && minPct >= 0.45 && totalPct >= 0.60) {
      return legendary('Sage-Monk');
    }
  }

  // ── 2. STANDARD ──
  // 2a. 高位守護者: 平均55%以上 かつ 最弱40%以上 かつ サボり2日以内
  if (totalPct >= 0.55 && minPct >= 0.40 && slothDays <= 2) {
    return standard('Guardian');
  }
  // 2b. 5種特化: 最強軸60%以上 かつ サボり3日以内
  if (maxPct >= 0.60 && slothDays <= 3) {
    return standard(STANDARD_MAP[maxCat]);
  }
  // 2c. 中位守護者: 平均40%以上 かつ 最弱25%以上 かつ サボり3日以内
  if (totalPct >= 0.40 && minPct >= 0.25 && slothDays <= 3) {
    return standard('Guardian');
  }
  // 2d. 普通おじさん: 平均30%以上 かつ サボり3日以内
  if (totalPct >= 0.30 && slothDays <= 3) {
    return standard('Average-San');
  }

  // ── 3. HUMOROUS ──
  // 3a. 燃え尽き/オタク: 1軸突出 かつ 最弱10%未満
  if (maxPct >= 0.45 && minPct < 0.10) {
    if (maxCat === 'strength') return humorous('Burnout-Monk');
    if (maxCat === 'mental')   return humorous('Otaku-Monk');
  }
  // 3b. 不眠戦士: 筋トレそこそこ かつ 睡眠20%未満
  if (pcts.strength >= 0.30 && pcts.sleep < 0.20) {
    return humorous('Insomnia-Warrior');
  }
  // 3c. デブチ: 栄養そこそこ かつ 筋トレ15%未満
  if (pcts.nutrition >= 0.40 && pcts.strength < 0.15) {
    return humorous('Debuchi-Monk');
  }
  // 3d. デフォルト
  return humorous('Slothchi-King');
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

// ── 互換ラッパー(D-4 で置き換える) ─────────────────────────────────────────

type AmplifyDailyLog = Schema["DailyLog"]["type"];
type AmplifyCharacter = Schema["Character"]["type"];

export interface EvolutionResult {
  stage: string;
  midType?: string;
  finalType?: string;
}

function toDailyLogLike(amplifyLogs: AmplifyDailyLog[]): DailyLogLike[] {
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

export function checkEvolution(
  character: AmplifyCharacter,
  allLogs: AmplifyDailyLog[],
): EvolutionResult | null {
  const dayNumber = calculateDayNumber(character.cycleStartDate);
  const newStage = getStage(dayNumber);
  if (newStage === character.stage) return null;

  const logs = toDailyLogLike(allLogs);

  if (newStage === 'early') {
    // baby(旧 early)ステージ移行: 進化判定なし
    return { stage: newStage };
  }

  if (newStage === 'mid') {
    const result = evolveMid(logs, character.cycleStartDate);
    return { stage: newStage, midType: result.code };
  }

  if (newStage === 'final') {
    const result = evolveFinal(logs, character.cycleStartDate);
    return { stage: newStage, finalType: result.code };
  }

  return { stage: newStage };
}

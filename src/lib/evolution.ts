import { TASKS, type CategoryId } from "@/data/tasks";
import { calculateDayNumber, getStage } from "@/lib/date";
import type { Schema } from "../../amplify/data/resource";

type DailyLog = Schema["DailyLog"]["type"];
type Character = Schema["Character"]["type"];

export type MidType = "excellent" | "normal" | "lazy";
export type FinalType =
  | "sage"
  | "overlord"
  | "hermit"
  | "wise"
  | "guardian"
  | "warrior"
  | "average"
  | "slothking";

// 進化判定の閾値 (ここを変えるだけでバランス調整できる)
const THRESHOLD = {
  MID_EXCELLENT: 600,
  MID_NORMAL: 200,
  FINAL_SAGE_MIN_CATEGORY: 200,
  FINAL_SAGE_MIN_TOTAL: 2000,
  FINAL_DOMINANT_RATIO: 0.4,
  FINAL_WARRIOR: 1500,
} as const;

export function determineMidType(totalScore: number): MidType {
  if (totalScore >= THRESHOLD.MID_EXCELLENT) return "excellent";
  if (totalScore >= THRESHOLD.MID_NORMAL) return "normal";
  return "lazy";
}

function computeCategoryScores(logs: DailyLog[]): Record<CategoryId, number> {
  const scores: Record<CategoryId, number> = {
    exercise: 0,
    sleep: 0,
    nutrition: 0,
    sunlight: 0,
    mental: 0,
  };
  for (const log of logs) {
    const task = TASKS.find((t) => t.id === log.taskId);
    if (task) scores[task.category] += log.points;
  }
  return scores;
}

export function determineFinalType(
  midType: MidType,
  totalScore: number,
  categoryScores: Record<CategoryId, number>
): FinalType {
  if (midType === "excellent") {
    const allAbove200 = Object.values(categoryScores).every(
      (s) => s >= THRESHOLD.FINAL_SAGE_MIN_CATEGORY
    );
    if (allAbove200 && totalScore >= THRESHOLD.FINAL_SAGE_MIN_TOTAL) {
      return "sage";
    }

    const entries = Object.entries(categoryScores) as [CategoryId, number][];
    const maxScore = Math.max(...entries.map(([, s]) => s));
    const dominant = entries.find(([, s]) => s === maxScore)?.[0];

    if (dominant && maxScore >= totalScore * THRESHOLD.FINAL_DOMINANT_RATIO) {
      if (dominant === "exercise") return "overlord";
      if (dominant === "nutrition") return "hermit";
      if (dominant === "mental") return "wise";
      if (dominant === "sleep" || dominant === "sunlight") return "guardian";
    }
    return "guardian";
  }

  if (midType === "normal") {
    return totalScore >= THRESHOLD.FINAL_WARRIOR ? "warrior" : "average";
  }

  // lazy
  return "slothking";
}

export interface EvolutionResult {
  stage: string;
  midType?: MidType;
  finalType?: FinalType;
}

export function checkEvolution(
  character: Character,
  allLogs: DailyLog[]
): EvolutionResult | null {
  const dayNumber = calculateDayNumber(character.cycleStartDate);
  const newStage = getStage(dayNumber);

  if (newStage === character.stage) return null;

  const totalScore = allLogs.reduce((sum, log) => sum + log.points, 0);

  if (newStage === "mid") {
    return { stage: newStage, midType: determineMidType(totalScore) };
  }

  if (newStage === "final") {
    const categoryScores = computeCategoryScores(allLogs);
    const midType =
      (character.midType as MidType | null | undefined) ??
      determineMidType(totalScore);
    return {
      stage: newStage,
      finalType: determineFinalType(midType, totalScore, categoryScores),
    };
  }

  return { stage: newStage };
}

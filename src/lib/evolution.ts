import { calcCategoryScores, calcTotalXp, type Category } from "@/data/tasks";
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

// 進化判定の閾値 (C-3 で再計算予定)
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

export function determineFinalType(
  midType: MidType,
  totalScore: number,
  categoryScores: Record<Category, number>
): FinalType {
  if (midType === "excellent") {
    const allAbove200 = Object.values(categoryScores).every(
      (s) => s >= THRESHOLD.FINAL_SAGE_MIN_CATEGORY
    );
    if (allAbove200 && totalScore >= THRESHOLD.FINAL_SAGE_MIN_TOTAL) {
      return "sage";
    }

    const entries = Object.entries(categoryScores) as [Category, number][];
    const maxScore = Math.max(...entries.map(([, s]) => s));
    const dominant = entries.find(([, s]) => s === maxScore)?.[0];

    if (dominant && maxScore >= totalScore * THRESHOLD.FINAL_DOMINANT_RATIO) {
      if (dominant === "strength") return "overlord";
      if (dominant === "nutrition") return "hermit";
      if (dominant === "mental") return "wise";
      if (dominant === "sleep" || dominant === "environment") return "guardian";
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

  const taskIds = allLogs.map((l) => l.taskId);
  const totalScore = calcTotalXp(taskIds);

  if (newStage === "mid") {
    return { stage: newStage, midType: determineMidType(totalScore) };
  }

  if (newStage === "final") {
    const categoryScores = calcCategoryScores(taskIds);
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

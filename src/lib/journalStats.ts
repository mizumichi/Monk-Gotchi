export type Slot = "morning" | "evening";
export type RangeLabel = "1週間" | "2週間" | "1ヶ月";

export interface JournalEntry {
  id: string;
  date: string;        // "2026-06-23"
  slot: Slot;
  mood: number;        // 1-10
  text: string | null;
}

export const RANGE_DAYS: Record<RangeLabel, number> = {
  "1週間": 7,
  "2週間": 14,
  "1ヶ月": 30,
};

export const MOOD_LABELS: Record<number, string> = {
  1: "最悪", 2: "かなり悪い", 3: "悪い", 4: "やや悪い", 5: "普通",
  6: "まあまあ", 7: "良い", 8: "かなり良い", 9: "とても良い", 10: "最高",
};

export function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.slot === "morning" ? -1 : 1;
  });
}

export function filterByRange(entries: JournalEntry[], days: number): JournalEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return entries.filter((e) => e.date >= cutoffStr);
}

export function computeStats(entries: JournalEntry[]): {
  avgMood: number;
  bestMood: number;
  recordedDays: number;
} {
  if (entries.length === 0) return { avgMood: 0, bestMood: 0, recordedDays: 0 };
  const avg = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
  const best = Math.max(...entries.map((e) => e.mood));
  const days = new Set(entries.map((e) => e.date)).size;
  return {
    avgMood: Math.round(avg * 10) / 10,
    bestMood: best,
    recordedDays: days,
  };
}

// morningIndex: 0-based index among morning entries only
export function shouldShowTick(morningIndex: number, rangeLabel: RangeLabel): boolean {
  const everyN = rangeLabel === "1週間" ? 2 : rangeLabel === "2週間" ? 3 : 7;
  return morningIndex % everyN === 0;
}

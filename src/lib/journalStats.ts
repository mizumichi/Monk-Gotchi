export type Slot = "morning" | "evening";
export type RangeLabel = "1週間" | "2週間" | "1ヶ月";

export interface JournalEntry {
  id: string;
  date: string;        // "2026-06-23"
  slot: Slot;
  mood: number;        // 1-10
  text: string | null;
}

// X軸の固定スロット（エントリなし = mood: null）
export interface ChartSlot {
  date: string;
  slot: Slot;
  mood: number | null;
  text: string | null;
  entryId: string | null;
  showTick: boolean;
  label: string;       // "6/23"
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

export function fmtShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

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
} {
  if (entries.length === 0) return { avgMood: 0, bestMood: 0 };
  const avg = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
  const best = Math.max(...entries.map((e) => e.mood));
  return {
    avgMood: Math.round(avg * 10) / 10,
    bestMood: best,
  };
}

// morningIndex: 朝エントリの中での0始まりインデックス
export function shouldShowTick(morningIndex: number, rangeLabel: RangeLabel): boolean {
  const everyN = rangeLabel === "1週間" ? 2 : rangeLabel === "2週間" ? 3 : 7;
  return morningIndex % everyN === 0;
}

// 選択範囲分の全スロット（空枠含む）を生成。today = "YYYY-MM-DD"
export function generateSlotsForRange(
  days: number,
  rangeLabel: RangeLabel,
  today: string,
): ChartSlot[] {
  const slots: ChartSlot[] = [];
  let morningCount = 0;

  for (let i = days - 1; i >= 0; i--) {
    // noon UTCで計算してUTCDate操作するとDSTの影響を受けない
    const d = new Date(today + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = fmtShort(dateStr);

    for (const slot of ["morning", "evening"] as Slot[]) {
      const isMorning = slot === "morning";
      const morningIdx = isMorning ? morningCount : -1;
      if (isMorning) morningCount++;
      const showTick = isMorning && morningIdx >= 0 && shouldShowTick(morningIdx, rangeLabel);
      slots.push({ date: dateStr, slot, mood: null, text: null, entryId: null, showTick, label });
    }
  }
  return slots;
}

// スロットに実際のエントリを埋め込む
export function mergeWithEntries(slots: ChartSlot[], entries: JournalEntry[]): ChartSlot[] {
  const entryMap = new Map(entries.map((e) => [`${e.date}-${e.slot}`, e]));
  return slots.map((s) => {
    const e = entryMap.get(`${s.date}-${s.slot}`);
    if (!e) return s;
    return { ...s, mood: e.mood, text: e.text, entryId: e.id };
  });
}

// 連続記録日数（今日または昨日まで途切れず記録があった日数）
export function computeConsecutiveDays(entries: JournalEntry[], today: string): number {
  if (entries.length === 0) return 0;
  const recordedDates = new Set(entries.map((e) => e.date));

  const todayD = new Date(today + "T12:00:00Z");
  const yesterdayD = new Date(todayD);
  yesterdayD.setUTCDate(yesterdayD.getUTCDate() - 1);
  const yesterdayStr = yesterdayD.toISOString().slice(0, 10);

  // 今日記録済みならそこから、なければ昨日から
  let startStr: string;
  if (recordedDates.has(today)) {
    startStr = today;
  } else if (recordedDates.has(yesterdayStr)) {
    startStr = yesterdayStr;
  } else {
    return 0;
  }

  let streak = 0;
  const check = new Date(startStr + "T12:00:00Z");
  while (recordedDates.has(check.toISOString().slice(0, 10))) {
    streak++;
    check.setUTCDate(check.getUTCDate() - 1);
  }
  return streak;
}

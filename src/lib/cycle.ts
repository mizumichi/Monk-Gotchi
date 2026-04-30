import { getCurrentDateString } from './date';

export type CyclePhase = 'egg' | 'baby' | 'mid' | 'final' | 'rest' | 'overflow';

export interface CycleInfo {
  dayN: number;
  phase: CyclePhase;
  totalDays: 8;
  startDate: string;
  isOverflow: boolean;
}

export function dateDiffDays(fromDate: string, toDate: string): number {
  const d1 = new Date(fromDate + 'T00:00:00Z');
  const d2 = new Date(toDate + 'T00:00:00Z');
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCycleInfo(cycleStartDate: string | null | undefined): CycleInfo {
  const today = getCurrentDateString();
  const startDate = cycleStartDate ?? today;
  const elapsed = dateDiffDays(startDate, today);
  const dayN = elapsed + 1;

  let phase: CyclePhase;
  if (dayN <= 1) {
    phase = 'egg';
  } else if (dayN <= 4) {
    phase = 'baby';
  } else if (dayN <= 7) {
    phase = 'mid';
  } else if (dayN === 8) {
    phase = 'final';
  } else {
    phase = 'overflow';
  }

  return {
    dayN: Math.max(1, dayN),
    phase,
    totalDays: 8,
    startDate,
    isOverflow: dayN > 8,
  };
}

export function formatDayLabel(info: CycleInfo): string {
  if (info.isOverflow) {
    return `Day 8/8 (休憩中)`;
  }
  return `Day ${info.dayN}/${info.totalDays}`;
}

export function getNewCycleStartDate(): string {
  return getCurrentDateString();
}

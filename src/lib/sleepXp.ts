export function calcSleepHoursXp(hours: number): number {
  if (hours >= 7 && hours <= 9) return 1.0;
  if (hours > 9 && hours <= 10) return 0.7;
  if (hours >= 6 && hours < 7) return 0.6;
  if (hours > 10) return 0.4;
  return 0.0; // < 6h
}

export function getSleepHoursLabel(hours: number): { label: string; color: string } {
  if (hours >= 7 && hours <= 9) return { label: '理想的', color: '#22c55e' };
  if (hours > 9 && hours <= 10) return { label: 'やや過剰', color: '#f59e0b' };
  if (hours >= 6 && hours < 7) return { label: '不足ぎみ', color: '#f59e0b' };
  if (hours > 10) return { label: '過剰', color: '#ef4444' };
  return { label: '危険', color: '#ef4444' };
}

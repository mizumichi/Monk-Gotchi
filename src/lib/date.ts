let _moduleOverride: string | null = null;

export function setDateOverride(date: string | null): void {
  _moduleOverride = date;
  if (typeof window !== "undefined") {
    if (date) localStorage.setItem("dateOverride", date);
    else localStorage.removeItem("dateOverride");
  }
}

// オーバーライドを無視して実際のJST朝4時リセット日付を返す
export function getRealCurrentDateString(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const adjusted = new Date(jst.getTime() - 4 * 60 * 60 * 1000);
  return adjusted.toISOString().slice(0, 10);
}

// オーバーライドがあればそれを優先する
export function getCurrentDateString(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("dateOverride");
    if (stored) return stored;
  }
  if (_moduleOverride) return _moduleOverride;
  return getRealCurrentDateString();
}

// 後方互換: 00:00リセット版 (既存コードで参照されている場合のため残す)
export function getTodayString(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// cycleStartDate (YYYY-MM-DD) からの経過日数を 1 始まりで返す
export function calculateDayNumber(cycleStartDate: string): number {
  const today = getCurrentDateString();
  const start = new Date(cycleStartDate + "T00:00:00Z");
  const current = new Date(today + "T00:00:00Z");
  const diffDays = Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, diffDays + 1);
}

export type Stage = "egg" | "early" | "mid" | "final";

export function getStage(dayNumber: number): Stage {
  if (dayNumber === 1) return "egg";
  if (dayNumber <= 3) return "early";
  if (dayNumber <= 6) return "mid";
  return "final";
}

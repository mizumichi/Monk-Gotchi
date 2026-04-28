import type { Task } from '@/data/tasks';

export interface DailyLogSummary {
  date: string;
  completedTaskIds: string[];
}

export interface ConstraintResult {
  blocked: boolean;
  reason?: string;
  achievementCount?: number;
  cycleLimit?: number;
}

export function checkConstraint(
  task: Task,
  recentLogs: DailyLogSummary[],
  today: string
): ConstraintResult {
  if (!task.constraints) {
    return { blocked: false };
  }

  if (task.constraints.noNextDay) {
    const yesterday = addDays(today, -1);
    const yesterdayLog = recentLogs.find((log) => log.date === yesterday);
    if (yesterdayLog?.completedTaskIds.includes(task.id)) {
      return {
        blocked: true,
        reason: '昨日実施済みのため、今日は休息日です。',
      };
    }
  }

  if (task.constraints.cycleLimit !== undefined) {
    const count = countAchievements(task.id, recentLogs, today);
    if (count >= task.constraints.cycleLimit) {
      return {
        blocked: true,
        reason: `過去7日で${count}回達成済みです(上限${task.constraints.cycleLimit}回)`,
        achievementCount: count,
        cycleLimit: task.constraints.cycleLimit,
      };
    }
    return {
      blocked: false,
      achievementCount: count,
      cycleLimit: task.constraints.cycleLimit,
    };
  }

  return { blocked: false };
}

function countAchievements(
  taskId: string,
  recentLogs: DailyLogSummary[],
  today: string
): number {
  const sevenDaysAgo = addDays(today, -6);
  return recentLogs.filter((log) => {
    if (log.date < sevenDaysAgo || log.date > today) return false;
    return log.completedTaskIds.includes(taskId);
  }).length;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

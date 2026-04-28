'use client';

import { useEffect, useState, useCallback } from 'react';
import { client } from '@/lib/amplifyClient';
import type { DailyLogSummary } from '@/lib/constraints';
import { getTodayString, addDays } from '@/lib/constraints';

// today を外から受け取ることで dateOverride に対応する
export function useRecentLogs(enabled: boolean = true, days: number = 7, today?: string) {
  const [logs, setLogs] = useState<DailyLogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const effectiveToday = today ?? getTodayString();
      const startDate = addDays(effectiveToday, -(days - 1));

      const { data } = await client.models.DailyLog.list({
        filter: {
          date: { between: [startDate, effectiveToday] },
        },
      });

      const byDate = new Map<string, string[]>();
      for (const log of data ?? []) {
        const existing = byDate.get(log.date) ?? [];
        existing.push(log.taskId);
        byDate.set(log.date, existing);
      }

      const summaries: DailyLogSummary[] = Array.from(byDate.entries()).map(
        ([date, completedTaskIds]) => ({ date, completedTaskIds })
      );

      setLogs(summaries);
    } catch (e) {
      console.error('useRecentLogs fetch error:', e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [days, today]);

  useEffect(() => {
    if (!enabled) return;
    fetchLogs();
  }, [enabled, fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { client } from '@/lib/amplifyClient';
import type { DailyLogSummary } from '@/lib/constraints';
import { getTodayString, addDays } from '@/lib/constraints';

export function useRecentLogs(enabled: boolean = true, days: number = 7) {
  const [logs, setLogs] = useState<DailyLogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const today = getTodayString();
      const startDate = addDays(today, -(days - 1));

      const { data } = await client.models.DailyLog.list({
        filter: {
          date: { between: [startDate, today] },
        },
      });

      // Group by date: each date → set of completed task IDs
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
  }, [days]);

  useEffect(() => {
    if (!enabled) return;
    fetchLogs();
  }, [enabled, fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { client } from '@/lib/amplifyClient';
import type { DailyLogSummary } from '@/lib/constraints';
import { getTodayString, addDays } from '@/lib/constraints';
import type { Schema } from '../../amplify/data/resource';

type DailyLogRecord = Schema['DailyLog']['type'];

export interface RecentLogEntry extends DailyLogSummary {
  numericValues?: Record<string, number>;
}

export function useRecentLogs(enabled: boolean = true, cycleStartDate?: string, today?: string) {
  const [logs, setLogs] = useState<DailyLogSummary[]>([]);
  const [fullLogs, setFullLogs] = useState<RecentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const effectiveToday = today ?? getTodayString();
      const startDate = cycleStartDate ?? addDays(effectiveToday, -6);

      const allData: DailyLogRecord[] = [];
      let nt: string | null | undefined;
      do {
        const res = await client.models.DailyLog.list({
          filter: { date: { between: [startDate, effectiveToday] } },
          ...(nt ? { nextToken: nt } : {}),
        });
        allData.push(...(res.data ?? []));
        nt = res.nextToken;
      } while (nt);

      const byDate = new Map<string, { completedTaskIds: string[]; numericValues: Record<string, number> }>();
      for (const log of allData) {
        const existing = byDate.get(log.date) ?? { completedTaskIds: [], numericValues: {} };
        existing.completedTaskIds.push(log.taskId);
        if (log.numericValues) {
          try {
            const nv = typeof log.numericValues === 'string'
              ? JSON.parse(log.numericValues)
              : log.numericValues;
            if (nv && typeof nv === 'object' && !Array.isArray(nv)) {
              for (const [k, v] of Object.entries(nv)) {
                if (typeof v === 'number') existing.numericValues[k] = v;
              }
            }
          } catch { /* skip malformed */ }
        }
        byDate.set(log.date, existing);
      }

      const entries: RecentLogEntry[] = Array.from(byDate.entries()).map(
        ([date, { completedTaskIds, numericValues }]) => ({ date, completedTaskIds, numericValues })
      );

      setLogs(entries.map(({ date, completedTaskIds }) => ({ date, completedTaskIds })));
      setFullLogs(entries);
    } catch (e) {
      console.error('useRecentLogs fetch error:', e);
      setLogs([]);
      setFullLogs([]);
    } finally {
      setLoading(false);
    }
  }, [cycleStartDate, today]);

  useEffect(() => {
    if (!enabled) return;
    fetchLogs();
  }, [enabled, fetchLogs]);

  return { logs, fullLogs, loading, refetch: fetchLogs };
}

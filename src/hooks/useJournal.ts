'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { client } from '@/lib/amplifyClient';

type Slot = 'morning' | 'evening';

interface JournalEntry {
  id: string;
  mood: number;
  text: string | null;
}

type JournalState = Record<Slot, JournalEntry | null>;

export function useJournal(today: string) {
  const [journals, setJournals] = useState<JournalState>({ morning: null, evening: null });
  const [loading, setLoading] = useState(true);

  const fetchJournals = useCallback(async () => {
    try {
      const { data } = await client.models.Journal.list({
        filter: { date: { eq: today } },
      });
      const state: JournalState = { morning: null, evening: null };
      for (const j of data ?? []) {
        const slot = j.slot as Slot;
        if (slot === 'morning' || slot === 'evening') {
          state[slot] = { id: j.id, mood: j.mood, text: j.text ?? null };
        }
      }
      setJournals(state);
    } catch (e) {
      console.error('useJournal fetchJournals error:', e);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const saveJournal = useCallback(
    async (slot: Slot, mood: number, text: string): Promise<{ created: boolean }> => {
      const existing = journals[slot];
      try {
        if (existing) {
          await client.models.Journal.update({ id: existing.id, mood, text });
          setJournals((prev) => ({
            ...prev,
            [slot]: { id: existing.id, mood, text },
          }));
          return { created: false };
        } else {
          const { data } = await client.models.Journal.create({ date: today, slot, mood, text });
          if (data) {
            setJournals((prev) => ({
              ...prev,
              [slot]: { id: data.id, mood, text },
            }));
          }
          return { created: true };
        }
      } catch (e) {
        console.error('useJournal saveJournal error:', e);
        return { created: false };
      }
    },
    [today, journals]
  );

  const deleteJournal = useCallback(
    async (slot: Slot): Promise<void> => {
      const existing = journals[slot];
      if (!existing) return;
      try {
        await client.models.Journal.delete({ id: existing.id });
        setJournals((prev) => ({ ...prev, [slot]: null }));
      } catch (e) {
        console.error('useJournal deleteJournal error:', e);
      }
    },
    [journals]
  );

  return { journals, saveJournal, deleteJournal, loading, refetch: fetchJournals };
}

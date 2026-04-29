'use client';

import { useEffect, useState, useCallback } from 'react';
import { client } from '@/lib/amplifyClient';

export function useUserSettings() {
  const [favoriteTaskIds, setFavoriteTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data } = await client.models.UserSettings.list({});
        if (data && data.length > 0) {
          const settings = data[0];
          setRecordId(settings.id);
          setFavoriteTaskIds(settings.favoriteTaskIds?.filter(Boolean) as string[] ?? []);
        } else {
          const { data: created } = await client.models.UserSettings.create({
            favoriteTaskIds: [],
          });
          if (created) {
            setRecordId(created.id);
            setFavoriteTaskIds([]);
          }
        }
      } catch (e) {
        console.error('useUserSettings init error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const isFavorite = useCallback(
    (taskId: string) => favoriteTaskIds.includes(taskId),
    [favoriteTaskIds]
  );

  const toggleFavorite = useCallback(
    async (taskId: string) => {
      if (!recordId) return;

      const prev = favoriteTaskIds;
      const next = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];

      setFavoriteTaskIds(next);

      try {
        await client.models.UserSettings.update({
          id: recordId,
          favoriteTaskIds: next,
        });
      } catch (e) {
        console.error('toggleFavorite error:', e);
        setFavoriteTaskIds(prev);
      }
    },
    [recordId, favoriteTaskIds]
  );

  return { favoriteTaskIds, isFavorite, toggleFavorite, loading };
}

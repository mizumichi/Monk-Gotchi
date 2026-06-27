'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { client } from '@/lib/amplifyClient';
import { getCurrentDateString } from '@/lib/date';
import type { Schema } from '../../amplify/data/resource';

type UserRecord = Schema["User"]["type"];
type PublicProfileRecord = Schema["PublicProfile"]["type"];

export interface FriendEntry {
  id: string;
  userId: string;
  nickname: string | null | undefined;
  isStatusPublic: boolean | null | undefined;
  todayXp: number | null | undefined;
  cycleDay: number | null | undefined;
  stage: string | null | undefined;
  totalFruits: number | null | undefined;
  isSelf: boolean;
}

export interface UseFriendsResult {
  friends: FriendEntry[];
  myUser: UserRecord | null;
  myProfile: PublicProfileRecord | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  saveSettings: (nickname: string, isPublic: boolean, isFirstTime?: boolean) => Promise<void>;
  syncMyProfile: (opts: {
    todayXp: number;
    cycleDay: number;
    stage: string;
    totalFruits: number;
  }) => Promise<void>;
}

function sortFriends(entries: FriendEntry[]): FriendEntry[] {
  return [...entries].sort((a, b) => {
    if (!a.isStatusPublic && !b.isStatusPublic) return 0;
    if (!a.isStatusPublic) return 1;
    if (!b.isStatusPublic) return -1;
    return (b.todayXp ?? -1) - (a.todayXp ?? -1);
  });
}

export function useFriends(enabled: boolean): UseFriendsResult {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [myUser, setMyUser] = useState<UserRecord | null>(null);
  const [myProfile, setMyProfile] = useState<PublicProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { userId } = await getCurrentUser();

      const [{ data: profiles }, { data: users }] = await Promise.all([
        client.models.PublicProfile.list(),
        client.models.User.list(),
      ]);

      const user = users?.[0] ?? null;
      setMyUser(user);

      const mine = profiles?.find(p => p.userId === userId) ?? null;
      setMyProfile(mine);

      const entries: FriendEntry[] = (profiles ?? []).map(p => ({
        id: p.id,
        userId: p.userId,
        nickname: p.nickname,
        isStatusPublic: p.isStatusPublic,
        todayXp: p.todayXp,
        cycleDay: p.cycleDay,
        stage: p.stage,
        totalFruits: p.totalFruits,
        isSelf: p.userId === userId,
      }));

      setFriends(sortFriends(entries));
    } catch (err) {
      console.error('[useFriends] load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  const saveSettings = useCallback(async (
    nickname: string,
    isPublic: boolean,
    isFirstTime = false,
  ) => {
    try {
      const { userId } = await getCurrentUser();
      const effectiveNickname = nickname.trim() || 'ぬる';
      const today = getCurrentDateString();

      const { data: users } = await client.models.User.list();
      let updatedUser: UserRecord | null = null;

      if (users && users.length > 0) {
        const { data } = await client.models.User.update({
          id: users[0].id,
          nickname: effectiveNickname,
          isStatusPublic: isPublic,
          ...(isFirstTime ? { hasSeenFriendsIntro: true } : {}),
        });
        updatedUser = data ?? null;
      } else {
        const { data } = await client.models.User.create({
          displayName: effectiveNickname,
          timezone: 'Asia/Tokyo',
          currentCycleStartDate: today,
          nickname: effectiveNickname,
          isStatusPublic: isPublic,
          hasSeenFriendsIntro: isFirstTime,
        });
        updatedUser = data ?? null;
      }
      if (updatedUser) setMyUser(updatedUser);

      // Sync nickname/isStatusPublic to PublicProfile
      const { data: profiles } = await client.models.PublicProfile.list();
      const mine = profiles?.find(p => p.userId === userId);
      if (mine) {
        const { data: updated } = await client.models.PublicProfile.update({
          id: mine.id,
          nickname: effectiveNickname,
          isStatusPublic: isPublic,
        });
        if (updated) {
          setMyProfile(updated);
          setFriends(prev => sortFriends(prev.map(f =>
            f.userId === userId
              ? { ...f, nickname: effectiveNickname, isStatusPublic: isPublic }
              : f
          )));
        }
      } else {
        // Create PublicProfile if it doesn't exist yet
        const { data: created } = await client.models.PublicProfile.create({
          userId,
          nickname: effectiveNickname,
          isStatusPublic: isPublic,
          todayXp: 0,
          cycleDay: 1,
          stage: 'egg',
          totalFruits: 0,
        });
        if (created) {
          setMyProfile(created);
          const newEntry: FriendEntry = {
            id: created.id,
            userId,
            nickname: effectiveNickname,
            isStatusPublic: isPublic,
            todayXp: 0,
            cycleDay: 1,
            stage: 'egg',
            totalFruits: 0,
            isSelf: true,
          };
          setFriends(prev => sortFriends([...prev, newEntry]));
        }
      }
    } catch (err) {
      console.error('[useFriends] saveSettings error:', err);
    }
  }, []);

  const syncMyProfile = useCallback(async (opts: {
    todayXp: number;
    cycleDay: number;
    stage: string;
    totalFruits: number;
  }) => {
    try {
      const { userId } = await getCurrentUser();
      const { data: users } = await client.models.User.list();
      const user = users?.[0];
      const effectiveNickname = user?.nickname?.trim() || 'ぬる';
      const isPublic = user?.isStatusPublic ?? true;

      const profileData = {
        userId,
        nickname: effectiveNickname,
        isStatusPublic: isPublic,
        ...opts,
      };

      const { data: profiles } = await client.models.PublicProfile.list();
      const mine = profiles?.find(p => p.userId === userId);

      if (mine) {
        const { data: updated } = await client.models.PublicProfile.update({
          id: mine.id,
          ...profileData,
        });
        if (updated) setMyProfile(updated);
      } else {
        const { data: created } = await client.models.PublicProfile.create(profileData);
        if (created) setMyProfile(created);
      }
    } catch (err) {
      console.error('[useFriends] syncMyProfile error:', err);
    }
  }, []);

  return { friends, myUser, myProfile, isLoading, refetch: load, saveSettings, syncMyProfile };
}

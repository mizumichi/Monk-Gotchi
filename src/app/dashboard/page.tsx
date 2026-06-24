"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import TreeDisplay from "@/components/TreeDisplay";
import TaskList from "@/components/TaskList";
import { useCharacter } from "@/hooks/useCharacter";
import { useJournal } from "@/hooks/useJournal";
import { useRecentLogs } from "@/hooks/useRecentLogs";
import { useUserSettings } from "@/hooks/useUserSettings";
import { client } from "@/lib/amplifyClient";
import { getCurrentDateString } from "@/lib/date";
import { formatDayLabel } from "@/lib/cycle";
import { buildAggregatesForDays, getTreeRank, type DailyLogLike } from "@/lib/evolution";
import { TASKS, type Category, type Task } from "@/data/tasks";
import type { Schema } from "../../../amplify/data/resource";

type DailyLog = Schema["DailyLog"]["type"];
type Scores = Record<Category, number>;

type TabKey = 'routine' | 'strength' | 'sleep' | 'nutrition' | 'environment' | 'mental';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'routine',     label: 'ルーティン', icon: '⭐' },
  { key: 'strength',    label: '筋トレ',     icon: '💪' },
  { key: 'sleep',       label: '睡眠',       icon: '😴' },
  { key: 'nutrition',   label: '栄養',       icon: '🥩' },
  { key: 'environment', label: '環境',       icon: '☀️' },
  { key: 'mental',      label: '精神',       icon: '🧘' },
];


export default function DashboardPage() {
  const { signOut, authStatus } = useAuthenticator((context) => [
    context.authStatus,
  ]);
  const router = useRouter();
  const isAuthenticated = authStatus === "authenticated";

  const {
    cycleInfo,
    cycleStartDate,
    dateOverride,
    isLoading: characterLoading,
    numericValues,
    advanceDay,
    resetDate,
    harvest,
    purgeAllData,
    submitNumericValue,
    clearNumericValue,
  } = useCharacter(isAuthenticated);

  const effectiveToday = getCurrentDateString();

  const { logs: recentLogs, fullLogs, refetch: refetchRecentLogs } = useRecentLogs(isAuthenticated, cycleStartDate, effectiveToday);
  const { journals, saveJournal, deleteJournal } = useJournal(effectiveToday);

  const { favoriteTaskIds, isFavorite, toggleFavorite } = useUserSettings();

  const [activeTab, setActiveTab] = useState<TabKey>('routine');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [logsTrigger, setLogsTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [harvestAnimating, setHarvestAnimating] = useState(false);
  const harvestScoreRef = useRef(0);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'routine') {
      return TASKS.filter((t) => favoriteTaskIds.includes(t.id));
    }
    return TASKS.filter((t) => t.category === activeTab);
  }, [activeTab, favoriteTaskIds]);

  // Cumulative cycle scores
  const cycleScores = useMemo<Scores>(() => {
    const agg = buildAggregatesForDays(fullLogs as DailyLogLike[], cycleStartDate, cycleInfo.dayN);
    return agg.earnedXp as Scores;
  }, [fullLogs, cycleStartDate, cycleInfo.dayN]);

  const totalCycleScore = useMemo(
    () => Object.values(cycleScores).reduce((sum, v) => sum + v, 0),
    [cycleScores],
  );

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      setLogsLoading(true);
      try {
        const today = getCurrentDateString();
        const allData: DailyLog[] = [];
        let nt: string | null | undefined;
        do {
          const res = await client.models.DailyLog.list({
            filter: { date: { eq: today } },
            ...(nt ? { nextToken: nt } : {}),
          });
          (res.data ?? []).forEach(d => allData.push(d));
          nt = res.nextToken;
        } while (nt);
        setDailyLogs(allData);
      } catch (err) {
        console.error("DailyLog fetch error:", err);
      } finally {
        setLogsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, logsTrigger]);

  async function handleAdvanceDay() {
    await advanceDay();
    setLogsTrigger((n) => n + 1);
  }

  async function handlePurgeAllData() {
    const ok = window.confirm('すべての記録とキャラを初期化します。この操作は取り消せません。よろしいですか？');
    if (!ok) return;
    setDailyLogs([]);
    await purgeAllData();
    setLogsTrigger((n) => n + 1);
    refetchRecentLogs();
  }

  async function handleResetDate() {
    setDailyLogs([]);
    await resetDate();
    setLogsTrigger((n) => n + 1);
  }

  async function handleHarvest() {
    const ok = window.confirm('今サイクルを収穫して、新サイクルを始めますか？');
    if (!ok) return;
    harvestScoreRef.current = totalCycleScore;
    setHarvestAnimating(true);
  }

  async function handleHarvestAnimationComplete() {
    setHarvestAnimating(false);
    setDailyLogs([]);
    const result = await harvest(harvestScoreRef.current);
    setLogsTrigger((n) => n + 1);
    if (result.success) {
      showToast('収穫しました！');
      refetchRecentLogs();
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }

  async function handleNumericSubmit(taskId: string, value: number) {
    await submitNumericValue(taskId, value);
    setLogsTrigger((n) => n + 1);
    refetchRecentLogs();
  }

  async function handleNumericClear(taskId: string) {
    await clearNumericValue(taskId);
    setLogsTrigger((n) => n + 1);
    refetchRecentLogs();
  }

  async function handleJournalSave(slot: 'morning' | 'evening', mood: number, text: string) {
    const { created } = await saveJournal(slot, mood, text);
    if (created) {
      const { userId } = await getCurrentUser();
      const taskId = slot === 'morning' ? 'journal_morning' : 'journal_evening';
      const task = TASKS.find((t) => t.id === taskId);
      if (task) {
        const today = getCurrentDateString();
        const { data } = await client.models.DailyLog.create({
          userId,
          date: today,
          taskId,
          points: task.mainXp,
          completedAt: new Date().toISOString(),
        });
        if (data) setDailyLogs((prev) => [...prev, data]);
      }
    }
    refetchRecentLogs();
  }

  async function handleJournalDelete(slot: 'morning' | 'evening') {
    await deleteJournal(slot);
    const taskId = slot === 'morning' ? 'journal_morning' : 'journal_evening';
    const existing = dailyLogs.find((log) => log.taskId === taskId);
    if (existing) {
      await client.models.DailyLog.delete({ id: existing.id });
      setDailyLogs((prev) => prev.filter((log) => log.id !== existing.id));
    }
    refetchRecentLogs();
  }

  async function handleToggle(task: Task) {
    setPendingTaskIds((prev) => new Set(prev).add(task.id));
    try {
      const existing = dailyLogs.find((log) => log.taskId === task.id);
      if (existing) {
        await client.models.DailyLog.delete({ id: existing.id });
        setDailyLogs((prev) => prev.filter((log) => log.id !== existing.id));
      } else {
        const { userId } = await getCurrentUser();
        const today = getCurrentDateString();
        const { data } = await client.models.DailyLog.create({
          userId,
          date: today,
          taskId: task.id,
          points: task.mainXp,
          completedAt: new Date().toISOString(),
        });
        if (data) setDailyLogs((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error("DailyLog toggle error:", err);
    } finally {
      setPendingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      refetchRecentLogs();
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="font-mono text-zinc-500 tracking-widest text-sm animate-pulse">
          LOADING...
        </p>
      </div>
    );
  }

  const checkedTaskIds = new Set(dailyLogs.map((log) => log.taskId));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="font-mono font-bold text-violet-400 tracking-widest text-sm">
          MONK-GOTCHI
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/orchard"
            className="font-mono text-xs text-zinc-400 hover:text-violet-300 border border-zinc-700 hover:border-violet-600 px-3 py-1.5 transition-colors"
          >
            🌳 果樹園
          </Link>
          <button
            onClick={signOut}
            className="font-mono text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 transition-colors"
          >
            サインアウト
          </button>
        </div>
      </header>

      {/* Date override banner */}
      {dateOverride && (
        <div className="bg-amber-950/60 border-b border-amber-800/60 px-4 py-1 text-center">
          <span className="font-mono text-[10px] text-amber-400 tracking-widest">
            [テスト中: {dateOverride}]
          </span>
        </div>
      )}

      {/* Click-blocking overlay during harvest animation */}
      {harvestAnimating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            cursor: 'wait',
            pointerEvents: 'all',
          }}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-violet-700 border border-violet-400 px-5 py-2.5 shadow-lg animate-fade-in">
          <p className="font-mono text-sm text-white tracking-wide whitespace-nowrap">
            {toastMessage}
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Tree */}
        <div className="flex flex-col items-center gap-1">
          <TreeDisplay
            score={totalCycleScore}
            animating={harvestAnimating}
            onAnimationComplete={handleHarvestAnimationComplete}
          />
          {/* Rank info */}
          {(() => {
            const { rank, fruitCount } = getTreeRank(totalCycleScore);
            const rankLabel = rank === 'low' ? 'いまいち' : rank === 'mid' ? '普通' : 'だいぶ良い';
            const rankColor = rank === 'low' ? 'text-zinc-400' : rank === 'mid' ? 'text-violet-300' : 'text-emerald-400';
            const daysLeft = Math.max(0, 7 - cycleInfo.dayN);
            return (
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-zinc-500">{totalCycleScore}pt</span>
                <span className={rankColor}>{rankLabel}</span>
                <span className="text-zinc-400">🍎 {fruitCount}個</span>
                {daysLeft > 0 && (
                  <span className="text-zinc-600">あと{daysLeft}日</span>
                )}
              </div>
            );
          })()}
          <p className="font-mono text-xs text-zinc-400 tracking-wider">
            {formatDayLabel(cycleInfo)}
          </p>
          <div className="flex gap-1">
            <button
              onClick={handleAdvanceDay}
              disabled={characterLoading}
              className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400 border border-zinc-800 hover:border-zinc-600 px-2 py-0.5 transition-colors disabled:opacity-30"
            >
              ＋1日 (テスト)
            </button>
            <button
              onClick={handleResetDate}
              disabled={characterLoading}
              className="font-mono text-[10px] text-zinc-600 hover:text-amber-400 border border-zinc-800 hover:border-amber-700 px-2 py-0.5 transition-colors disabled:opacity-30"
            >
              リセット (テスト)
            </button>
            <button
              onClick={handlePurgeAllData}
              disabled={characterLoading}
              className="font-mono text-[10px] text-zinc-600 hover:text-red-400 border border-zinc-800 hover:border-red-700 px-2 py-0.5 transition-colors disabled:opacity-30"
            >
              全消去 (テスト)
            </button>
          </div>

          {(cycleInfo.phase === 'final' || cycleInfo.isOverflow) && (
            <div className="flex flex-col items-center gap-1 mt-1 w-full">
              {cycleInfo.isOverflow && (
                <p className="font-mono text-[10px] text-amber-400">
                  収穫期を過ぎています
                </p>
              )}
              <button
                onClick={handleHarvest}
                disabled={characterLoading}
                className="font-mono text-sm border-2 px-4 py-2 transition-colors disabled:opacity-30 w-full text-emerald-300 hover:text-white border-emerald-600 hover:border-emerald-400 hover:bg-emerald-900/30"
              >
                🍎 収穫する
              </button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border border-zinc-800 bg-zinc-900 scrollbar-none -mx-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-none px-3 py-2.5 font-mono text-xs flex items-center gap-1.5 transition-colors border-r border-zinc-800 last:border-r-0 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              <span className="leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        <TaskList
          tasks={filteredTasks}
          checkedTaskIds={checkedTaskIds}
          pendingTaskIds={pendingTaskIds}
          onToggle={handleToggle}
          loading={logsLoading}
          numericValues={numericValues}
          onNumericSubmit={handleNumericSubmit}
          onNumericClear={handleNumericClear}
          recentLogs={recentLogs}
          today={effectiveToday}
          cycleStartDate={cycleStartDate}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          isRoutineTab={activeTab === 'routine'}
          journals={journals}
          onJournalSave={handleJournalSave}
          onJournalDelete={handleJournalDelete}
        />
      </main>
    </div>
  );
}

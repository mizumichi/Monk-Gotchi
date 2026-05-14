"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import CharacterDisplay from "@/components/CharacterDisplay";
import CharacterStage from "@/components/CharacterStage";
import ScoreBars from "@/components/ScoreBars";
import TaskList from "@/components/TaskList";
import { useCharacter } from "@/hooks/useCharacter";
import { useCharacterAnimation } from "@/hooks/useCharacterAnimation";
import { useJournal } from "@/hooks/useJournal";
import { useRecentLogs } from "@/hooks/useRecentLogs";
import { useUserSettings } from "@/hooks/useUserSettings";
import { client } from "@/lib/amplifyClient";
import { getCurrentDateString } from "@/lib/date";
import { getCharacterByCode, resolveCharacterCode } from "@/data/characters";
import { formatDayLabel, type CyclePhase } from "@/lib/cycle";
import { buildAggregatesForDays, type DailyLogLike } from "@/lib/evolution";
import { TASKS, calcCategoryScores, type Category, type Task, getTaskById } from "@/data/tasks";
import { calcSleepHoursXp } from "@/lib/sleepXp";
import type { Stage } from "@/lib/date";
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

function phaseToDisplayStage(phase: CyclePhase): Stage {
  if (phase === 'egg') return 'egg';
  if (phase === 'baby') return 'early';
  if (phase === 'mid') return 'mid';
  return 'final';
}

function computeScores(logs: DailyLog[]): Scores {
  const numericValues: Record<string, number> = {};
  for (const log of logs) {
    if (log.numericValues) {
      try {
        const nv = typeof log.numericValues === 'string'
          ? JSON.parse(log.numericValues)
          : log.numericValues;
        if (nv && typeof nv[log.taskId] === 'number') {
          const task = getTaskById(log.taskId);
          const ratio = calcSleepHoursXp(nv[log.taskId]);
          numericValues[`${log.taskId}_main`] = Math.round((task?.mainXp ?? 40) * ratio);
          if (task?.subXp != null) {
            numericValues[`${log.taskId}_sub`] = Math.round(task.subXp * ratio);
          }
        }
      } catch { /* skip */ }
    }
  }
  return calcCategoryScores(logs.map((l) => l.taskId), numericValues);
}

export default function DashboardPage() {
  const { signOut, authStatus } = useAuthenticator((context) => [
    context.authStatus,
  ]);
  const router = useRouter();
  const isAuthenticated = authStatus === "authenticated";

  const {
    dayNumber,
    stage,
    cycleInfo,
    midType,
    finalType,
    cycleStartDate,
    dateOverride,
    isLoading: characterLoading,
    numericValues,
    evolutionCode,
    clearEvolutionCode,
    advanceDay,
    resetDate,
    rebornAsEgg,
    purgeAllData,
    submitNumericValue,
    clearNumericValue,
  } = useCharacter(isAuthenticated);

  const { bouncing, effectTrigger, triggerReaction } = useCharacterAnimation();

  const effectiveToday = getCurrentDateString();

  const { logs: recentLogs, fullLogs, refetch: refetchRecentLogs } = useRecentLogs(isAuthenticated, cycleStartDate, effectiveToday);
  const { journals, saveJournal, deleteJournal } = useJournal(effectiveToday);

  const { favoriteTaskIds, isFavorite, toggleFavorite } = useUserSettings();

  const [activeTab, setActiveTab] = useState<TabKey>('routine');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [logsTrigger, setLogsTrigger] = useState(0);
  const [evolutionMessage, setEvolutionMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Show toast when evolution fires
  useEffect(() => {
    if (!evolutionCode) return;
    const char = getCharacterByCode(resolveCharacterCode(evolutionCode.code));
    showToast(`進化した！ ${char?.emoji ?? ''} ${char?.nameJp ?? evolutionCode.code} が生まれた！`);
    clearEvolutionCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evolutionCode]);

  async function handleAdvanceDay() {
    await advanceDay();
    setLogsTrigger((n) => n + 1);
  }

  async function handlePurgeAllData() {
    const ok = window.confirm('すべての記録とキャラを初期化します。この操作は取り消せません。よろしいですか？');
    if (!ok) return;
    setDailyLogs([]);
    setEvolutionMessage(null);
    await purgeAllData();
    setLogsTrigger((n) => n + 1);
    refetchRecentLogs();
  }

  async function handleResetDate() {
    setDailyLogs([]);
    await resetDate();
    setLogsTrigger((n) => n + 1);
    setEvolutionMessage(null);
  }

  async function handleReborn() {
    const ok = window.confirm(`現在のキャラを図鑑に登録して、卵から育て直しますか？`);
    if (!ok) return;

    setDailyLogs([]);
    const result = await rebornAsEgg();
    setLogsTrigger((n) => n + 1);
    if (result.success && result.recordedType) {
      const char = getCharacterByCode(resolveCharacterCode(result.recordedType));
      const recorded = char ? char.nameJp : result.recordedType;
      showToast(`図鑑に ${recorded} を登録しました`);
    } else if (result.success) {
      showToast(`卵に戻りました`);
    }
  }

  function showToast(message: string) {
    setEvolutionMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setEvolutionMessage(null), 3000);
  }

  async function handleNumericSubmit(taskId: string, value: number) {
    triggerReaction();
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
        triggerReaction();
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
  const scores = computeScores(dailyLogs);
  const displayStage = characterLoading ? "egg" : phaseToDisplayStage(cycleInfo.phase);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="font-mono font-bold text-violet-400 tracking-widest text-sm">
          MONK-GOTCHI
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/dex"
            className="font-mono text-xs text-zinc-400 hover:text-violet-300 border border-zinc-700 hover:border-violet-600 px-3 py-1.5 transition-colors"
          >
            📖 図鑑
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

      {/* Evolution toast */}
      {evolutionMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-violet-700 border border-violet-400 px-5 py-2.5 shadow-lg animate-fade-in">
          <p className="font-mono text-sm text-white tracking-wide whitespace-nowrap">
            {evolutionMessage}
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Character + Score */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col items-center gap-1">
            <CharacterDisplay
              dayNumber={characterLoading ? 1 : dayNumber}
              stage={displayStage}
              midType={midType}
              finalType={finalType}
            />
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
                {cycleInfo.isOverflow ? (
                  <p className="font-mono text-[10px] text-amber-400">
                    休憩中・新サイクル開始待ち
                  </p>
                ) : (
                  <p className="font-mono text-[10px] text-zinc-500">
                    今日は休憩日です
                  </p>
                )}
                <button
                  onClick={handleReborn}
                  disabled={characterLoading}
                  className={`font-mono text-sm border-2 px-4 py-2 transition-colors disabled:opacity-30 w-full ${
                    cycleInfo.isOverflow
                      ? 'text-amber-300 hover:text-white border-amber-600 hover:border-amber-400 hover:bg-amber-900/30'
                      : 'text-violet-300 hover:text-white border-violet-600 hover:border-violet-400 hover:bg-violet-900/30'
                  }`}
                >
                  🥚 もう一度育てる
                </button>
              </div>
            )}
          </div>
          <ScoreBars scores={scores} cycleScores={cycleScores} />
        </div>

        {/* Character Stage */}
        <CharacterStage bouncing={bouncing} effectTrigger={effectTrigger} stage={stage} midType={midType} finalType={finalType} />

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

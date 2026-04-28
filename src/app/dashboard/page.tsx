"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import CharacterDisplay from "@/components/CharacterDisplay";
import ScoreBars from "@/components/ScoreBars";
import TaskList from "@/components/TaskList";
import { useCharacter } from "@/hooks/useCharacter";
import { useRecentLogs } from "@/hooks/useRecentLogs";
import { client } from "@/lib/amplifyClient";
import { getCurrentDateString } from "@/lib/date";
import { CHARACTERS } from "@/data/characters";
import { calcCategoryScores, type Category, type Task } from "@/data/tasks";
import { calcSleepHoursXp } from "@/lib/sleepXp";
import type { Schema } from "../../../amplify/data/resource";

type DailyLog = Schema["DailyLog"]["type"];
type Scores = Record<Category, number>;

function computeScores(logs: DailyLog[]): Scores {
  const numericValues: Record<string, number> = {};
  for (const log of logs) {
    if (log.numericValues) {
      try {
        const nv = typeof log.numericValues === 'string'
          ? JSON.parse(log.numericValues)
          : log.numericValues;
        if (nv && typeof nv[log.taskId] === 'number') {
          const ratio = calcSleepHoursXp(nv[log.taskId]);
          // mainXp=40, subXp=10 for sleep_hours; use the stored ratio to derive per-category pts
          numericValues[`${log.taskId}_main`] = Math.round(40 * ratio);
          numericValues[`${log.taskId}_sub`] = Math.round(10 * ratio);
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
    midType,
    finalType,
    dateOverride,
    isLoading: characterLoading,
    numericValues,
    advanceDay,
    checkAndEvolve,
    resetDate,
    rebornAsEgg,
    submitNumericValue,
    clearNumericValue,
  } = useCharacter(isAuthenticated);

  // dateOverride が変わるたびに再レンダーされるので、毎回実効日付を計算する
  const effectiveToday = getCurrentDateString();

  const { logs: recentLogs, refetch: refetchRecentLogs } = useRecentLogs(isAuthenticated, 7, effectiveToday);

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [logsTrigger, setLogsTrigger] = useState(0);
  const [evolutionMessage, setEvolutionMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const { data } = await client.models.DailyLog.list({
          filter: { date: { eq: today } },
        });
        setDailyLogs(data ?? []);
      } catch (err) {
        console.error("DailyLog fetch error:", err);
      } finally {
        setLogsLoading(false);
      }
    }

    load();
  }, [isAuthenticated, logsTrigger]);

  function showEvolutionToast(newStage?: string, newMidType?: string, newFinalType?: string) {
    if (!newStage) return;
    let charKey: keyof typeof CHARACTERS = "egg";
    if (newStage === "mid" && newMidType && newMidType in CHARACTERS) {
      charKey = newMidType as keyof typeof CHARACTERS;
    } else if (newStage === "final" && newFinalType && newFinalType in CHARACTERS) {
      charKey = newFinalType as keyof typeof CHARACTERS;
    } else if (newStage in CHARACTERS) {
      charKey = newStage as keyof typeof CHARACTERS;
    }
    const char = CHARACTERS[charKey];
    showToast(`進化した！ ${char.emoji} ${char.name} が生まれた！`);
  }

  async function handleAdvanceDay() {
    const result = await advanceDay();
    setLogsTrigger((n) => n + 1);
    if (result.evolved) {
      showEvolutionToast(result.newStage, result.midType, result.finalType);
    }
  }

  async function handleResetDate() {
    setDailyLogs([]);
    await resetDate();
    setLogsTrigger((n) => n + 1);
    setEvolutionMessage(null);
  }

  async function handleReborn() {
    const charName = finalType && finalType in CHARACTERS
      ? CHARACTERS[finalType as keyof typeof CHARACTERS].name
      : "このキャラ";
    const ok = window.confirm(
      `現在のキャラを図鑑に登録して、卵から育て直しますか？`
    );
    if (!ok) return;

    setDailyLogs([]);
    const result = await rebornAsEgg();
    setLogsTrigger((n) => n + 1);
    if (result.success && result.recordedType) {
      const recorded = result.recordedType in CHARACTERS
        ? CHARACTERS[result.recordedType as keyof typeof CHARACTERS].name
        : result.recordedType;
      showToast(`図鑑に ${recorded} を登録しました`);
    }
  }

  function showToast(message: string) {
    setEvolutionMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setEvolutionMessage(null), 3000);
  }

  async function handleNumericSubmit(taskId: string, value: number) {
    await submitNumericValue(taskId, value);
    setLogsTrigger((n) => n + 1);
    refetchRecentLogs();
    const result = await checkAndEvolve();
    if (result.evolved) {
      showEvolutionToast(result.newStage, result.midType, result.finalType);
    }
  }

  async function handleNumericClear(taskId: string) {
    await clearNumericValue(taskId);
    setLogsTrigger((n) => n + 1);
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
      // タスク変更後に進化チェック (ステージ境界を跨いでいた場合に備えて)
      const result = await checkAndEvolve();
      if (result.evolved) {
        showEvolutionToast(result.newStage, result.midType, result.finalType);
      }
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
              stage={characterLoading ? "egg" : stage}
              midType={midType}
              finalType={finalType}
            />
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
            </div>

            {/* もう一度育てるボタン (最終形態のみ) */}
            {stage === "final" && (
              <button
                onClick={handleReborn}
                disabled={characterLoading}
                className="mt-2 font-mono text-sm text-violet-300 hover:text-white border-2 border-violet-600 hover:border-violet-400 hover:bg-violet-900/30 px-4 py-2 transition-colors disabled:opacity-30 w-full"
              >
                🥚 もう一度育てる
              </button>
            )}
          </div>
          <ScoreBars scores={scores} />
        </div>

        {/* Task list */}
        <TaskList
          checkedTaskIds={checkedTaskIds}
          pendingTaskIds={pendingTaskIds}
          onToggle={handleToggle}
          loading={logsLoading}
          numericValues={numericValues}
          onNumericSubmit={handleNumericSubmit}
          onNumericClear={handleNumericClear}
          recentLogs={recentLogs}
          today={effectiveToday}
        />
      </main>
    </div>
  );
}

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
import { buildAggregatesForDays, getTreeRank, type DailyLogLike } from "@/lib/evolution";
import { TASKS, type Category, type Task } from "@/data/tasks";
import type { Schema } from "../../../amplify/data/resource";

function getStageFromPhase(phase: string): string {
  if (phase === 'egg') return 'egg';
  if (phase === 'baby') return 'early';
  if (phase === 'mid') return 'mid';
  return 'final';
}

type DailyLog = Schema["DailyLog"]["type"];
type Scores = Record<Category, number>;
type TabKey = "routine" | "strength" | "sleep" | "nutrition" | "environment" | "mental";

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

const TABS: { key: TabKey; label: string; icon: string; color: string }[] = [
  { key: "routine",     label: "ルーティン", icon: "⭐", color: "#C77B4A" },
  { key: "strength",    label: "筋トレ",     icon: "💪", color: "#C75B4A" },
  { key: "sleep",       label: "睡眠",       icon: "😴", color: "#5E6BB0" },
  { key: "nutrition",   label: "栄養",       icon: "🥩", color: "#5FA052" },
  { key: "environment", label: "環境",       icon: "☀️", color: "#D6A33E" },
  { key: "mental",      label: "精神",       icon: "🧘", color: "#9B6BB0" },
];

const CAT_COLORS: Record<string, string> = {
  strength: "#C75B4A",
  sleep: "#5E6BB0",
  nutrition: "#5FA052",
  environment: "#D6A33E",
  mental: "#9B6BB0",
};

const CAT_META: Record<string, { name: string; icon: string }> = {
  strength:    { name: "筋トレ", icon: "💪" },
  sleep:       { name: "睡眠",   icon: "😴" },
  nutrition:   { name: "栄養",   icon: "🥩" },
  environment: { name: "環境",   icon: "☀️" },
  mental:      { name: "精神",   icon: "🧘" },
};

export default function DashboardPage() {
  const { signOut, authStatus } = useAuthenticator((context) => [context.authStatus]);
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

  const [activeTab, setActiveTab] = useState<TabKey>("routine");
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [logsTrigger, setLogsTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [harvestAnimating, setHarvestAnimating] = useState(false);
  const harvestScoreRef = useRef(0);
  const [showBalance, setShowBalance] = useState(false);
  const [showHarvestConfirm, setShowHarvestConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTestTools, setShowTestTools] = useState(false);
  const lastSunTapRef = useRef(0);
  const [routineOrder, setRoutineOrder] = useState<string[]>([]);

  // PublicProfile mirror refs
  const mirrorUserRef = useRef<{ nickname: string; isStatusPublic: boolean } | null>(null);
  const mirrorFruitsRef = useRef<number>(0);
  const mirrorUserIdRef = useRef<string | null>(null);
  const mirrorProfileIdRef = useRef<string | null>(null);
  const mirrorReadyRef = useRef(false);
  const mirrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load routine order from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("htt_routine_order");
      if (stored) setRoutineOrder(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Load mirror data (User settings + totalFruits) once on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadMirrorData() {
      try {
        const { userId } = await getCurrentUser();
        mirrorUserIdRef.current = userId;
        const [{ data: users }, { data: harvests }] = await Promise.all([
          client.models.User.list(),
          client.models.Harvest.list(),
        ]);
        mirrorUserRef.current = {
          nickname: users?.[0]?.nickname?.trim() || 'ぬる',
          isStatusPublic: users?.[0]?.isStatusPublic ?? true,
        };
        mirrorFruitsRef.current = harvests?.reduce((sum, h) => sum + (h.fruitCount ?? 0), 0) ?? 0;
        mirrorReadyRef.current = true;
      } catch (err) {
        console.error("[dashboard] loadMirrorData error:", err);
      }
    }
    loadMirrorData();
  }, [isAuthenticated]);

  // Routine tasks: starred tasks (including journal), apply custom order
  const filteredTasks = useMemo(() => {
    if (activeTab === "routine") {
      return TASKS.filter((t) => favoriteTaskIds.includes(t.id));
    }
    return TASKS.filter((t) => t.category === activeTab);
  }, [activeTab, favoriteTaskIds]);

  const orderedFilteredTasks = useMemo(() => {
    if (activeTab !== "routine" || routineOrder.length === 0) return filteredTasks;
    const orderMap = new Map(routineOrder.map((id, i) => [id, i]));
    return [...filteredTasks].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 9999;
      const bi = orderMap.get(b.id) ?? 9999;
      return ai - bi;
    });
  }, [activeTab, filteredTasks, routineOrder]);

  const cycleScores = useMemo<Scores>(() => {
    const agg = buildAggregatesForDays(fullLogs as DailyLogLike[], cycleStartDate, cycleInfo.dayN);
    return agg.earnedXp as Scores;
  }, [fullLogs, cycleStartDate, cycleInfo.dayN]);

  const totalCycleScore = useMemo(
    () => Object.values(cycleScores).reduce((sum, v) => sum + v, 0),
    [cycleScores],
  );

  const todayXpForMirror = useMemo(
    () => dailyLogs.reduce((sum, log) => sum + (log.points ?? 0), 0),
    [dailyLogs],
  );

  // Debounced mirror write to PublicProfile on score/cycle change
  useEffect(() => {
    if (!isAuthenticated || !hasLoadedOnce) return;
    if (mirrorTimerRef.current) clearTimeout(mirrorTimerRef.current);
    mirrorTimerRef.current = setTimeout(async () => {
      if (!mirrorReadyRef.current || !mirrorUserIdRef.current) return;
      try {
        const userId = mirrorUserIdRef.current;
        const stage = getStageFromPhase(cycleInfo.phase);
        const profileData = {
          userId,
          nickname: mirrorUserRef.current?.nickname ?? 'ぬる',
          isStatusPublic: mirrorUserRef.current?.isStatusPublic ?? true,
          todayXp: todayXpForMirror,
          cycleDay: Math.min(cycleInfo.dayN, 7),
          stage,
          totalFruits: mirrorFruitsRef.current,
        };
        if (mirrorProfileIdRef.current) {
          await client.models.PublicProfile.update({ id: mirrorProfileIdRef.current, ...profileData });
        } else {
          const { data: profiles } = await client.models.PublicProfile.list();
          const mine = profiles?.find(p => p.userId === userId);
          if (mine) {
            mirrorProfileIdRef.current = mine.id;
            await client.models.PublicProfile.update({ id: mine.id, ...profileData });
          } else {
            const { data: created } = await client.models.PublicProfile.create(profileData);
            if (created) mirrorProfileIdRef.current = created.id;
          }
        }
      } catch (err) {
        console.error("[dashboard] mirror error:", err);
      }
    }, 1500);
    return () => {
      if (mirrorTimerRef.current) clearTimeout(mirrorTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hasLoadedOnce, todayXpForMirror, cycleInfo.dayN]);

  // Sky gradient by time of day
  const sky = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return { top: "#FBE0C4", bot: "#F2EAD4", orb: "#FFD27A", glow: "rgba(255,200,120,.6)" };
    if (h >= 18 || h < 5)  return { top: "#313B5C", bot: "#5A6794", orb: "#F4F1DE", glow: "rgba(244,241,222,.45)" };
    return { top: "#C2E2F1", bot: "#EBF4DE", orb: "#FFE08A", glow: "rgba(255,224,138,.55)" };
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace("/login");
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
          (res.data ?? []).forEach((d) => allData.push(d));
          nt = res.nextToken;
        } while (nt);
        setDailyLogs(allData);
      } catch (err) {
        console.error("DailyLog fetch error:", err);
      } finally {
        setLogsLoading(false);
        setHasLoadedOnce(true);
      }
    }
    load();
  }, [isAuthenticated, logsTrigger]);

  function handleSunDoubleTap() {
    const now = Date.now();
    if (now - lastSunTapRef.current < 350) {
      setShowTestTools((prev) => !prev);
    }
    lastSunTapRef.current = now;
  }

  function handleReorder(newIds: string[]) {
    setRoutineOrder(newIds);
    try {
      localStorage.setItem("htt_routine_order", JSON.stringify(newIds));
    } catch { /* ignore */ }
  }

  async function handleAdvanceDay() {
    await advanceDay();
    setLogsTrigger((n) => n + 1);
  }

  async function handlePurgeAllData() {
    const ok = window.confirm("すべての記録とキャラを初期化します。この操作は取り消せません。よろしいですか？");
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

  function handleHarvest() {
    setShowHarvestConfirm(true);
  }

  async function handleHarvestConfirm() {
    setShowHarvestConfirm(false);
    harvestScoreRef.current = totalCycleScore;
    setHarvestAnimating(true);
  }

  async function handleHarvestAnimationComplete() {
    setHarvestAnimating(false);
    setDailyLogs([]);
    const result = await harvest(harvestScoreRef.current);
    setLogsTrigger((n) => n + 1);
    if (result.success) {
      showToast("収穫しました！");
      refetchRecentLogs();
      // Update totalFruits ref after harvest
      mirrorFruitsRef.current = mirrorFruitsRef.current + getTreeRank(harvestScoreRef.current).fruitCount;
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

  async function handleJournalSave(slot: "morning" | "evening", mood: number, text: string) {
    const { created } = await saveJournal(slot, mood, text);
    if (created) {
      const { userId } = await getCurrentUser();
      const taskId = slot === "morning" ? "journal_morning" : "journal_evening";
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

  async function handleJournalDelete(slot: "morning" | "evening") {
    await deleteJournal(slot);
    const taskId = slot === "morning" ? "journal_morning" : "journal_evening";
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#E7DECB", fontFamily: FONT }}>
        <p style={{ color: "#A8987F", fontWeight: 700 }}>読み込み中...</p>
      </div>
    );
  }

  const checkedTaskIds = new Set(dailyLogs.map((log) => log.taskId));
  const dayDots = Array.from({ length: 7 }, (_, i) => i < cycleInfo.dayN);
  const dayText = `${cycleInfo.dayN}日目`;

  return (
    <div style={{ height: "100vh", background: "#E7DECB", overflow: "hidden", fontFamily: FONT }}>
      <div style={{ width: "390px", maxWidth: "100%", height: "100%", margin: "0 auto", background: "#F3ECDD", position: "relative", boxShadow: "0 0 60px rgba(80,60,30,.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Click-blocking overlay during harvest animation */}
        {harvestAnimating && (
          <div style={{ position: "fixed", inset: 0, zIndex: 40, cursor: "wait", pointerEvents: "all" }} />
        )}

        {/* Toast */}
        {toastMessage && (
          <div style={{ position: "fixed", top: "64px", left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "#5A7A33", color: "#fff", padding: "10px 20px", borderRadius: "999px", fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(80,60,30,.25)", fontFamily: FONT }}>
            {toastMessage}
          </div>
        )}

        {/* Sticky top */}
        <div style={{ flexShrink: 0, zIndex: 20 }}>
          {dateOverride && (
            <div style={{ background: "rgba(214,163,62,.12)", borderBottom: "1px solid rgba(214,163,62,.25)", padding: "3px 16px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#C58A2A", letterSpacing: ".08em" }}>テスト中: {dateOverride}</span>
            </div>
          )}
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 12px", background: "#F3ECDD", borderBottom: "1px solid #E4D9C2" }}>
            <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: ".08em", color: "#6E4A2A", whiteSpace: "nowrap" }}>HI-T-TREE</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setShowMenu(true)}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: FONT, fontWeight: 700, fontSize: "11.5px", color: "#5A7A33", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "999px", padding: "6px 13px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <span>≡</span>その他
              </button>
            </div>
          </header>
        </div>

        {/* Hero tree section */}
        <div style={{ flexShrink: 0, padding: "12px 16px 0" }}>
          <section style={{ borderRadius: "24px", overflow: "hidden", boxShadow: "0 6px 20px rgba(90,70,35,.12)", border: "1px solid #E6DBC4" }}>
            <div style={{ position: "relative", height: "190px", background: `linear-gradient(180deg, ${sky.top}, ${sky.bot})`, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              {/* Sun/moon (double-tap to toggle test tools) */}
              <div
                onClick={handleSunDoubleTap}
                style={{ position: "absolute", top: "22px", right: "30px", width: "46px", height: "46px", borderRadius: "50%", background: sky.orb, boxShadow: `0 0 30px 6px ${sky.glow}`, cursor: "pointer" }}
              />
              {/* Twinkles */}
              <div style={{ position: "absolute", top: "40px", left: "42px", fontSize: "13px", animation: "mgTwinkle 2.6s ease-in-out infinite" }}>✨</div>
              <div style={{ position: "absolute", top: "74px", left: "280px", fontSize: "11px", animation: "mgTwinkle 3.2s ease-in-out .6s infinite" }}>✨</div>
              {/* Score pill */}
              <div style={{ position: "absolute", top: "14px", left: "14px", display: "flex", alignItems: "baseline", gap: "4px", background: "rgba(255,253,247,.82)", backdropFilter: "blur(4px)", borderRadius: "999px", padding: "5px 13px", boxShadow: "0 2px 8px rgba(70,50,20,.12)", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 800, fontSize: "15px", color: "#6E4A2A" }}>{totalCycleScore}</span>
                <span style={{ fontSize: "11px", color: "#A8987F" }}>pt</span>
              </div>
              {/* Tree */}
              <div style={{ marginBottom: "-6px", transformOrigin: "bottom center" }}>
                <TreeDisplay
                  score={totalCycleScore}
                  animating={harvestAnimating}
                  onAnimationComplete={handleHarvestAnimationComplete}
                />
              </div>
            </div>

            {/* Cycle progress */}
            <div style={{ background: "#FBF6EC", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, display: "flex", gap: "4px" }}>
                {dayDots.map((filled, i) => (
                  <div key={i} style={{ flex: 1, height: "7px", borderRadius: "999px", background: filled ? "#7FB23A" : "#E3D8C2" }} />
                ))}
              </div>
              <span style={{ fontWeight: 700, fontSize: "12.5px", color: "#5A7A33", whiteSpace: "nowrap" }}>{dayText}</span>
            </div>

            {/* Harvest button */}
            {(cycleInfo.phase === "final" || cycleInfo.isOverflow) && (
              <div style={{ background: "#FBF6EC", padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {cycleInfo.isOverflow && (
                  <p style={{ margin: 0, fontSize: "10.5px", fontWeight: 700, color: "#D6A33E", textAlign: "center" }}>収穫期を過ぎています</p>
                )}
                <button
                  onClick={handleHarvest}
                  disabled={characterLoading}
                  style={{ fontFamily: FONT, fontWeight: 800, fontSize: "14px", color: "#fff", background: "#5A9E2E", border: "none", borderRadius: "14px", padding: "11px 0", cursor: "pointer", opacity: characterLoading ? 0.5 : 1, boxShadow: "0 4px 12px rgba(90,158,46,.35)", width: "100%" }}
                >
                  🍎 収穫する
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Tab bar */}
        <div style={{ flexShrink: 0, background: "#F3ECDD", padding: "10px 16px 0", borderBottom: "1px solid #E4D9C2" }}>
          <div style={{ display: "flex", gap: "7px", overflowX: "auto", padding: "2px 0 10px", scrollbarWidth: "none" }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px", flexShrink: 0, whiteSpace: "nowrap",
                    fontFamily: FONT, fontWeight: 700, fontSize: "12.5px", cursor: "pointer",
                    borderRadius: "999px", padding: "8px 14px",
                    border: isActive ? `1.5px solid ${tab.color}` : "1.5px solid #E2D6BE",
                    background: isActive ? tab.color : "#FBF6EC",
                    color: isActive ? "#fff" : "#7A6A53",
                    boxShadow: isActive ? `0 3px 8px ${tab.color}55` : "none",
                  }}
                >
                  <span style={{ fontSize: "13px" }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 40px", display: "flex", flexDirection: "column", gap: "14px", scrollbarWidth: "none" }}>

          <TaskList
            tasks={orderedFilteredTasks}
            checkedTaskIds={checkedTaskIds}
            pendingTaskIds={pendingTaskIds}
            onToggle={handleToggle}
            loading={logsLoading && !hasLoadedOnce}
            numericValues={numericValues}
            onNumericSubmit={handleNumericSubmit}
            onNumericClear={handleNumericClear}
            recentLogs={recentLogs}
            today={effectiveToday}
            cycleStartDate={cycleStartDate}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            isRoutineTab={activeTab === "routine"}
            journals={journals}
            onJournalSave={handleJournalSave}
            onJournalDelete={handleJournalDelete}
            onReorder={activeTab === "routine" ? handleReorder : undefined}
            disabled={cycleInfo.phase === "final" || cycleInfo.isOverflow}
          />

          {/* Test tools (hidden by default, double-tap sun to toggle) */}
          {showTestTools && (
            <section style={{ border: "1.5px dashed #D8C9AC", borderRadius: "16px", padding: "9px 11px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#B6A485", letterSpacing: ".08em", whiteSpace: "nowrap" }}>TEST</span>
              <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                <button onClick={handleAdvanceDay} style={{ flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: "11px", color: "#7A6A53", background: "#F1EAD9", border: "1px solid #E0D4BD", borderRadius: "10px", padding: "7px 4px", cursor: "pointer" }}>＋1日</button>
                <button onClick={handleResetDate} style={{ flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: "11px", color: "#7A6A53", background: "#F1EAD9", border: "1px solid #E0D4BD", borderRadius: "10px", padding: "7px 4px", cursor: "pointer" }}>リセット</button>
                <button onClick={handlePurgeAllData} style={{ flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: "11px", color: "#C75B4A", background: "#FAF0EE", border: "1px solid #E8C8C2", borderRadius: "10px", padding: "7px 4px", cursor: "pointer" }}>全消去</button>
              </div>
            </section>
          )}

        </div>

        {/* その他メニュー */}
        {showMenu && (
          <div
            onClick={() => setShowMenu(false)}
            style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(50,38,18,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: "320px", background: "#F7F0E1", borderRadius: "24px", padding: "20px 20px 24px", boxShadow: "0 20px 60px rgba(50,35,15,.4)", fontFamily: FONT }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <span style={{ fontWeight: 800, fontSize: "16px", color: "#6E4A2A" }}>その他</span>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{ width: "30px", height: "30px", borderRadius: "50%", border: "none", background: "#EAE0CC", color: "#7A6A53", fontSize: "14px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {/* 果樹園 */}
                <Link
                  href="/orchard"
                  onClick={() => setShowMenu(false)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "14px 8px", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "16px", textDecoration: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "28px" }}>🧺</span>
                  <span style={{ fontWeight: 700, fontSize: "11px", color: "#5A7A33" }}>果樹園</span>
                </Link>
                {/* バランス */}
                <button
                  onClick={() => { setShowMenu(false); setShowBalance(true); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "14px 8px", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "16px", cursor: "pointer", fontFamily: FONT }}
                >
                  <span style={{ fontSize: "28px" }}>📊</span>
                  <span style={{ fontWeight: 700, fontSize: "11px", color: "#5A7A33" }}>バランス</span>
                </button>
                {/* ログアウト */}
                <button
                  onClick={() => { setShowMenu(false); signOut(); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "14px 8px", background: "#FBF0EE", border: "1.5px solid #E8C8C2", borderRadius: "16px", cursor: "pointer", fontFamily: FONT }}
                >
                  <span style={{ fontSize: "28px" }}>🚪</span>
                  <span style={{ fontWeight: 700, fontSize: "11px", color: "#C75B4A" }}>ログアウト</span>
                </button>
                {/* フレンド */}
                <Link
                  href="/friends"
                  onClick={() => setShowMenu(false)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "14px 8px", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "16px", textDecoration: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "28px" }}>👥</span>
                  <span style={{ fontWeight: 700, fontSize: "11px", color: "#5A7A33" }}>フレンド</span>
                </Link>
                {/* ジャーナル */}
                <Link
                  href="/journal/review"
                  onClick={() => setShowMenu(false)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "14px 8px", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "16px", textDecoration: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "28px" }}>📓</span>
                  <span style={{ fontWeight: 700, fontSize: "11px", color: "#5A7A33" }}>ジャーナル</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Balance popup (top sheet) */}
        {showBalance && (
          <div
            onClick={() => setShowBalance(false)}
            style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(50,38,18,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "390px", maxWidth: "100%", background: "#F7F0E1", borderRadius: "0 0 26px 26px", padding: "16px 18px 24px", boxShadow: "0 16px 50px rgba(50,35,15,.3)", display: "flex", flexDirection: "column", gap: "15px", fontFamily: FONT }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: ".08em", color: "#6E4A2A" }}>📊 バランス</span>
                <button
                  onClick={() => setShowBalance(false)}
                  style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: FONT, fontWeight: 700, fontSize: "11.5px", color: "#5A7A33", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "999px", padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  ← 戻る
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                {Object.entries(CAT_META).map(([catId, meta]) => {
                  const color = CAT_COLORS[catId] ?? "#999";
                  const score = cycleScores[catId as Category] ?? 0;
                  const pct = Math.min(100, Math.round(score / 2));
                  return (
                    <div key={catId} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <span style={{ fontSize: "14px" }}>{meta.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: "12.5px", color: "#5C5040" }}>{meta.name}</span>
                        <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: "12px", color: "#A8987F" }}>{score}pt</span>
                      </div>
                      <div style={{ height: "9px", borderRadius: "999px", background: "#EDE4D1", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width .35s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Harvest confirmation dialog */}
        {showHarvestConfirm && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(50,38,18,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: FONT }}
          >
            <div style={{ width: "100%", maxWidth: "320px", background: "#F7F0E1", borderRadius: "24px", padding: "28px 22px 22px", boxShadow: "0 20px 60px rgba(50,35,15,.4)", display: "flex", flexDirection: "column", gap: "0" }}>
              <div style={{ fontSize: "44px", textAlign: "center", marginBottom: "12px" }}>🍎</div>
              <h2 style={{ margin: "0 0 10px", fontWeight: 800, fontSize: "18px", color: "#6E4A2A", textAlign: "center" }}>新サイクルを始めますか？</h2>
              <p style={{ margin: "0 0 22px", fontSize: "12.5px", color: "#A8987F", textAlign: "center", lineHeight: 1.6 }}>
                今サイクルのスコア <strong style={{ color: "#6E4A2A" }}>{totalCycleScore}pt</strong> で収穫します。<br />
                収穫すると新しい7日間が始まります。
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowHarvestConfirm(false)}
                  style={{ flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: "14px", color: "#7A6A53", background: "#EDE4D1", border: "none", borderRadius: "14px", padding: "13px 0", cursor: "pointer" }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleHarvestConfirm}
                  style={{ flex: 1, fontFamily: FONT, fontWeight: 800, fontSize: "14px", color: "#fff", background: "#5A9E2E", border: "none", borderRadius: "14px", padding: "13px 0", cursor: "pointer", boxShadow: "0 4px 12px rgba(90,158,46,.35)" }}
                >
                  収穫する 🍎
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

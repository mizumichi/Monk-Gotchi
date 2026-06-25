"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { client } from "@/lib/amplifyClient";
import { getCurrentDateString } from "@/lib/date";
import {
  computeConsecutiveDays,
  computeStats,
  filterByRange,
  generateSlotsForRange,
  mergeWithEntries,
  MOOD_LABELS,
  RANGE_DAYS,
  sortEntries,
  type JournalEntry,
  type RangeLabel,
  type Slot,
} from "@/lib/journalStats";
import type { Schema } from "../../../../amplify/data/resource";

const JournalChart = dynamic(() => import("@/components/JournalChart"), { ssr: false });

type JournalRecord = Schema["Journal"]["type"];
type TabKey = "graph" | "list";

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";
const LIST_PAGE_SIZE = 7;

function fmtDateJa(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y}/${parseInt(m)}/${parseInt(d)}`;
}

export default function JournalReviewPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();

  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeLabel, setRangeLabel] = useState<RangeLabel>("1週間");
  const [activeTab, setActiveTab] = useState<TabKey>("graph");
  const [listPage, setListPage] = useState(0);

  const today = useMemo(() => getCurrentDateString(), []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    async function load() {
      setLoading(true);
      try {
        const cutoff = new Date(today + "T12:00:00Z");
        cutoff.setUTCDate(cutoff.getUTCDate() - 29);
        const cutoffStr = cutoff.toISOString().slice(0, 10);

        const allData: JournalRecord[] = [];
        let nt: string | null | undefined;
        do {
          const res = await client.models.Journal.list({
            filter: { date: { ge: cutoffStr } },
            ...(nt ? { nextToken: nt } : {}),
          });
          (res.data ?? []).forEach((d) => allData.push(d));
          nt = res.nextToken;
        } while (nt);

        const entries: JournalEntry[] = allData
          .filter((d) => d.date && (d.slot === "morning" || d.slot === "evening"))
          .map((d) => ({
            id: d.id,
            date: d.date as string,
            slot: d.slot as Slot,
            mood: d.mood,
            text: d.text ?? null,
          }));

        setAllEntries(sortEntries(entries));
      } catch (err) {
        console.error("JournalReview load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authStatus, today]);

  // グラフ用: 選択範囲の全スロット（空枠含む）+ エントリ埋め込み
  const chartSlots = useMemo(
    () => mergeWithEntries(generateSlotsForRange(RANGE_DAYS[rangeLabel], rangeLabel, today), allEntries),
    [allEntries, rangeLabel, today],
  );

  // 統計: 選択範囲内のエントリのみ
  const filteredEntries = useMemo(
    () => filterByRange(allEntries, RANGE_DAYS[rangeLabel]),
    [allEntries, rangeLabel],
  );
  const stats = useMemo(() => computeStats(filteredEntries), [filteredEntries]);

  // 連続記録日数: 全エントリから計算（範囲問わず）
  const consecutiveDays = useMemo(
    () => computeConsecutiveDays(allEntries, today),
    [allEntries, today],
  );

  // 一覧: 全エントリを日付でグループ化（新しい順）
  const allEntriesByDate = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    for (const e of allEntries) {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [allEntries]);

  const totalListPages = Math.max(1, Math.ceil(allEntriesByDate.length / LIST_PAGE_SIZE));
  const pagedDateEntries = allEntriesByDate.slice(
    listPage * LIST_PAGE_SIZE,
    (listPage + 1) * LIST_PAGE_SIZE,
  );

  // タブ切り替え時にリストページをリセット
  useEffect(() => {
    if (activeTab === "list") setListPage(0);
  }, [activeTab]);

  if (authStatus !== "authenticated") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#E7DECB", fontFamily: FONT }}>
        <p style={{ color: "#A8987F", fontWeight: 700 }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#E7DECB", fontFamily: FONT }}>
      <div style={{ width: "390px", maxWidth: "100%", minHeight: "100vh", margin: "0 auto", background: "#F3ECDD", boxShadow: "0 0 60px rgba(80,60,30,.15)", display: "flex", flexDirection: "column" }}>

        {/* ヘッダー */}
        <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 12px", background: "#F3ECDD", borderBottom: "1px solid #E4D9C2" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "15px", letterSpacing: ".08em", color: "#6E4A2A" }}>📓 ジャーナル</p>
            <p style={{ margin: "1px 0 0", fontSize: "10.5px", color: "#A8987F" }}>朝夜の気分と一言メモ</p>
          </div>
          <Link
            href="/dashboard"
            style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: FONT, fontWeight: 700, fontSize: "11.5px", color: "#5A7A33", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "999px", padding: "6px 12px", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            ← ダッシュボード
          </Link>
        </header>

        <main style={{ flex: 1, padding: "14px 16px 40px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* 統計ストリップ（選択範囲に連動） */}
          <div style={{ display: "flex", background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 14px rgba(90,70,35,.08)" }}>
            <div style={{ flex: 1, padding: "14px 8px", textAlign: "center" }}>
              <p style={{ margin: "0 0 3px", fontSize: "9.5px", fontWeight: 700, color: "#A8987F", letterSpacing: ".06em" }}>平均気分</p>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#5A7A33", lineHeight: 1 }}>
                {filteredEntries.length > 0 ? stats.avgMood : "—"}
              </p>
            </div>
            <div style={{ width: "1px", background: "#E6DBC4", margin: "12px 0" }} />
            <div style={{ flex: 1, padding: "14px 8px", textAlign: "center" }}>
              <p style={{ margin: "0 0 3px", fontSize: "9.5px", fontWeight: 700, color: "#A8987F", letterSpacing: ".06em" }}>連続記録</p>
              <p style={{ margin: 0, lineHeight: 1 }}>
                <span style={{ fontSize: "26px", fontWeight: 800, color: "#C77B4A" }}>
                  {consecutiveDays}
                </span>
                <span style={{ fontSize: "11px", color: "#A8987F", marginLeft: "2px" }}>日</span>
              </p>
            </div>
            <div style={{ width: "1px", background: "#E6DBC4", margin: "12px 0" }} />
            <div style={{ flex: 1, padding: "14px 8px", textAlign: "center" }}>
              <p style={{ margin: "0 0 3px", fontSize: "9.5px", fontWeight: 700, color: "#A8987F", letterSpacing: ".06em" }}>最高気分</p>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#9B6BB0", lineHeight: 1 }}>
                {filteredEntries.length > 0 ? stats.bestMood : "—"}
              </p>
            </div>
          </div>

          {/* タブバー */}
          <div style={{ display: "flex", gap: "7px" }}>
            {([["graph", "📈 グラフ"], ["list", "📋 一覧"]] as const).map(([key, label]) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: "12.5px", cursor: "pointer",
                    borderRadius: "999px", padding: "8px 0",
                    border: isActive ? "1.5px solid #C77B4A" : "1.5px solid #E2D6BE",
                    background: isActive ? "#C77B4A" : "#FBF6EC",
                    color: isActive ? "#fff" : "#7A6A53",
                    boxShadow: isActive ? "0 3px 8px rgba(199,123,74,.3)" : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* コンテンツ */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#B6A485" }}>読み込み中...</p>
            </div>
          ) : activeTab === "graph" ? (
            <JournalChart
              slots={chartSlots}
              rangeLabel={rangeLabel}
              onRangeChange={setRangeLabel}
            />
          ) : (
            /* 一覧タブ */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {allEntriesByDate.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📓</div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#6E4A2A" }}>まだ記録がありません</p>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#A8987F" }}>ダッシュボードから朝・夜のジャーナルを記録しましょう</p>
                </div>
              ) : (
                <>
                  {/* 日付ごとカード */}
                  {pagedDateEntries.map(([date, dayEntries]) => (
                    <div key={date} style={{ background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "18px", overflow: "hidden", boxShadow: "0 2px 8px rgba(90,70,35,.06)" }}>
                      <div style={{ padding: "10px 14px", borderBottom: "1px solid #E6DBC4", background: "#F3ECDD" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: "12px", color: "#6E4A2A" }}>{fmtDateJa(date)}</p>
                      </div>
                      {dayEntries.map((e, i) => (
                        <div
                          key={e.id}
                          style={{ padding: "12px 14px", borderBottom: i < dayEntries.length - 1 ? "1px solid #EDE4D1" : "none" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: e.text ? "6px" : 0 }}>
                            <span style={{ fontSize: "16px" }}>{e.slot === "morning" ? "🌅" : "🌙"}</span>
                            <span style={{ fontWeight: 700, fontSize: "11.5px", color: "#7A6A53" }}>
                              {e.slot === "morning" ? "朝" : "夜"}
                            </span>
                            <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: "18px", color: e.slot === "morning" ? "#93C46F" : "#5A7A33", lineHeight: 1 }}>
                              {e.mood}
                            </span>
                            <span style={{ fontSize: "10.5px", color: "#A8987F", minWidth: "52px", textAlign: "right" }}>
                              {MOOD_LABELS[e.mood]}
                            </span>
                          </div>
                          {e.text && (
                            <p style={{ margin: 0, fontSize: "12px", color: "#5C5040", lineHeight: 1.65, paddingLeft: "24px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                              {e.text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* ページネーション */}
                  {totalListPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", paddingTop: "4px" }}>
                      <button
                        onClick={() => setListPage((p) => Math.max(0, p - 1))}
                        disabled={listPage === 0}
                        style={{
                          fontFamily: FONT, fontWeight: 700, fontSize: "14px", cursor: listPage === 0 ? "default" : "pointer",
                          width: "32px", height: "32px", borderRadius: "50%",
                          border: "1.5px solid #E2D6BE", background: "#FBF6EC",
                          color: listPage === 0 ? "#D4C9B4" : "#7A6A53",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        ‹
                      </button>
                      {Array.from({ length: totalListPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setListPage(i)}
                          style={{
                            fontFamily: FONT, fontWeight: 700, fontSize: "12px", cursor: "pointer",
                            width: "32px", height: "32px", borderRadius: "50%",
                            border: listPage === i ? "1.5px solid #C77B4A" : "1.5px solid #E2D6BE",
                            background: listPage === i ? "#C77B4A" : "#FBF6EC",
                            color: listPage === i ? "#fff" : "#7A6A53",
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setListPage((p) => Math.min(totalListPages - 1, p + 1))}
                        disabled={listPage === totalListPages - 1}
                        style={{
                          fontFamily: FONT, fontWeight: 700, fontSize: "14px", cursor: listPage === totalListPages - 1 ? "default" : "pointer",
                          width: "32px", height: "32px", borderRadius: "50%",
                          border: "1.5px solid #E2D6BE", background: "#FBF6EC",
                          color: listPage === totalListPages - 1 ? "#D4C9B4" : "#7A6A53",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

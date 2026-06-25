"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MOOD_LABELS,
  type ChartSlot,
  type RangeLabel,
} from "@/lib/journalStats";

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";
const MORNING_COLOR = "#93C46F";
const EVENING_COLOR = "#5A7A33";
const RANGES: RangeLabel[] = ["1週間", "2週間", "1ヶ月"];

interface Props {
  slots: ChartSlot[];
  rangeLabel: RangeLabel;
  onRangeChange: (r: RangeLabel) => void;
}

function slotKey(s: ChartSlot) {
  return `${s.date}-${s.slot}`;
}

function lastFilledKey(slots: ChartSlot[]): string | null {
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i].mood !== null) return slotKey(slots[i]);
  }
  return null;
}

export default function JournalChart({ slots, rangeLabel, onRangeChange }: Props) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => lastFilledKey(slots));

  // slotsが変わったとき（範囲切り替えなど）に選択を最新エントリへリセット
  useEffect(() => {
    setSelectedKey(lastFilledKey(slots));
  }, [slots]);

  // ピッカーを末尾までスクロール
  useEffect(() => {
    if (pickerRef.current) {
      pickerRef.current.scrollLeft = pickerRef.current.scrollWidth;
    }
  }, [slots]);

  const hasAnyEntry = slots.some((s) => s.mood !== null);

  // ---- recharts カスタム描画 ----

  const renderDot = (props: Record<string, unknown>) => {
    const cx = props.cx as number;
    const cy = props.cy as number;
    const index = props.index as number;
    const s = slots[index];
    // nullスロットは描画しない
    if (!s || s.mood === null || cx == null || cy == null) return <g key={index} />;
    const isMorning = s.slot === "morning";
    const r = isMorning ? 4 : 6;
    const fill = isMorning ? MORNING_COLOR : EVENING_COLOR;
    const isSelected = slotKey(s) === selectedKey;
    return (
      <circle
        key={index}
        cx={cx}
        cy={cy}
        r={isSelected ? r + 3 : r}
        fill={fill}
        stroke={isSelected ? "#F7F0E1" : "transparent"}
        strokeWidth={2}
        style={{ cursor: "pointer" }}
        onClick={() => setSelectedKey(slotKey(s))}
      />
    );
  };

  const renderTick = (props: Record<string, unknown>) => {
    const x = props.x as number;
    const y = props.y as number;
    const index = props.index as number;
    const s = slots[index];
    if (!s?.showTick) return <g key={index} />;
    return (
      <text
        key={index}
        x={x}
        y={(y as number) + 14}
        textAnchor="middle"
        fill="#A8987F"
        fontSize={10}
        fontFamily={FONT}
      >
        {s.label}
      </text>
    );
  };

  const selectedSlot = slots.find((s) => slotKey(s) === selectedKey && s.mood !== null) ?? null;
  const pickerSlots = slots.filter((s) => s.mood !== null);

  if (!hasAnyEntry) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 14px rgba(90,70,35,.08)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📓</div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "13px", color: "#6E4A2A" }}>この期間の記録がありません</p>
            <p style={{ margin: "6px 0 0", fontSize: "11.5px", color: "#A8987F", lineHeight: 1.7 }}>
              ダッシュボードのルーティンタブから<br />朝・夜のジャーナルを記録しましょう
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px", padding: "0 14px 14px", justifyContent: "center" }}>
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: "11.5px", cursor: "pointer",
                  borderRadius: "999px", padding: "5px 13px",
                  border: rangeLabel === r ? "1.5px solid #7FB23A" : "1.5px solid #E2D6BE",
                  background: rangeLabel === r ? "#7FB23A" : "#FBF6EC",
                  color: rangeLabel === r ? "#fff" : "#7A6A53",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* チャートカード */}
      <div style={{ background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 14px rgba(90,70,35,.08)" }}>

        {/* 凡例 */}
        <div style={{ display: "flex", gap: "14px", padding: "12px 16px 0", justifyContent: "flex-end", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: MORNING_COLOR }} />
            <span style={{ fontFamily: FONT, fontSize: "10px", color: "#A8987F", fontWeight: 600 }}>朝</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: EVENING_COLOR }} />
            <span style={{ fontFamily: FONT, fontSize: "10px", color: "#A8987F", fontWeight: 600 }}>夜</span>
          </div>
        </div>

        {/* 折れ線グラフ */}
        <div style={{ padding: "4px 4px 0", userSelect: "none" }}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={slots} margin={{ top: 10, right: 12, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6DBC4" vertical={false} />
              <XAxis
                interval={0}
                tick={renderTick as Parameters<typeof XAxis>[0]["tick"]}
                axisLine={false}
                tickLine={false}
                height={28}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[2, 5, 8, 10]}
                tick={{ fontSize: 10, fill: "#A8987F", fontFamily: FONT }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <ReferenceLine y={5} stroke="#D6A33E" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const s = payload[0].payload as ChartSlot;
                  if (s.mood === null) return null;
                  return (
                    <div style={{ background: "#F7F0E1", border: "1px solid #E6DBC4", borderRadius: "10px", padding: "8px 10px", fontFamily: FONT, boxShadow: "0 4px 12px rgba(90,70,35,.15)" }}>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#6E4A2A" }}>
                        {s.date} {s.slot === "morning" ? "朝" : "夜"}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 800, color: s.slot === "morning" ? MORNING_COLOR : EVENING_COLOR }}>
                        気分 {s.mood}
                      </p>
                      {s.text && (
                        <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#7A6A53", maxWidth: "140px" }}>
                          {s.text.slice(0, 30)}{s.text.length > 30 ? "…" : ""}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {/* connectNulls={false} でnullをまたいで線を繋がない */}
              <Line
                type="monotone"
                dataKey="mood"
                stroke={MORNING_COLOR}
                strokeWidth={2.5}
                dot={renderDot as Parameters<typeof Line>[0]["dot"]}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 範囲セレクター */}
        <div style={{ display: "flex", gap: "6px", padding: "10px 14px 14px", justifyContent: "center" }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              style={{
                fontFamily: FONT, fontWeight: 700, fontSize: "11.5px", cursor: "pointer",
                borderRadius: "999px", padding: "5px 13px",
                border: rangeLabel === r ? "1.5px solid #7FB23A" : "1.5px solid #E2D6BE",
                background: rangeLabel === r ? "#7FB23A" : "#FBF6EC",
                color: rangeLabel === r ? "#fff" : "#7A6A53",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* エントリピッカー（記録があるものだけ） */}
      <div
        ref={pickerRef}
        style={{ overflowX: "auto", scrollbarWidth: "none", padding: "2px 0 4px" }}
      >
        <div style={{ display: "flex", gap: "8px", minWidth: "max-content" }}>
          {pickerSlots.map((s) => {
            const key = slotKey(s);
            const isSelected = key === selectedKey;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: "10px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                  padding: "7px 9px", borderRadius: "12px", flexShrink: 0,
                  border: isSelected ? "1.5px solid #7FB23A" : "1.5px solid #E2D6BE",
                  background: isSelected ? "#EBF1DC" : "#FBF6EC",
                  color: "#6E4A2A",
                }}
              >
                <span style={{ fontSize: "12px" }}>{s.slot === "morning" ? "🌅" : "🌙"}</span>
                <span>{s.label}</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: s.slot === "morning" ? MORNING_COLOR : EVENING_COLOR }}>
                  {s.mood}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択エントリの詳細カード */}
      {selectedSlot && (
        <div style={{ background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "18px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(90,70,35,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: selectedSlot.text ? "10px" : 0 }}>
            <span style={{ fontSize: "22px" }}>{selectedSlot.slot === "morning" ? "🌅" : "🌙"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "13px", color: "#6E4A2A" }}>
                {selectedSlot.date} {selectedSlot.slot === "morning" ? "朝" : "夜"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#A8987F" }}>
                {MOOD_LABELS[selectedSlot.mood!]}
              </p>
            </div>
            <div style={{ fontWeight: 800, fontSize: "28px", color: selectedSlot.slot === "morning" ? MORNING_COLOR : EVENING_COLOR, lineHeight: 1 }}>
              {selectedSlot.mood}
            </div>
          </div>
          {selectedSlot.text ? (
            <p style={{ margin: 0, fontSize: "12.5px", color: "#5C5040", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {selectedSlot.text}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "12px", color: "#B6A485" }}>メモなし</p>
          )}
        </div>
      )}
    </div>
  );
}

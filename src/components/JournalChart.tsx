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
  shouldShowTick,
  type JournalEntry,
  type RangeLabel,
} from "@/lib/journalStats";

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";
const MORNING_COLOR = "#93C46F";
const EVENING_COLOR = "#5A7A33";
const RANGES: RangeLabel[] = ["1週間", "2週間", "1ヶ月"];

interface ChartPoint extends JournalEntry {
  pointIdx: number;
  showTick: boolean;
  label: string;
}

interface Props {
  entries: JournalEntry[];
  rangeLabel: RangeLabel;
  onRangeChange: (r: RangeLabel) => void;
}

function fmtShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function JournalChart({ entries, rangeLabel, onRangeChange }: Props) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    entries.length > 0 ? entries.length - 1 : null
  );

  useEffect(() => {
    setSelectedIdx(entries.length > 0 ? entries.length - 1 : null);
  }, [entries]);

  useEffect(() => {
    if (pickerRef.current) {
      pickerRef.current.scrollLeft = pickerRef.current.scrollWidth;
    }
  }, [entries]);

  let morningCount = 0;
  const chartData: ChartPoint[] = entries.map((e, i) => {
    const isMorning = e.slot === "morning";
    const morningIdx = isMorning ? morningCount++ : -1;
    const showTick = isMorning && morningIdx >= 0 && shouldShowTick(morningIdx, rangeLabel);
    return { ...e, pointIdx: i, showTick, label: fmtShort(e.date) };
  });

  // Dot: morning=small+light, evening=large+dark, selected=highlighted
  const renderDot = (props: Record<string, unknown>) => {
    const cx = props.cx as number;
    const cy = props.cy as number;
    const index = props.index as number;
    const entry = chartData[index];
    if (!entry || cx == null || cy == null) return <g key={index} />;
    const isMorning = entry.slot === "morning";
    const r = isMorning ? 4 : 6;
    const fill = isMorning ? MORNING_COLOR : EVENING_COLOR;
    const isSelected = index === selectedIdx;
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
        onClick={() => setSelectedIdx(index)}
      />
    );
  };

  // X tick: only show label for morning entries that pass interval check
  const renderTick = (props: Record<string, unknown>) => {
    const x = props.x as number;
    const y = props.y as number;
    const index = props.index as number;
    const entry = chartData[index];
    if (!entry?.showTick) return <g key={index} />;
    return (
      <text
        key={index}
        x={x}
        y={y + 14}
        textAnchor="middle"
        fill="#A8987F"
        fontSize={10}
        fontFamily={FONT}
      >
        {entry.label}
      </text>
    );
  };

  const selectedEntry = selectedIdx !== null ? chartData[selectedIdx] : null;

  if (entries.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>📓</div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#6E4A2A" }}>まだ記録がありません</p>
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#A8987F", lineHeight: 1.7 }}>
          ダッシュボードのルーティンタブから<br />朝・夜のジャーナルを記録しましょう
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* Chart card */}
      <div style={{ background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 14px rgba(90,70,35,.08)" }}>

        {/* Legend */}
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

        {/* Line chart */}
        <div style={{ padding: "4px 4px 0", userSelect: "none" }}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: -20 }}>
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
                  const d = payload[0].payload as ChartPoint;
                  return (
                    <div style={{ background: "#F7F0E1", border: "1px solid #E6DBC4", borderRadius: "10px", padding: "8px 10px", fontFamily: FONT, boxShadow: "0 4px 12px rgba(90,70,35,.15)" }}>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#6E4A2A" }}>
                        {d.date} {d.slot === "morning" ? "朝" : "夜"}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 800, color: d.slot === "morning" ? MORNING_COLOR : EVENING_COLOR }}>
                        気分 {d.mood}
                      </p>
                      {d.text && (
                        <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#7A6A53", maxWidth: "140px" }}>
                          {d.text.slice(0, 30)}{d.text.length > 30 ? "…" : ""}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke={MORNING_COLOR}
                strokeWidth={2.5}
                dot={renderDot as Parameters<typeof Line>[0]["dot"]}
                activeDot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Range selector */}
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

      {/* Entry picker (horizontal scroll) */}
      <div
        ref={pickerRef}
        style={{ overflowX: "auto", scrollbarWidth: "none", padding: "2px 0 4px" }}
      >
        <div style={{ display: "flex", gap: "8px", minWidth: "max-content" }}>
          {chartData.map((e, i) => (
            <button
              key={`${e.date}-${e.slot}`}
              onClick={() => setSelectedIdx(i)}
              style={{
                fontFamily: FONT, fontWeight: 700, fontSize: "10px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                padding: "7px 9px", borderRadius: "12px", flexShrink: 0,
                border: selectedIdx === i ? "1.5px solid #7FB23A" : "1.5px solid #E2D6BE",
                background: selectedIdx === i ? "#EBF1DC" : "#FBF6EC",
                color: "#6E4A2A",
              }}
            >
              <span style={{ fontSize: "12px" }}>{e.slot === "morning" ? "🌅" : "🌙"}</span>
              <span>{fmtShort(e.date)}</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: e.slot === "morning" ? MORNING_COLOR : EVENING_COLOR }}>
                {e.mood}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected entry detail */}
      {selectedEntry && (
        <div style={{ background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "18px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(90,70,35,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: selectedEntry.text ? "10px" : 0 }}>
            <span style={{ fontSize: "22px" }}>{selectedEntry.slot === "morning" ? "🌅" : "🌙"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "13px", color: "#6E4A2A" }}>
                {selectedEntry.date} {selectedEntry.slot === "morning" ? "朝" : "夜"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#A8987F" }}>
                {MOOD_LABELS[selectedEntry.mood]}
              </p>
            </div>
            <div style={{ fontWeight: 800, fontSize: "28px", color: selectedEntry.slot === "morning" ? MORNING_COLOR : EVENING_COLOR, lineHeight: 1 }}>
              {selectedEntry.mood}
            </div>
          </div>
          {selectedEntry.text ? (
            <p style={{ margin: 0, fontSize: "12.5px", color: "#5C5040", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {selectedEntry.text}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "12px", color: "#B6A485" }}>メモなし</p>
          )}
        </div>
      )}
    </div>
  );
}

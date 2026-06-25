"use client";

import { CATEGORY_META, type Task } from "@/data/tasks";
import { calcSleepHoursXp, getSleepHoursLabel } from "@/lib/sleepXp";

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";
const CAT_COLOR = "#5E6BB0"; // sleep category warm color

const BUTTONS: { label: string; value: number }[] = [
  { label: "5h", value: 5.0 },
  { label: "6h", value: 6.0 },
  { label: "7h", value: 7.0 },
  { label: "8h", value: 8.0 },
  { label: "9h", value: 9.0 },
  { label: "10h+", value: 10.0 },
];

interface Props {
  task: Task;
  currentValue: number | null;
  isCompleted: boolean;
  isFavorite: boolean;
  onSubmit: (taskId: string, value: number) => void;
  onClear: (taskId: string) => void;
  onOpenDetail: () => void;
  onToggleFavorite: () => void;
}

export default function SleepHoursInput({
  task,
  currentValue,
  isCompleted,
  isFavorite,
  onSubmit,
  onClear,
  onOpenDetail,
  onToggleFavorite,
}: Props) {
  const catMeta = CATEGORY_META[task.category];
  const subCatMeta = task.subCategory ? CATEGORY_META[task.subCategory] : undefined;

  const mainXpEarned = currentValue != null
    ? Math.round(task.mainXp * calcSleepHoursXp(currentValue))
    : null;
  const subXpEarned = currentValue != null && task.subXp != null
    ? Math.round(task.subXp * calcSleepHoursXp(currentValue))
    : null;
  const evalLabel = currentValue != null ? getSleepHoursLabel(currentValue) : null;

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 6px rgba(90,70,35,.05)", fontFamily: FONT }}>
      {/* Left accent */}
      <div style={{ width: "5px", flexShrink: 0, background: CAT_COLOR }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: "11px", padding: "12px 12px 12px 13px", flex: 1, minWidth: 0 }}>
        {/* Icon + star column */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flexShrink: 0 }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px", background: CAT_COLOR + "1A" }}>
            {task.icon}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            style={{ width: "26px", height: "26px", borderRadius: "50%", border: "none", padding: 0, background: isFavorite ? "#FFF6D6" : "transparent", fontSize: "15px", cursor: "pointer", color: isFavorite ? "#FFD24A" : "#C8BBA8", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "13.5px", lineHeight: 1.35, wordBreak: "break-word", color: isCompleted ? "#A99B85" : "#43382A" }}>
            {task.name}
          </p>
          <p style={{ margin: 0, fontSize: "11.5px", color: "#A8987F", lineHeight: 1.3 }}>{task.description}</p>

          {currentValue != null && evalLabel ? (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginTop: "2px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: evalLabel.color }}>
                ✓ {currentValue}h ({evalLabel.label})
              </span>
              {mainXpEarned != null && (
                <span style={{ fontSize: "10.5px", fontWeight: 700, borderRadius: "7px", padding: "2px 7px", color: CAT_COLOR, background: CAT_COLOR + "1F" }}>
                  +{mainXpEarned} {catMeta.icon}{catMeta.label}
                  {subCatMeta && subXpEarned != null && (
                    <span style={{ opacity: 0.75 }}> · +{subXpEarned} {subCatMeta.label}</span>
                  )}
                </span>
              )}
              <button
                onClick={() => onClear(task.id)}
                style={{ fontSize: "10.5px", color: "#B6A485", background: "#EDE4D1", border: "none", borderRadius: "6px", padding: "2px 8px", cursor: "pointer", fontFamily: FONT }}
              >
                取り消す
              </button>
            </div>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: "11px", color: "#B6A485" }}>昨夜の睡眠時間は？</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {BUTTONS.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => onSubmit(task.id, btn.value)}
                    style={{ fontFamily: FONT, fontWeight: 700, fontSize: "11.5px", color: CAT_COLOR, background: "#fff", border: `1.5px solid ${CAT_COLOR}40`, borderRadius: "8px", padding: "5px 10px", cursor: "pointer" }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "2px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: 700, fontSize: "10.5px", borderRadius: "7px", padding: "2px 7px", color: CAT_COLOR, background: CAT_COLOR + "1F" }}>
                  +{task.mainXp} {catMeta.icon}{catMeta.label}
                </span>
                {subCatMeta && task.subXp && (
                  <span style={{ fontSize: "10px", color: "#B6A485", padding: "2px 0" }}>
                    · +{task.subXp} {subCatMeta.icon}{subCatMeta.label} <span style={{ color: "#C8BBA8" }}>(7-9h で満点)</span>
                  </span>
                )}
              </div>
              <button
                onClick={onOpenDetail}
                style={{ alignSelf: "flex-start", fontSize: "10px", color: "#C8BBA8", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: FONT }}
              >
                ⓘ 詳細
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TASKS,
  CATEGORY_META,
  type Task,
} from "@/data/tasks";
import {
  checkConstraint,
  getTodayString,
  type DailyLogSummary,
} from "@/lib/constraints";
import TaskDetailModal from "@/components/TaskDetailModal";
import SleepHoursInput from "@/components/SleepHoursInput";
import JournalModal from "@/components/JournalModal";

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

const WARM_CAT_COLORS: Record<string, string> = {
  strength: "#C75B4A",
  sleep: "#5E6BB0",
  nutrition: "#5FA052",
  environment: "#D6A33E",
  mental: "#9B6BB0",
};

interface JournalEntry {
  id: string;
  mood: number;
  text: string | null;
}

interface Props {
  tasks: Task[];
  checkedTaskIds: Set<string>;
  pendingTaskIds: Set<string>;
  onToggle: (task: Task) => void;
  loading?: boolean;
  numericValues?: Record<string, number>;
  onNumericSubmit?: (taskId: string, value: number) => void;
  onNumericClear?: (taskId: string) => void;
  recentLogs?: DailyLogSummary[];
  today?: string;
  cycleStartDate?: string;
  isFavorite: (taskId: string) => boolean;
  toggleFavorite: (taskId: string) => void;
  isRoutineTab?: boolean;
  journals?: Record<string, JournalEntry | null>;
  onJournalSave?: (slot: "morning" | "evening", mood: number, text: string) => Promise<void>;
  onJournalDelete?: (slot: "morning" | "evening") => Promise<void>;
  onReorder?: (newIds: string[]) => void;
  disabled?: boolean;
}

// Module-level: must not be defined inside the main component
function SortableTaskItem({
  id,
  children,
}: {
  id: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const handle = (
    <div
      ref={setActivatorNodeRef}
      {...listeners}
      style={{
        width: "28px",
        flexShrink: 0,
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDragging ? "grabbing" : "grab",
        color: "#C8BBA8",
        touchAction: "none",
        background: "rgba(240,234,221,.55)",
        borderRight: "1px solid #E6DBC4",
      }}
    >
      <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
        <circle cx="3.5" cy="3.5" r="1.5" />
        <circle cx="8.5" cy="3.5" r="1.5" />
        <circle cx="3.5" cy="9" r="1.5" />
        <circle cx="8.5" cy="9" r="1.5" />
        <circle cx="3.5" cy="14.5" r="1.5" />
        <circle cx="8.5" cy="14.5" r="1.5" />
      </svg>
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(handle)}
    </div>
  );
}

export default function TaskList({
  tasks,
  checkedTaskIds,
  pendingTaskIds,
  onToggle,
  loading = false,
  numericValues = {},
  onNumericSubmit,
  onNumericClear,
  recentLogs = [],
  today: todayProp,
  cycleStartDate,
  isFavorite,
  toggleFavorite,
  isRoutineTab = false,
  journals = {},
  onJournalSave,
  onJournalDelete,
  onReorder,
  disabled = false,
}: Props) {
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);
  const [journalTask, setJournalTask] = useState<Task | null>(null);

  const today = todayProp ?? getTodayString();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const constraintMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof checkConstraint>> = {};
    for (const task of TASKS) {
      map[task.id] = checkConstraint(task, recentLogs, today, cycleStartDate);
    }
    return map;
  }, [recentLogs, today, cycleStartDate]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      const ids = tasks.map((t) => t.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(ids, oldIndex, newIndex));
      }
    }
  }

  // Renders a single task card. dragHandle is null when drag-and-drop is disabled.
  function renderTask(task: Task, dragHandle: React.ReactNode | null): React.ReactNode {
    const checked = checkedTaskIds.has(task.id);
    const pending = pendingTaskIds.has(task.id);
    const catMeta = CATEGORY_META[task.category];
    const subCatMeta = task.subCategory ? CATEGORY_META[task.subCategory] : undefined;
    const catColor = WARM_CAT_COLORS[task.category] ?? catMeta.color;
    const subCatColor = task.subCategory
      ? (WARM_CAT_COLORS[task.subCategory] ?? subCatMeta?.color ?? "#999")
      : "#999";
    const constraint = constraintMap[task.id];
    const isBlocked = !checked && constraint?.blocked === true;
    const showCount =
      !isBlocked &&
      constraint?.achievementCount !== undefined &&
      constraint?.cycleLimit !== undefined;
    const isReasonExpanded = expandedReasonId === task.id;
    const fav = isFavorite(task.id);

    if (task.taskKind === "numeric") {
      return (
        <SleepHoursInput
          task={task}
          currentValue={numericValues[task.id] ?? null}
          isCompleted={checked}
          isFavorite={fav}
          onSubmit={onNumericSubmit ?? (() => {})}
          onClear={onNumericClear ?? (() => {})}
          onOpenDetail={() => setDetailTask(task)}
          onToggleFavorite={() => toggleFavorite(task.id)}
          dragHandle={dragHandle}
        />
      );
    }

    if (task.taskKind === "journal") {
      const slot = task.id === "journal_morning" ? "morning" : "evening";
      const entry = journals[slot] ?? null;
      const isRecorded = entry !== null;
      return (
        <div
          style={{
            display: "flex", alignItems: "stretch", gap: 0,
            background: "#FBF6EC", border: "1px solid #E6DBC4",
            borderRadius: "16px", overflow: "hidden",
            boxShadow: "0 2px 6px rgba(90,70,35,.05)", fontFamily: FONT,
          }}
        >
          <div style={{ width: "5px", flexShrink: 0, background: catColor }} />
          {dragHandle}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "11px", padding: "12px 12px 12px 13px", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flexShrink: 0 }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px", flexShrink: 0, background: catColor + "1A" }}>
                {task.icon}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(task.id); }}
                style={{ width: "26px", height: "26px", borderRadius: "50%", border: "none", padding: 0, background: fav ? "#FFF6D6" : "transparent", fontSize: "15px", cursor: "pointer", color: fav ? "#FFD24A" : "#C8BBA8", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {fav ? "★" : "☆"}
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "13.5px", lineHeight: 1.35, wordBreak: "break-word", color: isRecorded ? "#A99B85" : "#43382A", textDecoration: isRecorded ? "line-through" : "none" }}>
                {task.name}
              </p>
              {isRecorded && entry ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11.5px", color: "#5FA052", fontWeight: 700 }}>✓ 気分 {entry.mood}/10</span>
                  {entry.text && <span style={{ fontSize: "11px", color: "#A8987F" }}>{entry.text.slice(0, 24)}</span>}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "11.5px", color: "#A8987F", lineHeight: 1.3 }}>{task.description}</p>
              )}
              {!isRecorded && (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "2px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: 700, fontSize: "10.5px", borderRadius: "7px", padding: "2px 7px", color: catColor, background: catColor + "1F" }}>
                    +{task.mainXp} {catMeta.icon}{catMeta.label}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0, width: "52px", paddingTop: "2px" }}>
              <button
                onClick={() => setJournalTask(task)}
                style={{ width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: isRecorded ? `2px solid ${catColor}` : "2px solid #DBCBAF", background: isRecorded ? catColor : "#fff" }}
              >
                {isRecorded && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.4l3.2 3.2L13 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span style={{ fontSize: "9.5px", fontWeight: 700, textAlign: "center", lineHeight: 1.2, color: isRecorded ? catColor : "#B6A485" }}>
                {isRecorded ? "編集" : "記録"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Standard check task
    return (
      <div style={{ fontFamily: FONT, opacity: isBlocked ? 0.55 : 1, filter: isBlocked ? "grayscale(.4)" : undefined }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 6px rgba(90,70,35,.05)" }}>
          <div style={{ width: "5px", flexShrink: 0, background: catColor }} />
          {dragHandle}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "11px", padding: "12px 12px 12px 13px", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flexShrink: 0 }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px", flexShrink: 0, background: catColor + "1A" }}>
                {task.icon}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(task.id); }}
                style={{ width: "26px", height: "26px", borderRadius: "50%", border: "none", padding: 0, background: fav ? "#FFF6D6" : "transparent", fontSize: "15px", cursor: "pointer", color: fav ? "#FFD24A" : "#C8BBA8", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {fav ? "★" : "☆"}
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {task.frequency === "weekly" && (
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#8A6BB0", background: "#EFE7F6", borderRadius: "6px", padding: "2px 6px" }}>週次</span>
                )}
                {task.type === "avoidance" && (
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#C58A2A", background: "#FBF0D8", borderRadius: "6px", padding: "2px 6px" }}>⚠ 回避</span>
                )}
                {task.frequency === "optional" && (
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#7A9BBF", background: "#E8F0F6", borderRadius: "6px", padding: "2px 6px" }}>任意</span>
                )}
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "13.5px", lineHeight: 1.35, wordBreak: "break-word", color: checked ? "#A99B85" : "#43382A", textDecoration: checked ? "line-through" : "none" }}>
                {task.name}
              </p>
              <p style={{ margin: 0, fontSize: "11.5px", color: "#A8987F", lineHeight: 1.3 }}>{task.description}</p>
              {showCount && (
                <p style={{ margin: "1px 0 0", fontSize: "10.5px", color: "#B6A485" }}>
                  このサイクル {constraint.achievementCount}/{constraint.cycleLimit}回
                </p>
              )}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "2px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: 700, fontSize: "10.5px", borderRadius: "7px", padding: "2px 7px", whiteSpace: "nowrap", color: catColor, background: catColor + "1F" }}>
                  +{task.mainXp} {catMeta.icon}{catMeta.label}
                </span>
                {subCatMeta && task.subXp && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: 700, fontSize: "10.5px", borderRadius: "7px", padding: "2px 7px", whiteSpace: "nowrap", color: subCatColor, background: subCatColor + "1F" }}>
                    +{task.subXp} {subCatMeta.icon}{subCatMeta.label}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDetailTask(task); }}
                style={{ alignSelf: "flex-start", marginTop: "2px", fontSize: "10px", color: "#C8BBA8", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: FONT }}
              >
                ⓘ 詳細
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0, width: "52px", paddingTop: "2px" }}>
              <button
                onClick={() => {
                  if (isBlocked) { setExpandedReasonId((prev) => prev === task.id ? null : task.id); return; }
                  onToggle(task);
                }}
                disabled={pending}
                style={{ width: "30px", height: "30px", borderRadius: "50%", cursor: pending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: checked ? `2px solid ${catColor}` : "2px solid #DBCBAF", background: checked ? catColor : "#fff", opacity: pending ? 0.5 : 1 }}
              >
                {isBlocked && <span style={{ fontSize: "10px" }}>🔒</span>}
                {checked && !pending && !isBlocked && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.4l3.2 3.2L13 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {pending && (
                  <div className="w-2.5 h-2.5 border border-amber-300 border-t-transparent rounded-full animate-spin" />
                )}
              </button>
              <span style={{ fontSize: "9.5px", fontWeight: 700, textAlign: "center", lineHeight: 1.2, color: checked ? catColor : "#B6A485" }}>
                {isBlocked ? "NG" : task.type === "avoidance" ? (checked ? "回避できた" : "回避する") : "できた"}
              </span>
            </div>
          </div>
        </div>

        {isBlocked && isReasonExpanded && (
          <div style={{ marginTop: "6px", padding: "8px 13px", background: "#FBF0D8", borderRadius: "10px", border: "1px solid #E8D8A8" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#C58A2A", lineHeight: 1.4, fontFamily: FONT }}>
              🔒 {constraint.reason}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!loading && isRoutineTab && tasks.length === 0) {
    return (
      <>
        <div style={{ border: "1px dashed #DDD0B8", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center", background: "#FBF6EC", fontFamily: FONT }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>⭐</div>
          <p style={{ fontWeight: 800, fontSize: "14px", color: "#6E4A2A", margin: "0 0 6px" }}>ルーティンが空です</p>
          <p style={{ fontSize: "12px", color: "#A8987F", lineHeight: 1.5, margin: 0 }}>
            タスクの<span style={{ color: "#FFD24A" }}>★</span>を押すとここに集まります
          </p>
        </div>
        <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} />
        <JournalModal
          task={journalTask}
          slot={journalTask?.id === "journal_morning" ? "morning" : journalTask ? "evening" : null}
          existing={journalTask ? (journals[journalTask.id === "journal_morning" ? "morning" : "evening"] ?? null) : null}
          onSave={onJournalSave ?? (async () => {})}
          onDelete={onJournalDelete ?? (async () => {})}
          onClose={() => setJournalTask(null)}
        />
      </>
    );
  }

  const loadingEl = (
    <div style={{ background: "#FBF6EC", borderRadius: "16px", padding: "32px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: FONT, fontSize: "12px", color: "#B6A485", fontWeight: 700 }}>読み込み中...</p>
    </div>
  );

  const listContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
      {loading ? loadingEl : onReorder ? (
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskItem key={task.id} id={task.id}>
              {(handle) => renderTask(task, handle)}
            </SortableTaskItem>
          ))}
        </SortableContext>
      ) : (
        tasks.map((task) => (
          <React.Fragment key={task.id}>{renderTask(task, null)}</React.Fragment>
        ))
      )}
    </div>
  );

  return (
    <>
      {disabled && (
        <p style={{ textAlign: "center", fontSize: "13px", color: "#5A7A33", fontWeight: 700, margin: "0 0 8px", fontFamily: FONT }}>
          🌳 収穫できます！まず収穫ボタンを押してください
        </p>
      )}
      <div style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto" }}>
        {onReorder ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {listContent}
          </DndContext>
        ) : listContent}
      </div>

      <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} />
      <JournalModal
        task={journalTask}
        slot={journalTask?.id === "journal_morning" ? "morning" : journalTask ? "evening" : null}
        existing={journalTask ? (journals[journalTask.id === "journal_morning" ? "morning" : "evening"] ?? null) : null}
        onSave={onJournalSave ?? (async () => {})}
        onDelete={onJournalDelete ?? (async () => {})}
        onClose={() => setJournalTask(null)}
      />
    </>
  );
}

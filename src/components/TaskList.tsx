"use client";

import { useState, useMemo } from "react";
import {
  TASKS,
  CATEGORY_META,
  TYPE_META,
  type Category,
  type Task,
} from "@/data/tasks";
import {
  checkConstraint,
  getTodayString,
  type DailyLogSummary,
} from "@/lib/constraints";
import TaskDetailModal from "@/components/TaskDetailModal";
import SleepHoursInput from "@/components/SleepHoursInput";

interface Props {
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
}

export default function TaskList({
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
}: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("strength");
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

  const today = todayProp ?? getTodayString();

  const constraintMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof checkConstraint>> = {};
    for (const task of TASKS) {
      map[task.id] = checkConstraint(task, recentLogs, today, cycleStartDate);
    }
    return map;
  }, [recentLogs, today, cycleStartDate]);

  const filteredTasks = TASKS.filter((t) => t.category === activeCategory);

  return (
    <>
      <div>
        {/* Category tabs */}
        <div className="flex overflow-x-auto border border-zinc-800 bg-zinc-900 scrollbar-none">
          {(Object.entries(CATEGORY_META) as [Category, (typeof CATEGORY_META)[Category]][]).map(
            ([catId, meta]) => (
              <button
                key={catId}
                onClick={() => setActiveCategory(catId)}
                className={`flex-none px-3 py-2.5 font-mono text-xs flex items-center gap-1.5 transition-colors border-r border-zinc-800 last:border-r-0 whitespace-nowrap ${
                  activeCategory === catId
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <span className="leading-none">{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            )
          )}
        </div>

        {/* Task cards */}
        <div className="flex flex-col divide-y divide-zinc-800 border-x border-b border-zinc-800">
          {loading ? (
            <div className="bg-zinc-900 px-4 py-8 flex items-center justify-center">
              <p className="font-mono text-xs text-zinc-500 animate-pulse tracking-widest">
                LOADING...
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const checked = checkedTaskIds.has(task.id);
              const pending = pendingTaskIds.has(task.id);
              const typeMeta = TYPE_META[task.type];
              const catMeta = CATEGORY_META[task.category];
              const subCatMeta = task.subCategory
                ? CATEGORY_META[task.subCategory]
                : undefined;
              const constraint = constraintMap[task.id];
              const isBlocked = !checked && constraint?.blocked === true;
              const showCount =
                !isBlocked &&
                constraint?.achievementCount !== undefined &&
                constraint?.cycleLimit !== undefined;
              const isReasonExpanded = expandedReasonId === task.id;

              if (task.taskKind === 'numeric') {
                return (
                  <SleepHoursInput
                    key={task.id}
                    task={task}
                    currentValue={numericValues[task.id] ?? null}
                    isCompleted={checked}
                    onSubmit={onNumericSubmit ?? (() => {})}
                    onClear={onNumericClear ?? (() => {})}
                    onOpenDetail={() => setDetailTask(task)}
                  />
                );
              }

              return (
                <div
                  key={task.id}
                  className={`flex flex-col bg-zinc-900 pr-2 py-3.5 transition-colors ${
                    isBlocked ? "opacity-50 grayscale" : "hover:bg-zinc-800/60"
                  }`}
                  style={{
                    borderLeft: `4px solid ${typeMeta.borderColor}`,
                    paddingLeft: "12px",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="flex-none">
                      <span
                        className="text-2xl leading-none"
                        role="img"
                        aria-hidden
                      >
                        {task.icon}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          className={`font-mono text-sm ${
                            checked
                              ? "text-zinc-400 line-through"
                              : "text-zinc-100"
                          }`}
                        >
                          {task.name}
                        </p>
                        {task.frequency !== "daily" && (
                          <span className="font-mono text-[9px] border border-zinc-700 text-zinc-500 px-1 leading-tight whitespace-nowrap">
                            {task.frequency === "weekly" ? "週次" : "任意"}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-zinc-500 truncate mt-0.5">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className={`font-mono text-xs ${
                            checked ? "text-emerald-500" : "text-violet-400"
                          }`}
                        >
                          +{task.mainXp} {catMeta.icon}
                          {catMeta.label}
                        </span>
                        {subCatMeta && task.subXp && (
                          <>
                            <span className="font-mono text-xs text-zinc-600">
                              ·
                            </span>
                            <span
                              className={`font-mono text-xs ${
                                checked ? "text-emerald-500/70" : "text-zinc-500"
                              }`}
                            >
                              +{task.subXp} {subCatMeta.icon}
                              {subCatMeta.label}
                            </span>
                          </>
                        )}
                        {showCount && (
                          <span className="font-mono text-[10px] text-zinc-600">
                            · このサイクル {constraint.achievementCount}/{constraint.cycleLimit}回
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ⓘ button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTask(task);
                      }}
                      aria-label="詳細を見る"
                      className="flex-none w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-violet-400 transition-colors text-base"
                    >
                      ⓘ
                    </button>

                    {/* Check button */}
                    <div className="flex-none flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => {
                          if (isBlocked) {
                            setExpandedReasonId((prev) =>
                              prev === task.id ? null : task.id
                            );
                            return;
                          }
                          onToggle(task);
                        }}
                        disabled={pending}
                        aria-label={
                          isBlocked
                            ? `${task.name}: 制約あり`
                            : checked
                            ? `${task.name}を未完了にする`
                            : task.type === "avoidance"
                            ? `${task.name}: 回避できた`
                            : `${task.name}を完了にする`
                        }
                        className={`w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center ${
                          pending
                            ? "border-zinc-700 opacity-50 cursor-not-allowed"
                            : isBlocked
                            ? "border-zinc-700 cursor-pointer"
                            : checked
                            ? "border-emerald-500 bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400"
                            : task.type === "avoidance"
                            ? "border-blue-500 hover:border-blue-400 hover:bg-blue-900/30"
                            : "border-zinc-600 hover:border-violet-400"
                        }`}
                      >
                        {isBlocked && (
                          <span className="text-[10px] text-zinc-500">🔒</span>
                        )}
                        {checked && !pending && !isBlocked && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {pending && (
                          <div className="w-2.5 h-2.5 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </button>
                      <span className="font-mono text-[9px] text-zinc-600 whitespace-nowrap">
                        {isBlocked
                          ? "NG"
                          : task.type === "avoidance"
                          ? "回避できた"
                          : "できた"}
                      </span>
                    </div>
                  </div>

                  {/* Inline constraint reason (tap to expand/collapse) */}
                  {isBlocked && isReasonExpanded && (
                    <div className="mt-2 mr-1 px-3 py-2 bg-amber-950/40 border border-amber-800/50">
                      <p className="font-mono text-[11px] text-amber-300 leading-relaxed">
                        🔒 {constraint.reason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} />
    </>
  );
}

"use client";

import { useState } from "react";
import { CATEGORIES, TASKS, type CategoryId, type Task } from "@/data/tasks";

interface Props {
  checkedTaskIds: Set<string>;
  pendingTaskIds: Set<string>;
  onToggle: (task: Task) => void;
  loading?: boolean;
}

export default function TaskList({
  checkedTaskIds,
  pendingTaskIds,
  onToggle,
  loading = false,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("exercise");

  const filteredTasks = TASKS.filter((t) => t.category === activeCategory);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex overflow-x-auto border border-zinc-800 bg-zinc-900 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-none px-3 py-2.5 font-mono text-xs flex items-center gap-1.5 transition-colors border-r border-zinc-800 last:border-r-0 whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            }`}
          >
            <span className="leading-none">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
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
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 bg-zinc-900 px-4 py-3.5 hover:bg-zinc-800/60 transition-colors"
              >
                <span
                  className="text-2xl leading-none flex-none"
                  role="img"
                  aria-hidden
                >
                  {task.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-mono text-sm truncate ${
                      checked ? "text-zinc-400 line-through" : "text-zinc-100"
                    }`}
                  >
                    {task.name}
                  </p>
                  <p className="font-mono text-xs text-zinc-500 truncate mt-0.5">
                    {task.description}
                  </p>
                  <span
                    className={`inline-block mt-1.5 font-mono text-xs ${
                      checked ? "text-emerald-500" : "text-violet-400"
                    }`}
                  >
                    +{task.points}pt
                  </span>
                </div>
                <button
                  onClick={() => onToggle(task)}
                  disabled={pending}
                  aria-label={
                    checked
                      ? `${task.name}を未完了にする`
                      : `${task.name}を完了にする`
                  }
                  className={`flex-none w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center ${
                    pending
                      ? "border-zinc-700 opacity-50 cursor-not-allowed"
                      : checked
                      ? "border-emerald-500 bg-emerald-500 hover:bg-emerald-400 hover:border-emerald-400"
                      : "border-zinc-600 hover:border-violet-400"
                  }`}
                >
                  {checked && !pending && (
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

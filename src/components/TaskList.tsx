"use client";

import { useState } from "react";
import { CATEGORIES, TASKS, type CategoryId } from "@/data/tasks";

export default function TaskList() {
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
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 bg-zinc-900 px-4 py-3.5 hover:bg-zinc-800/60 transition-colors"
          >
            <span className="text-2xl leading-none flex-none" role="img" aria-hidden>
              {task.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-zinc-100 truncate">
                {task.name}
              </p>
              <p className="font-mono text-xs text-zinc-500 truncate mt-0.5">
                {task.description}
              </p>
              <span className="inline-block mt-1.5 font-mono text-xs text-violet-400">
                +{task.points}pt
              </span>
            </div>
            <button
              className="flex-none w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-violet-400 transition-colors"
              aria-label={`${task.name}を完了にする`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

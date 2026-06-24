"use client";

import { CATEGORY_META, TYPE_META, type Task } from "@/data/tasks";
import { calcSleepHoursXp, getSleepHoursLabel } from "@/lib/sleepXp";

const BUTTONS: { label: string; value: number }[] = [
  { label: '5h', value: 5.0 },
  { label: '6h', value: 6.0 },
  { label: '7h', value: 7.0 },
  { label: '8h', value: 8.0 },
  { label: '9h', value: 9.0 },
  { label: '10h+', value: 10.0 },
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
  const typeMeta = TYPE_META[task.type];
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
    <div
      className="bg-zinc-900 pr-2 py-3.5 hover:bg-zinc-800/60 transition-colors"
      style={{ borderLeft: `4px solid ${typeMeta.borderColor}`, paddingLeft: '12px' }}
    >
      <div className="flex items-start gap-3">
        {/* ★ button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          aria-label={isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
          className="flex-none w-6 h-6 flex items-center justify-center text-base leading-none transition-colors mt-0.5"
        >
          <span className={isFavorite ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400'}>
            {isFavorite ? '★' : '☆'}
          </span>
        </button>

        {/* Icon */}
        <span className="text-2xl leading-none flex-none mt-0.5" role="img" aria-hidden>
          {task.icon}
        </span>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`font-mono text-sm ${currentValue != null ? 'text-zinc-400' : 'text-zinc-100'}`}>
              {task.name}
            </p>
          </div>
          <p className="font-mono text-xs text-zinc-500 mt-0.5 truncate">
            {task.description}
          </p>

          {currentValue != null && evalLabel ? (
            /* Post-input state */
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs" style={{ color: evalLabel.color }}>
                ✓ {currentValue}h と記録 ({evalLabel.label})
              </span>
              <span className="font-mono text-xs text-emerald-500">
                +{mainXpEarned} {catMeta.icon}{catMeta.label}
                {subCatMeta && subXpEarned != null && (
                  <span className="text-emerald-500/70"> · +{subXpEarned} {subCatMeta.label}</span>
                )}
              </span>
              <button
                onClick={() => onClear(task.id)}
                className="font-mono text-[10px] text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-700 px-1.5 py-0.5 transition-colors"
              >
                取り消す
              </button>
            </div>
          ) : (
            /* Pre-input state */
            <>
              <p className="font-mono text-xs text-zinc-500 mt-1.5">昨夜の睡眠時間は?</p>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {BUTTONS.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => onSubmit(task.id, btn.value)}
                    className="font-mono text-xs border px-2 py-1 transition-colors border-zinc-600 text-zinc-400 hover:border-violet-400 hover:text-violet-300"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="font-mono text-xs text-violet-400">
                  +{task.mainXp} {catMeta.icon}{catMeta.label}
                </span>
                {subCatMeta && task.subXp && (
                  <>
                    <span className="font-mono text-xs text-zinc-600">·</span>
                    <span className="font-mono text-xs text-zinc-500">
                      +{task.subXp} {subCatMeta.icon}{subCatMeta.label}
                    </span>
                  </>
                )}
                <span className="font-mono text-xs text-zinc-600 ml-1">(7-9h で満点)</span>
              </div>
            </>
          )}
        </div>

        {/* ⓘ button */}
        <button
          onClick={onOpenDetail}
          aria-label="詳細を見る"
          className="flex-none w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-violet-400 transition-colors text-base"
        >
          ⓘ
        </button>
      </div>
    </div>
  );
}

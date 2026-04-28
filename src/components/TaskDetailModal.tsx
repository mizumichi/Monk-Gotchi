"use client";

import { useEffect } from "react";
import { CATEGORY_META, TYPE_META, type Task } from "@/data/tasks";
import { getTaskDetail } from "@/data/taskDetails";

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

const FREQUENCY_LABEL: Record<string, string> = {
  daily: '毎日',
  weekly: '週次',
  optional: '任意',
};

function Stars({ count }: { count: number }) {
  return (
    <span className="text-amber-400 tracking-wider">
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  );
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [task, onClose]);

  if (!task) return null;

  const detail = getTaskDetail(task.id);
  const typeMeta = TYPE_META[task.type];
  const catMeta = CATEGORY_META[task.category];
  const subCatMeta = task.subCategory ? CATEGORY_META[task.subCategory] : undefined;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] flex flex-col bg-zinc-900 border-t border-zinc-700 rounded-t-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={task.name}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 flex-none">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-4 pt-2 pb-3 flex-none border-b border-zinc-800">
          <span className="text-3xl leading-none mt-0.5" role="img" aria-hidden>
            {task.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-mono text-sm font-bold text-zinc-100 leading-snug">
              {task.name}
            </h2>
            <p className="font-mono text-xs text-zinc-400 mt-0.5">
              {task.description}
            </p>
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm border"
                style={{
                  color: typeMeta.borderColor,
                  borderColor: typeMeta.borderColor,
                  backgroundColor: typeMeta.bgColor,
                }}
              >
                {typeMeta.label}
              </span>
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm border"
                style={{
                  color: catMeta.color,
                  borderColor: catMeta.color + '80',
                  backgroundColor: catMeta.color + '1a',
                }}
              >
                {catMeta.icon} {catMeta.label}
              </span>
              {FREQUENCY_LABEL[task.frequency] !== '毎日' && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm border border-zinc-700 text-zinc-400">
                  {FREQUENCY_LABEL[task.frequency]}
                </span>
              )}
            </div>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="flex-none text-zinc-500 hover:text-zinc-200 transition-colors text-xl leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        {/* XP + difficulty row */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-none border-b border-zinc-800 bg-zinc-900/80">
          <div className="font-mono text-xs text-violet-400">
            💎 +{task.mainXp}&nbsp;{catMeta.label}
            {subCatMeta && task.subXp && (
              <span className="text-zinc-500">
                &nbsp;·&nbsp;+{task.subXp}&nbsp;{subCatMeta.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-zinc-500">難易度</span>
            {detail ? <Stars count={detail.difficulty} /> : <span className="text-zinc-600">—</span>}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">
          {detail ? (
            <>
              <Section title="何をするか">
                <p className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {detail.what}
                </p>
              </Section>

              <Section title="なぜ効くか">
                <p className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {detail.why}
                </p>
              </Section>

              <Section title="やり方のコツ">
                <ul className="space-y-1.5">
                  {detail.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-xs text-violet-400 flex-none mt-px">•</span>
                      <span className="font-mono text-xs text-zinc-300 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              {detail.cautions.length > 0 && (
                <Section title="注意点">
                  <ul className="space-y-1.5">
                    {detail.cautions.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-xs text-amber-500 flex-none mt-px">⚠</span>
                        <span className="font-mono text-xs text-zinc-300 leading-relaxed">{c}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="おすすめタイミング">
                <p className="font-mono text-xs text-zinc-300">{detail.bestTime}</p>
              </Section>

              <Section title="エビデンス">
                <p className="font-mono text-xs text-emerald-400 leading-relaxed">{detail.evidence}</p>
              </Section>
            </>
          ) : (
            <p className="font-mono text-xs text-zinc-500 text-center py-8">
              詳細情報の準備中です
            </p>
          )}

          {/* Bottom safe-area padding */}
          <div className="h-4" />
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

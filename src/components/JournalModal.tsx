"use client";

import { useEffect, useRef, useState } from "react";
import type { Task } from "@/data/tasks";

type Slot = 'morning' | 'evening';

interface JournalEntry {
  id: string;
  mood: number;
  text: string | null;
}

interface Props {
  task: Task | null;
  slot: Slot | null;
  existing: JournalEntry | null;
  onSave: (slot: Slot, mood: number, text: string) => Promise<void>;
  onDelete: (slot: Slot) => Promise<void>;
  onClose: () => void;
}

const MOOD_LABELS: Record<number, string> = {
  1: '最悪', 2: 'かなり悪い', 3: '悪い', 4: 'やや悪い', 5: '普通',
  6: 'まあまあ', 7: '良い', 8: 'かなり良い', 9: 'とても良い', 10: '最高',
};

const PLACEHOLDERS: Record<Slot, string> = {
  morning: '今日やること、意図、気持ちなど...',
  evening: '今日の振り返り、感謝できること、気づきなど...',
};

export default function JournalModal({ task, slot, existing, onSave, onDelete, onClose }: Props) {
  const [mood, setMood] = useState(existing?.mood ?? 7);
  const [text, setText] = useState(existing?.text ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!task) return;
    setMood(existing?.mood ?? 7);
    setText(existing?.text ?? '');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [task, existing, onClose]);

  useEffect(() => {
    if (task) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [task]);

  if (!task || !slot) return null;

  async function handleSave() {
    if (!slot) return;
    setSaving(true);
    try {
      await onSave(slot, mood, text);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!slot || !existing) return;
    setDeleting(true);
    try {
      await onDelete(slot);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const moodColor = mood >= 8 ? '#34d399' : mood >= 6 ? '#a78bfa' : mood >= 4 ? '#fbbf24' : '#f87171';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-zinc-900 border-t border-zinc-700 rounded-t-2xl w-full max-w-lg mx-auto px-5 pt-5 pb-8 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto -mt-1 mb-1" />

        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{task.icon}</span>
          <h2 className="font-mono text-sm text-zinc-100 font-bold">{task.name}</h2>
        </div>

        {/* Mood slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs text-zinc-400">気分スコア</label>
            <span className="font-mono text-sm font-bold" style={{ color: moodColor }}>
              {mood} — {MOOD_LABELS[mood]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            className="w-full accent-violet-500 h-2"
          />
          <div className="flex justify-between font-mono text-[9px] text-zinc-600">
            <span>1 最悪</span>
            <span>10 最高</span>
          </div>
        </div>

        {/* Text area */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-zinc-400">メモ (任意)</label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDERS[slot]}
            rows={4}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono text-sm px-3 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        {/* XP note */}
        <p className="font-mono text-xs text-violet-400">+{task.mainXp} 🧘精神</p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="flex-1 font-mono text-sm bg-violet-600 hover:bg-violet-500 text-white py-2.5 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : existing ? '更新する' : '記録する'}
          </button>
          {existing && (
            <button
              onClick={handleDelete}
              disabled={saving || deleting}
              className="font-mono text-sm border border-zinc-600 hover:border-red-500 text-zinc-400 hover:text-red-400 px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              {deleting ? '...' : '削除'}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="font-mono text-sm border border-zinc-700 text-zinc-500 hover:text-zinc-300 px-4 py-2.5 transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

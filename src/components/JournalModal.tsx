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

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

const MOOD_LABELS: Record<number, string> = {
  1: '最悪', 2: 'かなり悪い', 3: '悪い', 4: 'やや悪い', 5: '普通',
  6: 'まあまあ', 7: '良い', 8: 'かなり良い', 9: 'とても良い', 10: '最高',
};

const PLACEHOLDERS: Record<Slot, string> = {
  morning: '今日やること、意図、気持ちなど...',
  evening: '今日の振り返り、感謝できること、気づきなど...',
};

function moodColor(mood: number): string {
  if (mood >= 8) return '#5A7A33';
  if (mood >= 6) return '#9B6BB0';
  if (mood >= 4) return '#D6A33E';
  return '#C75B4A';
}

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

  const color = moodColor(mood);
  const disabled = saving || deleting;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", fontFamily: FONT }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 背景 */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(50,38,18,.55)" }} onClick={onClose} />

      {/* シート */}
      <div style={{ position: "relative", background: "#F3ECDD", borderTop: "1px solid #E4D9C2", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "430px", margin: "0 auto", padding: "20px 18px 36px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "85vh", overflowY: "auto" }}>

        {/* ドラッグハンドル */}
        <div style={{ width: "36px", height: "4px", background: "#D6CBBB", borderRadius: "999px", margin: "-4px auto 2px" }} />

        {/* タイトル */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>{task.icon}</span>
            <span style={{ fontWeight: 800, fontSize: "14px", color: "#6E4A2A" }}>{task.name}</span>
          </div>
          <button
            onClick={onClose}
            style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "#EAE0CC", color: "#7A6A53", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT }}
          >
            ✕
          </button>
        </div>

        {/* 気分スライダー */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#A8987F" }}>気分スコア</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: color }}>
              {mood} — {MOOD_LABELS[mood]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            style={{ width: "100%", accentColor: color, height: "6px", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#B6A485" }}>
            <span>1 最悪</span>
            <span>10 最高</span>
          </div>
        </div>

        {/* テキストエリア */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#A8987F" }}>メモ（任意）</span>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDERS[slot]}
            rows={4}
            style={{
              background: "#FBF6EC", border: "1.5px solid #E0D4BD", borderRadius: "12px",
              color: "#5C5040", fontFamily: FONT, fontSize: "13px",
              padding: "10px 12px", resize: "none", outline: "none",
              lineHeight: 1.65,
            }}
            onFocus={(e) => { e.target.style.borderColor = "#C77B4A"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E0D4BD"; }}
          />
        </div>

        {/* XPノート */}
        <p style={{ margin: 0, fontSize: "11.5px", fontWeight: 700, color: "#9B6BB0" }}>+{task.mainXp} 🧘精神</p>

        {/* アクションボタン */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSave}
            disabled={disabled}
            style={{ flex: 1, fontFamily: FONT, fontWeight: 800, fontSize: "13.5px", color: "#fff", background: "#5A9E2E", border: "none", borderRadius: "14px", padding: "12px 0", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, boxShadow: "0 4px 12px rgba(90,158,46,.3)" }}
          >
            {saving ? '保存中...' : existing ? '更新する' : '記録する'}
          </button>
          {existing && (
            <button
              onClick={handleDelete}
              disabled={disabled}
              style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: "#C75B4A", background: "#FAF0EE", border: "1.5px solid #E8C8C2", borderRadius: "14px", padding: "12px 14px", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }}
            >
              {deleting ? '...' : '削除'}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={disabled}
            style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: "#7A6A53", background: "#EDE4D1", border: "none", borderRadius: "14px", padding: "12px 14px", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

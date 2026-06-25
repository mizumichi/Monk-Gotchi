"use client";

import { useEffect } from "react";
import { CATEGORY_META, TYPE_META, type Task } from "@/data/tasks";
import { getTaskDetail } from "@/data/taskDetails";

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: '毎日',
  weekly: '週次',
  optional: '任意',
};

function Stars({ count }: { count: number }) {
  return (
    <span style={{ color: "#D6A33E", letterSpacing: "2px" }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <h3 style={{ margin: 0, fontFamily: FONT, fontSize: "9.5px", fontWeight: 800, color: "#A8987F", letterSpacing: ".12em", textTransform: "uppercase", borderBottom: "1px solid #E4D9C2", paddingBottom: "5px" }}>
        {title}
      </h3>
      {children}
    </div>
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
      {/* オーバーレイ */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(50,38,18,.55)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ボトムシート */}
      <div
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, maxHeight: "85dvh", display: "flex", flexDirection: "column", background: "#F3ECDD", borderTop: "1px solid #E4D9C2", borderRadius: "24px 24px 0 0", overflow: "hidden", fontFamily: FONT }}
        role="dialog"
        aria-modal="true"
        aria-label={task.name}
      >
        {/* ドラッグハンドル */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px", flexShrink: 0 }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "999px", background: "#D6CBBB" }} />
        </div>

        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "6px 16px 14px", flexShrink: 0, borderBottom: "1px solid #E4D9C2" }}>
          <span style={{ fontSize: "30px", lineHeight: 1, marginTop: "2px" }} role="img" aria-hidden>
            {task.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#6E4A2A", lineHeight: 1.3 }}>
              {task.name}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#A8987F", lineHeight: 1.5 }}>
              {task.description}
            </p>
            {/* バッジ */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
              <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 7px", borderRadius: "6px", border: `1px solid ${typeMeta.borderColor}`, color: typeMeta.borderColor, background: typeMeta.bgColor }}>
                {typeMeta.label}
              </span>
              <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 7px", borderRadius: "6px", border: `1px solid ${catMeta.color}55`, color: catMeta.color, background: `${catMeta.color}18` }}>
                {catMeta.icon} {catMeta.label}
              </span>
              {FREQUENCY_LABEL[task.frequency] !== '毎日' && (
                <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 7px", borderRadius: "6px", border: "1px solid #E0D4BD", color: "#A8987F", background: "#FBF6EC" }}>
                  {FREQUENCY_LABEL[task.frequency]}
                </span>
              )}
            </div>
          </div>
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            aria-label="閉じる"
            style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "#EAE0CC", color: "#7A6A53", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, marginTop: "2px" }}
          >
            ✕
          </button>
        </div>

        {/* XP・難易度バー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", flexShrink: 0, borderBottom: "1px solid #E4D9C2", background: "#F7F0E1" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#9B6BB0" }}>
            💎 +{task.mainXp} {catMeta.label}
            {subCatMeta && task.subXp && (
              <span style={{ color: "#A8987F" }}> · +{task.subXp} {subCatMeta.label}</span>
            )}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", color: "#A8987F" }}>難易度</span>
            {detail ? <Stars count={detail.difficulty} /> : <span style={{ color: "#D6CBBB" }}>—</span>}
          </div>
        </div>

        {/* スクロール本文 */}
        <div style={{ overflowY: "auto", flex: 1, padding: "18px 16px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {detail ? (
            <>
              <Section title="何をするか">
                <p style={{ margin: 0, fontSize: "12.5px", color: "#5C5040", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                  {detail.what}
                </p>
              </Section>

              <Section title="なぜ効くか">
                <p style={{ margin: 0, fontSize: "12.5px", color: "#5C5040", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                  {detail.why}
                </p>
              </Section>

              <Section title="やり方のコツ">
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {detail.tips.map((tip, i) => (
                    <li key={i} style={{ display: "flex", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#9B6BB0", flexShrink: 0, marginTop: "1px" }}>•</span>
                      <span style={{ fontSize: "12.5px", color: "#5C5040", lineHeight: 1.7 }}>{tip}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              {detail.cautions.length > 0 && (
                <Section title="注意点">
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {detail.cautions.map((c, i) => (
                      <li key={i} style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#D6A33E", flexShrink: 0, marginTop: "1px" }}>⚠</span>
                        <span style={{ fontSize: "12.5px", color: "#5C5040", lineHeight: 1.7 }}>{c}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="おすすめタイミング">
                <p style={{ margin: 0, fontSize: "12.5px", color: "#5C5040", lineHeight: 1.7 }}>{detail.bestTime}</p>
              </Section>

              <Section title="エビデンス">
                <p style={{ margin: 0, fontSize: "12px", color: "#5A7A33", lineHeight: 1.7 }}>{detail.evidence}</p>
              </Section>
            </>
          ) : (
            <p style={{ textAlign: "center", fontSize: "12px", color: "#B6A485", padding: "32px 0" }}>
              詳細情報の準備中です
            </p>
          )}
        </div>
      </div>
    </>
  );
}

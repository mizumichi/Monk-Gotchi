"use client";

import { useEffect, useRef } from "react";
import {
  TREE_CX,
  TREE_GROUND,
  TREE_CROWN_CY,
  getCrownR,
  getFruitRadius,
  getFruitCount,
  getFruitPositions,
} from "@/lib/treeCalc";

interface Props {
  totalScore: number;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

export default function TreeDisplay({ totalScore, isAnimating, onAnimationComplete }: Props) {
  const CX = TREE_CX;
  const GROUND = TREE_GROUND;
  const crownCY = TREE_CROWN_CY;
  const crownR = getCrownR(totalScore);
  const fr = getFruitRadius(crownR);
  const fruitCount = getFruitCount(totalScore);
  const fruits = getFruitPositions(crownR, fruitCount);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAnimating) return;
    // Last fruit ends at: 0.5 + (fruitCount-1)*0.09 + 0.8 seconds
    const lastDelay = fruitCount > 0 ? 0.5 + (fruitCount - 1) * 0.09 : 0.5;
    const total = Math.max(2000, (lastDelay + 0.8 + 0.15) * 1000);
    timerRef.current = setTimeout(onAnimationComplete, total);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAnimating, fruitCount, onAnimationComplete]);

  const trunkW = 14;
  const trunkTop = crownCY + crownR * 0.72;

  return (
    <svg
      viewBox="0 0 320 360"
      className="w-full max-w-[320px]"
      style={{ display: "block" }}
      aria-label="果樹"
    >
      {/* Trunk */}
      <rect
        x={CX - trunkW / 2}
        y={trunkTop}
        width={trunkW}
        height={GROUND - trunkTop}
        fill="#7C5C3A"
        rx={3}
      />
      {/* Ground */}
      <line
        x1={CX - 65}
        y1={GROUND}
        x2={CX + 65}
        y2={GROUND}
        stroke="#7C5C3A"
        strokeWidth={2}
        opacity={0.45}
      />
      {/* Crown */}
      <circle cx={CX} cy={crownCY} r={crownR} fill="#3A7D44" />

      {/* Static fruits (hidden during animation so falling ones take over) */}
      {!isAnimating &&
        fruits.map((p, i) => (
          <circle key={i} cx={p.fx} cy={p.fy} r={fr} fill="#FFD24A" opacity={0.9} />
        ))}

      {/* Harvest animation overlay */}
      {isAnimating && (
        <g>
          <defs>
            <radialGradient id="harvestGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD24A" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#FFD24A" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Glow */}
          <circle
            cx={CX}
            cy={crownCY}
            r={crownR * 1.4}
            fill="url(#harvestGlowGrad)"
            style={{
              animation: "glowPulse 0.6s ease-out both",
              transformBox: "fill-box" as React.CSSProperties["transformBox"],
              transformOrigin: "center center",
            }}
          />

          {/* Flash */}
          <rect
            x={0}
            y={0}
            width={320}
            height={360}
            fill="#ffffff"
            style={{ animation: "flashFade 0.55s ease-out both", pointerEvents: "none" }}
          />

          {/* Sparks ×3 */}
          {(
            [
              { x: CX, y: crownCY - crownR * 0.4, r: crownR * 0.5, delay: 0.08 },
              { x: CX - crownR * 0.5, y: crownCY, r: crownR * 0.4, delay: 0.16 },
              { x: CX + crownR * 0.5, y: crownCY, r: crownR * 0.4, delay: 0.22 },
            ] as const
          ).map((s, i) => (
            <g
              key={i}
              style={{
                animation: `sparkPop 0.55s ease-out ${s.delay}s both`,
                transformBox: "fill-box" as React.CSSProperties["transformBox"],
                transformOrigin: "center center",
              }}
            >
              <line
                x1={s.x}
                y1={s.y - s.r}
                x2={s.x}
                y2={s.y + s.r}
                stroke="#FFD24A"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <line
                x1={s.x - s.r}
                y1={s.y}
                x2={s.x + s.r}
                y2={s.y}
                stroke="#FFD24A"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Falling fruits */}
          {fruits.map((p, i) => {
            const drop = Math.round((GROUND - fr * 0.4) - p.fy);
            return (
              <circle
                key={i}
                cx={p.fx}
                cy={p.fy}
                r={fr}
                fill="#FFD24A"
                opacity={0.9}
                style={
                  {
                    "--drop": `${drop}px`,
                    animation: `fruitDrop 0.8s ease-in ${0.5 + i * 0.09}s both`,
                    transformBox: "fill-box",
                    transformOrigin: "center bottom",
                  } as React.CSSProperties
                }
              />
            );
          })}
        </g>
      )}
    </svg>
  );
}

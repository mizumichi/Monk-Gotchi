'use client';

import { useEffect, useRef } from "react";
import { getTreeRank } from "@/lib/evolution";

interface Props {
  score: number;
  fruitCount?: number;
  animating?: boolean;
  onAnimationComplete?: () => void;
}

const BLOBS: [number, number, number][] = [
  [0, 0, 1], [-0.55, 0.05, 0.72], [0.55, 0.05, 0.72],
  [-0.32, -0.42, 0.7], [0.32, -0.42, 0.7], [0, -0.58, 0.66],
  [-0.62, -0.28, 0.55], [0.62, -0.28, 0.55], [0.05, 0.42, 0.7],
];

const FRUIT_OFF: [number, number][] = [
  [0, -0.1], [-0.45, 0.12], [0.45, 0], [0.12, 0.4],
  [-0.25, -0.38], [0.35, -0.32], [-0.58, -0.12], [0.55, 0.28],
  [-0.1, 0.18], [0.26, 0.5], [-0.36, 0.42], [0, -0.5],
];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const CX = 160;
const GROUND = 300;
// SVG rendered size / viewBox size — used to convert SVG units → CSS px for fruitDrop
const SVG_SCALE = 225 / 360;

export default function TreeDisplay({ score, fruitCount, animating = false, onAnimationComplete }: Props) {
  const t = clamp(score / 1050, 0, 1);

  const trunkH  = lerp(38, 150, t);
  const crownR  = lerp(26, 96, t);
  const bw      = lerp(7, 15, t);
  const tw      = bw * 0.55;
  const nBlobs  = Math.round(lerp(3, 9, t));
  const fruitR  = Math.max(3, crownR * 0.085);
  const crownCY = (GROUND - trunkH) - crownR * 0.18;
  const groundRx = lerp(60, 118, t);

  const actualFruitCount = fruitCount ?? getTreeRank(score).fruitCount;

  // Call onAnimationComplete after the last fruit finishes landing
  const onCompleteRef = useRef(onAnimationComplete);
  useEffect(() => { onCompleteRef.current = onAnimationComplete; });

  useEffect(() => {
    if (!animating) return;
    const lastDelay = 0.5 + (actualFruitCount - 1) * 0.09;
    const totalMs = (lastDelay + 0.8 + 0.15) * 1000;
    const timer = setTimeout(() => onCompleteRef.current?.(), totalMs);
    return () => clearTimeout(timer);
  // actualFruitCount is stable during animation (score doesn't change until harvest completes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating]);

  const trunkPath = [
    `M ${CX - bw} ${GROUND}`,
    `Q ${(CX - bw * 0.7).toFixed(1)} ${(GROUND - trunkH * 0.5).toFixed(1)} ${(CX - tw).toFixed(1)} ${(GROUND - trunkH).toFixed(1)}`,
    `L ${(CX + tw).toFixed(1)} ${(GROUND - trunkH).toFixed(1)}`,
    `Q ${(CX + bw * 0.7).toFixed(1)} ${(GROUND - trunkH * 0.5).toFixed(1)} ${CX + bw} ${GROUND}`,
    'Z',
  ].join(' ');

  const visibleBlobs = BLOBS.slice(0, nBlobs);

  const sparkConfigs = [
    { cx: CX,                  cy: crownCY - crownR * 0.4, r: crownR * 0.5, delay: '0.08s' },
    { cx: CX - crownR * 0.5,  cy: crownCY,                r: crownR * 0.4, delay: '0.16s' },
    { cx: CX + crownR * 0.5,  cy: crownCY,                r: crownR * 0.4, delay: '0.22s' },
  ];

  return (
    <svg viewBox="0 0 320 360" width="200" height="225" aria-label="育成中の木">
      {animating && (
        <defs>
          <radialGradient id="harvestGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD24A" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFD24A" stopOpacity={0} />
          </radialGradient>
        </defs>
      )}

      {/* Ground */}
      <ellipse cx={CX} cy={GROUND + 6} rx={groundRx} ry={14} fill="#639922" />

      {/* Trunk */}
      <path d={trunkPath} fill="#7A5230" />

      {/* Leaves — back tone */}
      {visibleBlobs.map(([bx, by, br], i) => (
        <circle
          key={`bb${i}`}
          cx={CX + bx * crownR}
          cy={crownCY + by * crownR + 4}
          r={br * crownR * 0.58}
          fill="#3B6D11"
        />
      ))}

      {/* Leaves — front tone */}
      {visibleBlobs.map(([bx, by, br], i) => (
        <circle
          key={`bf${i}`}
          cx={CX + bx * crownR}
          cy={crownCY + by * crownR}
          r={br * crownR * 0.54}
          fill="#5A9E2E"
        />
      ))}

      {/* Glow (on top of leaves, behind fruits) */}
      {animating && (
        <circle
          cx={CX}
          cy={crownCY}
          r={crownR * 1.4}
          fill="url(#harvestGlow)"
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center center',
            animation: 'glowPulse 0.6s ease-out both',
          }}
        />
      )}

      {/* Fruits */}
      {FRUIT_OFF.slice(0, actualFruitCount).map(([fx, fy], i) => {
        const fxPos = CX + fx * crownR;
        const fyPos = crownCY + fy * crownR;
        const dropSvg = Math.round((GROUND - fruitR * 0.4) - fyPos);
        const dropPx = Math.round(dropSvg * SVG_SCALE);
        return (
          <circle
            key={`fr${i}`}
            cx={fxPos}
            cy={fyPos}
            r={fruitR}
            fill="#E24B4A"
            style={animating ? ({
              transformBox: 'fill-box',
              transformOrigin: 'center bottom',
              ['--drop']: `${dropPx}px`,
              animation: 'fruitDrop 0.8s ease-in both',
              animationDelay: `${0.5 + i * 0.09}s`,
            } as React.CSSProperties) : undefined}
          />
        );
      })}

      {/* Sparks */}
      {animating && sparkConfigs.map(({ cx, cy, r, delay }, i) => (
        <g
          key={`spark${i}`}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center center',
            animation: 'sparkPop 0.55s ease-out both',
            animationDelay: delay,
          }}
        >
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#FFD24A" strokeWidth={2} strokeLinecap="round" />
          <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#FFD24A" strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}

      {/* Flash (topmost layer) */}
      {animating && (
        <rect
          x={0}
          y={0}
          width={320}
          height={360}
          fill="#ffffff"
          pointerEvents="none"
          style={{ animation: 'flashFade 0.55s ease-out both' }}
        />
      )}
    </svg>
  );
}

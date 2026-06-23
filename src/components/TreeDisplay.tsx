import { getTreeRank } from "@/lib/evolution";

interface Props {
  score: number;
  fruitCount?: number;
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

export default function TreeDisplay({ score, fruitCount }: Props) {
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

  const trunkPath = [
    `M ${CX - bw} ${GROUND}`,
    `Q ${(CX - bw * 0.7).toFixed(1)} ${(GROUND - trunkH * 0.5).toFixed(1)} ${(CX - tw).toFixed(1)} ${(GROUND - trunkH).toFixed(1)}`,
    `L ${(CX + tw).toFixed(1)} ${(GROUND - trunkH).toFixed(1)}`,
    `Q ${(CX + bw * 0.7).toFixed(1)} ${(GROUND - trunkH * 0.5).toFixed(1)} ${CX + bw} ${GROUND}`,
    'Z',
  ].join(' ');

  const visibleBlobs = BLOBS.slice(0, nBlobs);

  return (
    <svg viewBox="0 0 320 360" width="200" height="225" aria-label="育成中の木">
      {/* Ground */}
      <ellipse
        cx={CX}
        cy={GROUND + 6}
        rx={groundRx}
        ry={14}
        fill="#639922"
      />

      {/* Trunk */}
      <path d={trunkPath} fill="#7A5230" />

      {/* Leaves — back tone (shifted down 4px for depth) */}
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

      {/* Fruits */}
      {FRUIT_OFF.slice(0, actualFruitCount).map(([fx, fy], i) => (
        <circle
          key={`fr${i}`}
          cx={CX + fx * crownR}
          cy={crownCY + fy * crownR}
          r={fruitR}
          fill="#E24B4A"
        />
      ))}
    </svg>
  );
}

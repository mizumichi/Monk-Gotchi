const APPLE_OFFSETS: [number, number][] = [
  [0, 0.2], [-1.1, 0.35], [1.1, 0.35], [-2.1, 0.5], [2.1, 0.5],
  [-0.6, -0.55], [0.6, -0.55], [-1.6, -0.4], [1.6, -0.4],
  [0, -1.2], [-1, -1.1], [1, -1.1],
];

const R = 6.5;
const BX = 60, BY = 78, D = 12;

function Apple({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line
        x1={x} y1={y - R + 1}
        x2={x + 3} y2={y - R - 5}
        stroke="#7A5230" strokeWidth={1.6} strokeLinecap="round"
      />
      <ellipse
        cx={x + 6} cy={y - R - 3.5}
        rx={4.2} ry={2.3}
        fill="#5A9E2E"
        transform={`rotate(-28, ${x + 6}, ${y - R - 3.5})`}
      />
      <circle cx={x} cy={y} r={R} fill="#E24B4A" />
      <ellipse
        cx={x - 2} cy={y - 2.3}
        rx={2} ry={1.3}
        fill="white" opacity={0.35}
        transform={`rotate(-30, ${x - 2}, ${y - 2.3})`}
      />
    </g>
  );
}

export default function CrateDisplay({ fruitCount }: { fruitCount: number }) {
  const count = Math.min(fruitCount, 12);
  const apples = APPLE_OFFSETS.slice(0, count).map(([ox, oy]) => ({
    x: BX + ox * D * 0.78,
    y: BY + oy * D * 0.85,
  }));

  return (
    <svg viewBox="0 0 120 120" style={{ width: '100%', height: 'auto' }} aria-label="木箱">
      {/* 1. Box inner */}
      <polygon points="24,82 96,82 106,66 34,66" fill="#5E3C20" />
      {/* 2. Back edge */}
      <line x1={34} y1={66} x2={106} y2={66} stroke="#4a2f19" strokeWidth={1.5} />
      {/* 3. Apple pile */}
      {apples.map((pos, i) => (
        <Apple key={i} x={pos.x} y={pos.y} />
      ))}
      {/* 4. Right side */}
      <polygon points="96,82 106,66 106,92 96,108" fill="#7A4E29" />
      {/* 5. Front face */}
      <polygon points="24,82 96,82 96,108 24,108" fill="#A86E3E" />
      {/* 6. Top rim */}
      <rect x={24} y={82} width={72} height={5} fill="#7A4E29" />
      {/* 7. Vertical slat joints */}
      {[48, 60, 72].map(sx => (
        <line key={sx} x1={sx} y1={88} x2={sx} y2={103} stroke="#7A4E29" strokeWidth={2} />
      ))}
      {/* 8. Bottom rim */}
      <rect x={24} y={101} width={72} height={7} fill="#7A4E29" />
      {/* 9. Left shadow */}
      <rect x={24} y={82} width={6} height={26} fill="black" opacity={0.08} />
    </svg>
  );
}

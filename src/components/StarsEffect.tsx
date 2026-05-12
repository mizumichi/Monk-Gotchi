'use client';

const STARS = [
  { x: -30, y: -20, delay: 0 },
  { x:  35, y: -25, delay: 100 },
  { x: -20, y:  15, delay: 200 },
  { x:  30, y:  10, delay: 50 },
  { x:   0, y: -40, delay: 150 },
];

export default function StarsEffect({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <style>{`
        @keyframes starPop {
          0%   { opacity: 0; transform: scale(0); }
          30%  { opacity: 1; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(0.8) translateY(-20px); }
        }
      `}</style>
      {STARS.map((star, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${star.x}px)`,
            top: `calc(50% + ${star.y}px)`,
            fontSize: 14,
            color: '#ffe066',
            animation: `starPop 0.8s ease-out ${star.delay}ms forwards`,
            display: 'inline-block',
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

'use client';

const STARS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const distance = 80 + Math.random() * 30;
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    delay: Math.random() * 100,
  };
});

type Props = {
  active: boolean;
};

export default function EvolutionBurstEffect({ active }: Props) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 11 }}>
      <style>{`
        @keyframes starBurst {
          0%   { opacity: 0; transform: translate(0, 0) scale(0.5) rotate(0deg); }
          20%  { opacity: 1; transform: translate(0, 0) scale(1.4) rotate(90deg); }
          100% { opacity: 0; transform: translate(var(--evo-dx), var(--evo-dy)) scale(0.6) rotate(360deg); }
        }
      `}</style>
      {STARS.map((star, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '54%',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#ffe066',
            textShadow: '0 0 4px #fff',
            animation: `starBurst 1.2s ease-out ${star.delay}ms forwards`,
            display: 'inline-block',
            '--evo-dx': `${star.dx}px`,
            '--evo-dy': `${star.dy}px`,
          } as React.CSSProperties}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

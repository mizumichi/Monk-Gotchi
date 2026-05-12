'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

type TimeOfDay = 'day' | 'evening' | 'night';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'evening';
  return 'night';
}

const CONFIGS = {
  day: {
    sky: 'linear-gradient(180deg, #ffd9a8 0%, #ffe9c4 30%, #c4e3b0 60%, #8fbb6a 100%)',
    ground: 'linear-gradient(180deg, #8fbb6a 0%, #6a9548 100%)',
    grassColor: '#4d7a30',
    cloudColor: '#fff',
  },
  evening: {
    sky: 'linear-gradient(180deg, #4a3470 0%, #c4538d 35%, #ff8c6b 70%, #ffb87a 100%)',
    ground: 'linear-gradient(180deg, #5a3a6a 0%, #3a2545 100%)',
    grassColor: '#3a2545',
    cloudColor: 'rgba(255, 220, 200, 0.7)',
  },
  night: {
    sky: 'linear-gradient(180deg, #0a0a2e 0%, #1a1644 50%, #2a2058 100%)',
    ground: 'linear-gradient(180deg, #2a3a44 0%, #1a2030 100%)',
    grassColor: '#1a2030',
    cloudColor: 'rgba(180, 170, 220, 0.4)',
  },
};

const GRASS_POSITIONS = [
  { left: '8%', top: 2 },
  { left: '20%', top: 4 },
  { left: '35%', top: 1 },
  { left: '50%', top: 3 },
  { left: '65%', top: 2 },
  { left: '80%', top: 5 },
];

const STAR_POSITIONS = [
  { top: '5%', left: '10%' },
  { top: '14%', left: '32%' },
  { top: '7%', left: '52%' },
  { top: '18%', left: '72%' },
  { top: '11%', left: '88%' },
];

function Cloud({ style, color }: { style: CSSProperties; color: string }) {
  return (
    <div className="absolute" style={style}>
      <div style={{ position: 'relative', width: 50, height: 16, backgroundColor: color, borderRadius: 8 }}>
        <div style={{ position: 'absolute', top: -10, left: 8, width: 20, height: 20, backgroundColor: color, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: -7, left: 24, width: 16, height: 16, backgroundColor: color, borderRadius: '50%' }} />
      </div>
    </div>
  );
}

function DaySun() {
  return (
    <div
      className="absolute"
      style={{
        top: '8%',
        right: '10%',
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: '#ffe066',
        boxShadow: '0 0 12px 4px rgba(255, 220, 100, 0.6)',
      }}
    />
  );
}

function EveningSun() {
  return (
    <div
      className="absolute"
      style={{
        bottom: '38%',
        right: '12%',
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #fff5b8 0%, #ffd06a 50%, transparent 70%)',
      }}
    />
  );
}

function NightMoon() {
  return (
    <>
      <div
        className="absolute"
        style={{
          top: '8%',
          right: '10%',
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundColor: '#fff8e0',
          boxShadow: 'inset -8px 0 0 0 rgba(20, 20, 40, 0.9)',
        }}
      />
      {STAR_POSITIONS.map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: pos.top,
            left: pos.left,
            width: 2,
            height: 2,
            borderRadius: '50%',
            backgroundColor: 'white',
          }}
        />
      ))}
    </>
  );
}

export default function StageBackground() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  useEffect(() => {
    setTimeOfDay(getTimeOfDay());
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const config = CONFIGS[timeOfDay];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0" style={{ background: config.sky }} />

      {/* Celestial body */}
      {timeOfDay === 'day' && <DaySun />}
      {timeOfDay === 'evening' && <EveningSun />}
      {timeOfDay === 'night' && <NightMoon />}

      {/* Clouds */}
      <Cloud style={{ top: '10%', left: '12%' }} color={config.cloudColor} />
      <Cloud style={{ top: '22%', right: '18%', transform: 'scale(0.7)' }} color={config.cloudColor} />

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '28%', background: config.ground }}
      >
        {GRASS_POSITIONS.map((pos, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: 3,
              height: 6,
              backgroundColor: config.grassColor,
              left: pos.left,
              top: pos.top,
            }}
          />
        ))}
      </div>
    </div>
  );
}

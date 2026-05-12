'use client';

import { useEffect, useState } from 'react';
import { PixelSprite, type SpriteFrame } from './sprite-utils';

const COLOR_MAP: Record<string, string> = {
  W: '#3a2a1a',
  H: '#fdf6e3',
  E: '#1a1a1a',
  m: '#e8a09a',
  B: '#2a1810',
  N: '#7a4a2a',
  '.': 'transparent',
};

const FRAME_OPEN: SpriteFrame = [
  '........................',
  '........................',
  '........................',
  '........................',
  '..........WWWW..........',
  '........WWHHHHWW........',
  '.......WHHHHHHHHW.......',
  '......WHHHHHHHHHHW......',
  '.....WHHHHHHHHHHHHW.....',
  '.....WHHHHHHHHHHHHW.....',
  '....WHHHHHHHHHHHHHHW....',
  '....WHHHEEHHHHEEHHHW....',
  '....WHHHEEHHHHEEHHHW....',
  '....WHHHHHHHHHHHHHHW....',
  '....WHHHHHHmmHHHHHHW....',
  '.....WHHHHHHHHHHHHW.....',
  '.....WHHHHHHHHHHHHW.....',
  '......WHHHHHHHHHHW......',
  '.......WHHHHHHHHW.......',
  '........WWWWWWWW........',
  '......BBBBBBBBBBBB......',
  '.....BNNBBNNNBBNNBN.....',
  '....BNNNBNNNNBNNNNBB....',
  '....BBNBBBNBBBBBNBBB....',
];

const FRAME_BLINK: SpriteFrame = [
  '........................',
  '........................',
  '........................',
  '........................',
  '..........WWWW..........',
  '........WWHHHHWW........',
  '.......WHHHHHHHHW.......',
  '......WHHHHHHHHHHW......',
  '.....WHHHHHHHHHHHHW.....',
  '.....WHHHHHHHHHHHHW.....',
  '....WHHHHHHHHHHHHHHW....',
  '....WHHHHHHHHHHHHHHW....',
  '....WHHEEEEHHEEEEHHW....',
  '....WHHHHHHHHHHHHHHW....',
  '....WHHHHHHmmHHHHHHW....',
  '.....WHHHHHHHHHHHHW.....',
  '.....WHHHHHHHHHHHHW.....',
  '......WHHHHHHHHHHW......',
  '.......WHHHHHHHHW.......',
  '........WWWWWWWW........',
  '......BBBBBBBBBBBB......',
  '.....BNNBBNNNBBNNBN.....',
  '....BNNNBNNNNBNNNNBB....',
  '....BBNBBBNBBBBBNBBB....',
];

export default function MonkEgg() {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
      timeout = setTimeout(blink, 2500 + Math.random() * 2500);
    };
    timeout = setTimeout(blink, 2000 + Math.random() * 2000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <style>{`
        @keyframes monkEggFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      <div
        role="img"
        aria-label="モンクの卵"
        style={{ animation: 'monkEggFloat 2.4s ease-in-out infinite' }}
      >
        <PixelSprite
          frame={blinking ? FRAME_BLINK : FRAME_OPEN}
          pixelSize={4}
          colorMap={COLOR_MAP}
        />
      </div>
    </>
  );
}

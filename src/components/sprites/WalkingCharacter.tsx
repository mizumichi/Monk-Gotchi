'use client';

import { useEffect, useRef, useState } from 'react';
import { PixelSprite } from './sprite-utils';
import type { SpriteData } from './sprite-data';

type Props = {
  data: SpriteData;
  stageWidth: number;
  bouncing?: boolean;
};

export default function WalkingCharacter({ data, stageWidth, bouncing }: Props) {
  const [posX, setPosX] = useState(10);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [frameToggle, setFrameToggle] = useState<0 | 1>(0);
  const [blinking, setBlinking] = useState(false);

  // Refs to read current values inside setInterval without stale closures
  const frameToggleRef = useRef<0 | 1>(0);
  const directionRef = useRef<1 | -1>(1);

  // Walking animation
  useEffect(() => {
    const charWidth = data.grid.w * data.pixelSize;
    const MIN_X = 10;
    const MAX_X = stageWidth - charWidth - 10;

    const interval = setInterval(() => {
      // Toggle frame and update ref
      const newFrame: 0 | 1 = frameToggleRef.current === 0 ? 1 : 0;
      frameToggleRef.current = newFrame;
      setFrameToggle(newFrame);

      // moveOnBFrame=false: only move when switching to walkA (newFrame=0)
      const shouldMove = data.animation.moveOnBFrame || newFrame === 0;
      if (!shouldMove) return;

      setPosX(prevX => {
        const next = prevX + directionRef.current * data.animation.moveSpeed;
        if (next >= MAX_X) {
          directionRef.current = -1;
          setDirection(-1);
          return MAX_X;
        }
        if (next <= MIN_X) {
          directionRef.current = 1;
          setDirection(1);
          return MIN_X;
        }
        return next;
      });
    }, data.animation.frameInterval);

    return () => clearInterval(interval);
  }, [data, stageWidth]);

  // Blinking animation
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), data.animation.blinkDuration);
      timeout = setTimeout(
        blink,
        data.animation.blinkIntervalMin +
          Math.random() * (data.animation.blinkIntervalMax - data.animation.blinkIntervalMin),
      );
    };
    timeout = setTimeout(blink, 2000 + Math.random() * 2000);
    return () => clearTimeout(timeout);
  }, [data]);

  const currentFrame = blinking
    ? data.frames.blink
    : frameToggle === 0
      ? data.frames.walkA
      : data.frames.walkB;

  return (
    // Outer div: absolute position on stage + bounce animation
    <div
      style={{
        position: 'absolute',
        bottom: '28%',
        left: posX,
        animation: bouncing
          ? 'monkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          : 'none',
      }}
    >
      {/* Inner div: horizontal flip for walking direction */}
      <div
        style={{
          transform: direction === -1 ? 'scaleX(-1)' : 'none',
          transformOrigin: 'center',
        }}
      >
        <PixelSprite
          frame={currentFrame}
          pixelSize={data.pixelSize}
          colorMap={data.colors}
        />
      </div>
    </div>
  );
}

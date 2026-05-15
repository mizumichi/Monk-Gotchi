'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import EvolutionBurstEffect from './EvolutionBurstEffect';
import type { EvolutionEvent } from '@/hooks/useEvolutionDetector';

export type EvolutionPhase = 'idle' | 'flash' | 'shrink' | 'appear' | 'done';

type Props = {
  event: EvolutionEvent | null;
  onPhaseChange?: (phase: EvolutionPhase) => void;
  onComplete: () => void;
};

export default function EvolutionEffect({ event, onPhaseChange, onComplete }: Props) {
  const [phase, setPhase] = useState<EvolutionPhase>('idle');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setPhaseAndNotify = useCallback((p: EvolutionPhase) => {
    setPhase(p);
    onPhaseChange?.(p);
  }, [onPhaseChange]);

  useEffect(() => {
    if (event === null) {
      setPhaseAndNotify('idle');
      return;
    }

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setPhaseAndNotify('flash');
    timersRef.current.push(setTimeout(() => setPhaseAndNotify('shrink'), 800));
    timersRef.current.push(setTimeout(() => setPhaseAndNotify('appear'), 1400));
    timersRef.current.push(setTimeout(() => {
      setPhaseAndNotify('done');
      onComplete();
    }, 2200));

    return () => timersRef.current.forEach(clearTimeout);
  }, [event, setPhaseAndNotify, onComplete]);

  return (
    <>
      {phase === 'flash' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#ffffff',
            animation: 'evoFlash 0.8s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}
      <EvolutionBurstEffect active={phase === 'appear'} />
    </>
  );
}

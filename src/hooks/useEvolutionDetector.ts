'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterCode } from '@/components/CharacterSprite';

export type EvolutionEvent = {
  fromCode: CharacterCode;
  toCode: CharacterCode;
  timestamp: number;
};

export function useEvolutionDetector(
  currentCode: CharacterCode,
  isReady: boolean,
): {
  evolutionEvent: EvolutionEvent | null;
  clearEvolution: () => void;
} {
  const [evolutionEvent, setEvolutionEvent] = useState<EvolutionEvent | null>(null);
  const prevCodeRef = useRef<CharacterCode | null>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    if (!isReady) {
      // Track code during loading without firing events
      prevCodeRef.current = currentCode;
      return;
    }
    if (!isReadyRef.current) {
      // First frame after load: record initial code, don't fire
      isReadyRef.current = true;
      prevCodeRef.current = currentCode;
      return;
    }
    if (prevCodeRef.current !== null && prevCodeRef.current !== currentCode) {
      setEvolutionEvent({
        fromCode: prevCodeRef.current,
        toCode: currentCode,
        timestamp: Date.now(),
      });
    }
    prevCodeRef.current = currentCode;
  }, [currentCode, isReady]);

  const clearEvolution = useCallback(() => setEvolutionEvent(null), []);

  return { evolutionEvent, clearEvolution };
}

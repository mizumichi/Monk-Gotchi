import { useCallback, useRef, useState } from 'react';

type AnimationState = {
  bouncing: boolean;
  effectTrigger: number;
};

export function useCharacterAnimation() {
  const [state, setState] = useState<AnimationState>({
    bouncing: false,
    effectTrigger: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReaction = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(prev => ({
      bouncing: true,
      effectTrigger: prev.effectTrigger + 1,
    }));
    timerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, bouncing: false }));
    }, 500);
  }, []);

  return { ...state, triggerReaction };
}

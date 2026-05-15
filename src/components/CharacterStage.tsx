'use client';

import { useEffect, useRef, useState } from 'react';
import StageBackground from './StageBackground';
import CharacterSprite, { type CharacterCode } from './CharacterSprite';
import StarsEffect from './StarsEffect';
import EvolutionEffect, { type EvolutionPhase } from './EvolutionEffect';
import { useEvolutionDetector } from '@/hooks/useEvolutionDetector';
import type { Stage } from '@/lib/date';

function determineCharacterCode(
  stage: Stage,
  midType: string | null | undefined,
  finalType: string | null | undefined,
): CharacterCode {
  if (stage === 'egg') return 'Monk-Egg';
  if (stage === 'early') return 'Monk-Baby';
  if (stage === 'mid') {
    if (midType === 'Daraku-Monk') return 'Daraku-Monk';
    return 'Monk-Baby';
  }
  if (stage === 'final') {
    if (finalType === 'Slothchi-King') return 'Slothchi-King';
    return 'Daraku-Monk';
  }
  return 'Monk-Egg';
}

type Props = {
  bouncing: boolean;
  effectTrigger: number;
  stage: Stage;
  midType: string | null | undefined;
  finalType: string | null | undefined;
  isLoading?: boolean;
};

export default function CharacterStage({ bouncing, effectTrigger, stage, midType, finalType, isLoading = false }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(380);
  const [evolutionPhase, setEvolutionPhase] = useState<EvolutionPhase>('idle');

  useEffect(() => {
    const update = () => {
      if (stageRef.current) {
        setStageWidth(stageRef.current.clientWidth);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const currentCode = determineCharacterCode(stage, midType, finalType);
  const { evolutionEvent, clearEvolution } = useEvolutionDetector(currentCode, !isLoading);

  // During flash/shrink, show the old character; otherwise show current
  const displayedCode: CharacterCode =
    evolutionPhase === 'flash' || evolutionPhase === 'shrink'
      ? (evolutionEvent?.fromCode ?? currentCode)
      : currentCode;

  const isEvolving = evolutionPhase !== 'idle' && evolutionPhase !== 'done';

  // Walking character evolution class (applied to wrapper, targets WalkingCharacter outer div via > *)
  const walkEvoClass =
    evolutionPhase === 'shrink' ? 'evo-shrink'
    : evolutionPhase === 'appear' ? 'evo-appear'
    : '';

  // MonkEgg evolution animation (applied directly to bounce wrapper)
  const eggEvoAnimation =
    evolutionPhase === 'shrink'
      ? 'evoShrink 0.6s ease-in forwards'
      : evolutionPhase === 'appear'
      ? 'evoAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      : bouncing && !isEvolving
      ? 'monkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      : 'none';

  return (
    <div
      ref={stageRef}
      className="sticky z-10 w-full overflow-hidden"
      style={{ top: 44, height: '33vh' }}
    >
      <style>{`
        @keyframes monkBounce {
          0%   { transform: scaleY(1)    scaleX(1)    translateY(0); }
          20%  { transform: scaleY(0.7)  scaleX(1.2)  translateY(0); }
          50%  { transform: scaleY(1.15) scaleX(0.9)  translateY(-8px); }
          80%  { transform: scaleY(1)    scaleX(1)    translateY(0); }
          100% { transform: scaleY(1)    scaleX(1)    translateY(0); }
        }
        @keyframes evoShrink {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes evoAppear {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          80%  { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes evoFlash {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .evo-shrink > * { animation: evoShrink 0.6s ease-in forwards !important; }
        .evo-appear > * { animation: evoAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important; }
      `}</style>
      <StageBackground />
      {displayedCode === 'Monk-Egg' ? (
        /* Egg: centered fixed position + inline evolution animation */
        <div
          className="absolute left-1/2"
          style={{ bottom: '30%', transform: 'translateX(-50%)' }}
        >
          <div style={{ animation: eggEvoAnimation }}>
            <CharacterSprite code="Monk-Egg" stageWidth={stageWidth} />
          </div>
          <StarsEffect key={effectTrigger} trigger={effectTrigger} />
        </div>
      ) : (
        /* Walking characters: self-positioning via absolute, CSS class targets outer div */
        <>
          <div className={walkEvoClass}>
            <CharacterSprite
              code={displayedCode}
              bouncing={!isEvolving && bouncing}
              stageWidth={stageWidth}
            />
          </div>
          <div
            className="absolute left-1/2"
            style={{ bottom: '30%', transform: 'translateX(-50%)' }}
          >
            <StarsEffect key={effectTrigger} trigger={effectTrigger} />
          </div>
        </>
      )}
      <EvolutionEffect
        event={evolutionEvent}
        onPhaseChange={setEvolutionPhase}
        onComplete={clearEvolution}
      />
      {/* Block interactions during evolution */}
      {isEvolving && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'wait',
            pointerEvents: 'all',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}

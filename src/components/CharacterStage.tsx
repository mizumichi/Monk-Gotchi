'use client';

import { useEffect, useRef, useState } from 'react';
import StageBackground from './StageBackground';
import CharacterSprite, { type CharacterCode } from './CharacterSprite';
import StarsEffect from './StarsEffect';
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
};

export default function CharacterStage({ bouncing, effectTrigger, stage, midType, finalType }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(380);

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

  const characterCode = determineCharacterCode(stage, midType, finalType);

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
      `}</style>
      <StageBackground />
      {characterCode === 'Monk-Egg' ? (
        /* E-1/E-2 の卵: 中央固定 + bounce ラッパー + stars */
        <div
          className="absolute left-1/2"
          style={{ bottom: '30%', transform: 'translateX(-50%)' }}
        >
          <div
            style={{
              animation: bouncing
                ? 'monkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                : 'none',
            }}
          >
            <CharacterSprite code="Monk-Egg" stageWidth={stageWidth} />
          </div>
          {/* Stars positioned relative to the 96×96 character area */}
          <StarsEffect key={effectTrigger} trigger={effectTrigger} />
        </div>
      ) : (
        /* 歩行キャラ: WalkingCharacter が position:absolute で自己配置 */
        <>
          <CharacterSprite
            code={characterCode}
            bouncing={bouncing}
            stageWidth={stageWidth}
          />
          <div
            className="absolute left-1/2"
            style={{ bottom: '30%', transform: 'translateX(-50%)' }}
          >
            <StarsEffect key={effectTrigger} trigger={effectTrigger} />
          </div>
        </>
      )}
    </div>
  );
}

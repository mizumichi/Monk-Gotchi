'use client';

import StageBackground from './StageBackground';
import CharacterSprite from './CharacterSprite';
import StarsEffect from './StarsEffect';

type Props = {
  bouncing: boolean;
  effectTrigger: number;
};

export default function CharacterStage({ bouncing, effectTrigger }: Props) {
  return (
    <div
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
      {/* Character positioned above the ground zone (bottom 28%) */}
      <div
        className="absolute left-1/2"
        style={{ bottom: '30%', transform: 'translateX(-50%)' }}
      >
        {/* Bounce layer: wraps sprite so it doesn't conflict with float in MonkEgg */}
        <div
          style={{
            animation: bouncing
              ? 'monkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'none',
          }}
        >
          <CharacterSprite code="Monk-Egg" />
        </div>
        {/* Stars positioned relative to the 96×96 character area */}
        <StarsEffect key={effectTrigger} trigger={effectTrigger} />
      </div>
    </div>
  );
}

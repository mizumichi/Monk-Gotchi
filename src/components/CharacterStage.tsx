'use client';

import StageBackground from './StageBackground';
import CharacterSprite from './CharacterSprite';

export default function CharacterStage() {
  return (
    <div
      className="sticky z-10 w-full overflow-hidden"
      style={{ top: 44, height: '33vh' }}
    >
      <StageBackground />
      {/* Character positioned above the ground zone (bottom 28%) */}
      <div
        className="absolute left-1/2"
        style={{ bottom: '30%', transform: 'translateX(-50%)' }}
      >
        <CharacterSprite code="Monk-Egg" />
      </div>
    </div>
  );
}

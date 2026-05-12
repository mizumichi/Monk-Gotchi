'use client';

import MonkEgg from './sprites/MonkEgg';

type CharacterCode = 'Monk-Egg';

function FallbackSprite() {
  return (
    <div
      style={{
        width: 96,
        height: 96,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        color: '#666',
      }}
    >
      ?
    </div>
  );
}

export default function CharacterSprite({ code }: { code: CharacterCode }) {
  if (code === 'Monk-Egg') return <MonkEgg />;
  return <FallbackSprite />;
}

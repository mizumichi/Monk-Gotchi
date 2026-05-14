'use client';

import MonkEgg from './sprites/MonkEgg';
import WalkingCharacter from './sprites/WalkingCharacter';
import { MONK_BABY, DARAKU_MONK, SLOTHCHI_KING } from './sprites/sprite-data';

export type CharacterCode = 'Monk-Egg' | 'Monk-Baby' | 'Daraku-Monk' | 'Slothchi-King';

type Props = {
  code: CharacterCode;
  bouncing?: boolean;
  stageWidth: number;
};

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

export default function CharacterSprite({ code, bouncing, stageWidth }: Props) {
  switch (code) {
    case 'Monk-Egg':
      return <MonkEgg />;
    case 'Monk-Baby':
      return <WalkingCharacter data={MONK_BABY} stageWidth={stageWidth} bouncing={bouncing} />;
    case 'Daraku-Monk':
      return <WalkingCharacter data={DARAKU_MONK} stageWidth={stageWidth} bouncing={bouncing} />;
    case 'Slothchi-King':
      return <WalkingCharacter data={SLOTHCHI_KING} stageWidth={stageWidth} bouncing={bouncing} />;
    default:
      return <FallbackSprite />;
  }
}

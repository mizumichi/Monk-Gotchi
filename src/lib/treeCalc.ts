export const TREE_CX = 160;
export const TREE_GROUND = 300;
export const TREE_CROWN_CY = 175;

const MAX_SCORE = 640;
const MAX_CROWN_R = 75;
const MIN_CROWN_R = 35;
const MAX_FRUITS = 8;
const SCORE_PER_FRUIT = 80;

// Angles from 12 o'clock, clockwise, in degrees
const FRUIT_ANGLES_DEG = [-70, -42, -14, 14, 42, 70, -100, 98];

export function getCrownR(totalScore: number): number {
  const t = Math.min(1, totalScore / MAX_SCORE);
  return MIN_CROWN_R + t * (MAX_CROWN_R - MIN_CROWN_R);
}

export function getFruitRadius(crownR: number): number {
  return Math.max(3, crownR * 0.085);
}

export function getFruitCount(totalScore: number): number {
  return Math.min(MAX_FRUITS, Math.floor(totalScore / SCORE_PER_FRUIT));
}

export interface FruitPos {
  fx: number;
  fy: number;
}

export function getFruitPositions(crownR: number, count: number): FruitPos[] {
  return FRUIT_ANGLES_DEG.slice(0, count).map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      fx: TREE_CX + crownR * Math.sin(rad),
      fy: TREE_CROWN_CY - crownR * Math.cos(rad),
    };
  });
}

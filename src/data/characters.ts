export type CharacterStage = 'egg' | 'baby' | 'mid' | 'final';
export type CharacterTier = 'legendary' | 'standard' | 'humorous' | 'progress';

export type CharacterCode =
  // egg
  | 'Monk-Egg'
  // baby
  | 'Monk-Baby'
  // mid
  | 'Wakaki-Monk' | 'Heibon-Monk' | 'Daraku-Monk'
  // final legendary
  | 'Sage-Monk' | 'Overlord-Monk' | 'Hermit-Monk' | 'Wise-Monk' | 'Zen-Master' | 'Sun-Sage'
  // final standard
  | 'Guardian' | 'Warrior' | 'Ascetic' | 'Scholar' | 'Dreamer' | 'Walker' | 'Average-San'
  // final humorous
  | 'Burnout-Monk' | 'Otaku-Monk' | 'Insomnia-Warrior' | 'Debuchi-Monk' | 'Slothchi-King';

export interface CharacterMaster {
  code: CharacterCode;
  nameJp: string;
  stage: CharacterStage;
  tier: CharacterTier;
  emoji: string;
  description: string;
  conditionText: string;
}

export const CHARACTERS: CharacterMaster[] = [
  // ── 卵 ──────────────────────────────────────────────────────────
  {
    code: 'Monk-Egg',
    nameJp: 'モンクの卵',
    stage: 'egg',
    tier: 'progress',
    emoji: '🥚',
    description: 'サイクル初日。これから何が生まれるかは、君次第。',
    conditionText: '進行段階(Day 1)',
  },
  // ── ヒナ ─────────────────────────────────────────────────────────
  {
    code: 'Monk-Baby',
    nameJp: 'モンクのヒナ',
    stage: 'baby',
    tier: 'progress',
    emoji: '🐣',
    description: '卵から孵ったばかりのヒナモンク。Day 2-4 でその姿を保つ。',
    conditionText: '進行段階(Day 2-4)',
  },
  // ── 中期 ─────────────────────────────────────────────────────────
  {
    code: 'Wakaki-Monk',
    nameJp: '若き僧',
    stage: 'mid',
    tier: 'progress',
    emoji: '🧒',
    description: 'Day 4 までを真面目にこなした若き修行僧。最終形態への期待が膨らむ。',
    conditionText: '進行段階(Day 5-7、好調プレイヤー)',
  },
  {
    code: 'Heibon-Monk',
    nameJp: '平凡僧',
    stage: 'mid',
    tier: 'progress',
    emoji: '🙂',
    description: 'Day 4 までを平均的にこなした凡庸な修行僧。Day 5 以降の頑張り次第で何にでもなれる。',
    conditionText: '進行段階(Day 5-7、平均プレイヤー)',
  },
  {
    code: 'Daraku-Monk',
    nameJp: '堕落僧',
    stage: 'mid',
    tier: 'progress',
    emoji: '😪',
    description: 'Day 4 までで堕落の兆しを見せた修行僧。今からでも挽回は可能。',
    conditionText: '進行段階(Day 5-7、不調プレイヤー)',
  },
  // ── 最終 Legendary ───────────────────────────────────────────────
  {
    code: 'Sage-Monk',
    nameJp: '聖僧',
    stage: 'final',
    tier: 'legendary',
    emoji: '🧘‍♂️',
    description: '五道を究めた大聖僧。バランスの頂点。',
    conditionText: '全カテゴリ65%以上、サボり0日、完璧日4日以上',
  },
  {
    code: 'Overlord-Monk',
    nameJp: '覇王',
    stage: 'final',
    tier: 'legendary',
    emoji: '💪',
    description: '筋肉と覇気の化身。スクワットを愛す者。',
    conditionText: '筋トレ80%以上、他軸45%以上、サボり0日、完璧日4日以上',
  },
  {
    code: 'Hermit-Monk',
    nameJp: '仙人',
    stage: 'final',
    tier: 'legendary',
    emoji: '🌿',
    description: '食と節制の達人。タンパク質で語る。',
    conditionText: '栄養80%以上、他軸45%以上、サボり0日、完璧日4日以上',
  },
  {
    code: 'Wise-Monk',
    nameJp: '賢者',
    stage: 'final',
    tier: 'legendary',
    emoji: '📖',
    description: '瞑想と知性の最高峰。深い洞察を持つ。',
    conditionText: '精神80%以上、他軸45%以上、サボり0日、完璧日4日以上',
  },
  {
    code: 'Zen-Master',
    nameJp: '禅師',
    stage: 'final',
    tier: 'legendary',
    emoji: '😴',
    description: '睡眠と休息の達人。深眠の境地。',
    conditionText: '睡眠80%以上、他軸45%以上、サボり0日、完璧日4日以上',
  },
  {
    code: 'Sun-Sage',
    nameJp: '陽聖',
    stage: 'final',
    tier: 'legendary',
    emoji: '☀️',
    description: '日光と環境の聖人。朝の光と共に生きる。',
    conditionText: '環境80%以上、他軸45%以上、サボり0日、完璧日4日以上',
  },
  // ── 最終 Standard ────────────────────────────────────────────────
  {
    code: 'Guardian',
    nameJp: '守護者',
    stage: 'final',
    tier: 'standard',
    emoji: '🛡️',
    description: 'バランス重視。突出はないが満遍なくこなす守護者。',
    conditionText: '平均40%以上 / 全軸25%以上 / サボり3日以下',
  },
  {
    code: 'Warrior',
    nameJp: '戦士',
    stage: 'final',
    tier: 'standard',
    emoji: '⚔️',
    description: '並の筋トレ特化。覇王には届かないが頑張る戦士。',
    conditionText: '筋トレ60%以上(伝説未達)',
  },
  {
    code: 'Ascetic',
    nameJp: '行者',
    stage: 'final',
    tier: 'standard',
    emoji: '🍵',
    description: '並の食事特化。仙人を目指す修行中の行者。',
    conditionText: '栄養60%以上(伝説未達)',
  },
  {
    code: 'Scholar',
    nameJp: '学者',
    stage: 'final',
    tier: 'standard',
    emoji: '📚',
    description: '並の精神特化。賢者へ続く道半ばの学者。',
    conditionText: '精神60%以上(伝説未達)',
  },
  {
    code: 'Dreamer',
    nameJp: '眠師',
    stage: 'final',
    tier: 'standard',
    emoji: '💤',
    description: '並の睡眠特化。禅師の見習いの眠師。',
    conditionText: '睡眠60%以上(伝説未達)',
  },
  {
    code: 'Walker',
    nameJp: '歩者',
    stage: 'final',
    tier: 'standard',
    emoji: '🚶',
    description: '並の環境特化。陽聖の追随者の歩者。',
    conditionText: '環境60%以上(伝説未達)',
  },
  {
    code: 'Average-San',
    nameJp: '普通おじさん',
    stage: 'final',
    tier: 'standard',
    emoji: '🧔',
    description: '中庸の人。とりあえずやる感じの普通おじさん。',
    conditionText: '平均30%以上で他条件すべて外れた場合',
  },
  // ── 最終 Humorous ────────────────────────────────────────────────
  {
    code: 'Burnout-Monk',
    nameJp: '燃え尽き僧',
    stage: 'final',
    tier: 'humorous',
    emoji: '🔥',
    description: '筋トレ偏重で他全部おろそかにした燃え尽き僧。',
    conditionText: '筋トレ45%以上、最低軸が10%未満',
  },
  {
    code: 'Otaku-Monk',
    nameJp: 'オタクモンク',
    stage: 'final',
    tier: 'humorous',
    emoji: '🎮',
    description: '瞑想だけはする生活崩壊型のオタクモンク。',
    conditionText: '精神45%以上、最低軸が10%未満',
  },
  {
    code: 'Insomnia-Warrior',
    nameJp: '不眠戦士',
    stage: 'final',
    tier: 'humorous',
    emoji: '🌙',
    description: '夜更かし筋トレで睡眠が崩壊した不眠戦士。',
    conditionText: '筋トレ30%以上、睡眠20%未満',
  },
  {
    code: 'Debuchi-Monk',
    nameJp: 'デブチモンク',
    stage: 'final',
    tier: 'humorous',
    emoji: '🍔',
    description: '食べるけど動かない、慢性的な怠け者。',
    conditionText: '栄養40%以上、筋トレ15%未満',
  },
  {
    code: 'Slothchi-King',
    nameJp: '怠惰王',
    stage: 'final',
    tier: 'humorous',
    emoji: '🦥',
    description: '何もしない人のデフォルト形態。怠惰の王。',
    conditionText: '上記いずれにも該当しない',
  },
];

export function getCharacterByCode(code: string): CharacterMaster | undefined {
  return CHARACTERS.find((c) => c.code === code);
}

export function getFinalCharacters(): CharacterMaster[] {
  return CHARACTERS.filter((c) => c.stage === 'final');
}

// evolution.ts が旧コードをDBに書き込むため、旧コード→新CharacterCode のブリッジ(D-3 で不要になる)
export const LEGACY_CODE_MAP: Record<string, CharacterCode> = {
  egg:       'Monk-Egg',
  early:     'Monk-Baby',
  excellent: 'Wakaki-Monk',
  normal:    'Heibon-Monk',
  lazy:      'Daraku-Monk',
  sage:      'Sage-Monk',
  overlord:  'Overlord-Monk',
  hermit:    'Hermit-Monk',
  wise:      'Wise-Monk',
  guardian:  'Guardian',
  warrior:   'Warrior',
  average:   'Average-San',
  slothking: 'Slothchi-King',
};

export function resolveCharacterCode(code: string | null | undefined): CharacterCode {
  if (!code) return 'Monk-Egg';
  if (code in LEGACY_CODE_MAP) return LEGACY_CODE_MAP[code];
  const found = CHARACTERS.find((c) => c.code === code);
  if (found) return found.code;
  return 'Monk-Egg';
}

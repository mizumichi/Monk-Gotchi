export const CHARACTERS = {
  // 卵・初期・中期
  egg:       { name: "たまご",        emoji: "🥚",  desc: "まだ何者でもない" },
  early:     { name: "ヒナちゃん",     emoji: "🐣",  desc: "生まれたばかり" },
  excellent: { name: "ヒヨコモンク優",  emoji: "🐤",  desc: "順調に育っている" },
  normal:    { name: "ヒヨコモンク並",  emoji: "🐥",  desc: "普通に育っている" },
  lazy:      { name: "ヒヨコモンク怠",  emoji: "😪",  desc: "サボり気味" },
  // 最終形態
  sage:      { name: "聖僧",           emoji: "🧘",  desc: "全てを極めた者" },
  overlord:  { name: "覇王",           emoji: "💪",  desc: "筋肉の頂点" },
  hermit:    { name: "仙人",           emoji: "🌿",  desc: "節制の達人" },
  wise:      { name: "賢者",           emoji: "📚",  desc: "知性の極み" },
  guardian:  { name: "守護者",         emoji: "🛡️",  desc: "バランスの取れた者" },
  warrior:   { name: "戦士",           emoji: "⚔️",  desc: "鍛えし者" },
  average:   { name: "普通おじさん",    emoji: "🧔",  desc: "ごく普通の人" },
  slothking: { name: "怠惰王",         emoji: "😴",  desc: "サボりの王" },
} as const;

export type CharacterId = keyof typeof CHARACTERS;

// 図鑑に記録する最終形態8種 (表示順固定)
export const FINAL_CHARACTER_IDS = [
  "sage",
  "overlord",
  "hermit",
  "wise",
  "guardian",
  "warrior",
  "average",
  "slothking",
] as const satisfies CharacterId[];

export const CATEGORIES = [
  { id: "exercise", name: "筋トレ", icon: "🏋️" },
  { id: "sleep",    name: "睡眠",   icon: "🌙" },
  { id: "nutrition",name: "栄養",   icon: "🥩" },
  { id: "sunlight", name: "日光",   icon: "☀️" },
  { id: "mental",   name: "精神",   icon: "🧘" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export interface Task {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  points: number;
  icon: string;
}

export const TASKS = [
  // exercise
  {
    id: "squat-30",
    category: "exercise",
    name: "スクワット30回",
    description: "下半身を鍛える基本種目",
    points: 30,
    icon: "🦵",
  },
  {
    id: "pushup-20",
    category: "exercise",
    name: "腕立て伏せ20回",
    description: "胸・肩・腕を一度に鍛える",
    points: 30,
    icon: "💪",
  },
  {
    id: "run-20min",
    category: "exercise",
    name: "20分ジョギング",
    description: "有酸素運動で脂肪を燃焼",
    points: 60,
    icon: "🏃",
  },
  // sleep
  {
    id: "sleep-7h",
    category: "sleep",
    name: "7時間以上睡眠",
    description: "回復に必要な睡眠時間を確保",
    points: 60,
    icon: "😴",
  },
  {
    id: "sleep-midnight",
    category: "sleep",
    name: "0時前に就寝",
    description: "体内時計を整える",
    points: 40,
    icon: "🌙",
  },
  {
    id: "no-phone-1h",
    category: "sleep",
    name: "就寝1時間前スマホなし",
    description: "ブルーライトを避けて眠りを深く",
    points: 40,
    icon: "📵",
  },
  // nutrition
  {
    id: "protein",
    category: "nutrition",
    name: "タンパク質を十分に摂る",
    description: "体重×1.5g のタンパク質を目標に",
    points: 50,
    icon: "🥩",
  },
  {
    id: "vegetables-3",
    category: "nutrition",
    name: "野菜を3品目食べる",
    description: "ビタミン・ミネラルを補給",
    points: 40,
    icon: "🥗",
  },
  {
    id: "no-junk",
    category: "nutrition",
    name: "ジャンクフードを食べない",
    description: "加工食品・砂糖を控える",
    points: 50,
    icon: "🚫",
  },
  // sunlight
  {
    id: "morning-sun",
    category: "sunlight",
    name: "朝日を浴びる",
    description: "起床後30分以内に日光を浴びる",
    points: 50,
    icon: "🌅",
  },
  {
    id: "walk-15min",
    category: "sunlight",
    name: "屋外を15分歩く",
    description: "ビタミンD生成を促進",
    points: 40,
    icon: "🌿",
  },
  // mental
  {
    id: "meditation-5min",
    category: "mental",
    name: "5分間瞑想",
    description: "呼吸に集中してストレスを解放",
    points: 50,
    icon: "🧘",
  },
  {
    id: "journal",
    category: "mental",
    name: "日記を書く",
    description: "今日の気づきを3行書く",
    points: 30,
    icon: "📝",
  },
  {
    id: "gratitude",
    category: "mental",
    name: "感謝を3つ書き出す",
    description: "ポジティブな視点を育てる",
    points: 40,
    icon: "🙏",
  },
] satisfies Task[];

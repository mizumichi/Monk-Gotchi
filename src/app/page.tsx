import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <div className="text-8xl">🥚</div>
        <h1 className="text-4xl font-bold text-orange-900 tracking-tight">
          Monk-Gotchi
        </h1>
        <p className="text-lg text-orange-700 max-w-sm leading-relaxed">
          毎日の健康習慣でキャラクターを育てよう
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {["💪 筋トレ", "😴 睡眠", "🥗 栄養", "☀️ 日光", "🧘 精神"].map(
            (label) => (
              <span
                key={label}
                className="px-4 py-2 bg-white/70 rounded-full text-sm font-medium text-orange-800 shadow-sm"
              >
                {label}
              </span>
            )
          )}
        </div>
        <Link
          href="/login"
          className="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-md transition-colors"
        >
          ログイン / 新規登録
        </Link>
      </main>
    </div>
  );
}

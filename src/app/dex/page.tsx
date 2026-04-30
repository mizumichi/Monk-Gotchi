"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFinalCharacters, LEGACY_CODE_MAP } from "@/data/characters";
import { client } from "@/lib/amplifyClient";
import type { Schema } from "../../../amplify/data/resource";

type DexEntry = Schema["CharacterDex"]["type"];

const TIER_ORDER = { legendary: 0, standard: 1, humorous: 2, progress: 3 } as const;

const FINAL_CHARS = getFinalCharacters().sort(
  (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
);

const TIER_LABELS: Record<string, string> = {
  legendary: '✨ 伝説',
  standard:  '⚔️ 通常',
  humorous:  '😂 コミカル',
};

export default function DexPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  const [dexEntries, setDexEntries] = useState<DexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    async function load() {
      setLoading(true);
      try {
        const { data } = await client.models.CharacterDex.list();
        setDexEntries(data ?? []);
      } catch (err) {
        console.error("CharacterDex fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authStatus]);

  const obtainedCodes = new Set(
    dexEntries.map((e) => LEGACY_CODE_MAP[e.characterType ?? ''] ?? e.characterType)
  );
  const obtainedCount = FINAL_CHARS.filter((c) => obtainedCodes.has(c.code)).length;

  // tier ごとにグループ化
  const tiers = ['legendary', 'standard', 'humorous'] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="font-mono font-bold text-violet-400 tracking-widest text-sm">
          📖 モンク図鑑
        </span>
        <Link
          href="/dashboard"
          className="font-mono text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 transition-colors"
        >
          ホーム
        </Link>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        <p className="font-mono text-xs text-zinc-500 tracking-widest">
          {obtainedCount} / {FINAL_CHARS.length} 種 入手済み
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="font-mono text-xs text-zinc-500 animate-pulse tracking-widest">
              LOADING...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {tiers.map((tier) => {
              const chars = FINAL_CHARS.filter((c) => c.tier === tier);
              return (
                <section key={tier}>
                  <p className="font-mono text-[10px] text-zinc-500 tracking-widest mb-2 border-b border-zinc-800 pb-1">
                    {TIER_LABELS[tier]}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {chars.map((char) => {
                      const obtained = obtainedCodes.has(char.code);
                      const entry = dexEntries.find(
                        (e) =>
                          e.characterType === char.code ||
                          LEGACY_CODE_MAP[e.characterType ?? ''] === char.code
                      );
                      return (
                        <div
                          key={char.code}
                          title={obtained ? char.conditionText : char.conditionText}
                          className={`border flex flex-col items-center gap-1 p-3 transition-colors ${
                            obtained
                              ? "border-violet-700 bg-zinc-900"
                              : "border-zinc-800 bg-zinc-900/30 opacity-40"
                          }`}
                        >
                          <span
                            className="text-3xl leading-none select-none"
                            role="img"
                            aria-label={obtained ? char.nameJp : "未入手"}
                          >
                            {obtained ? char.emoji : "❓"}
                          </span>
                          <p className="font-mono text-[10px] text-zinc-100 text-center leading-snug">
                            {obtained ? char.nameJp : "???"}
                          </p>
                          {obtained && entry ? (
                            <p className="font-mono text-[9px] text-violet-400 tracking-wide">
                              ×{entry.obtainedCount}
                            </p>
                          ) : (
                            <p className="font-mono text-[9px] text-zinc-600 text-center leading-tight">
                              ー
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {obtainedCount === FINAL_CHARS.length && (
          <p className="font-mono text-xs text-violet-400 text-center tracking-widest border border-violet-800 py-2">
            🎉 全種コンプリート！
          </p>
        )}
      </main>
    </div>
  );
}

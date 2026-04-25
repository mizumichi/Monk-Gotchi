"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CHARACTERS, FINAL_CHARACTER_IDS } from "@/data/characters";
import { client } from "@/lib/amplifyClient";
import type { Schema } from "../../../amplify/data/resource";

type DexEntry = Schema["CharacterDex"]["type"];

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

  const obtainedCount = dexEntries.length;

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
      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">
        <p className="font-mono text-xs text-zinc-500 tracking-widest">
          {obtainedCount} / {FINAL_CHARACTER_IDS.length} 種 入手済み
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="font-mono text-xs text-zinc-500 animate-pulse tracking-widest">
              LOADING...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FINAL_CHARACTER_IDS.map((id) => {
              const char = CHARACTERS[id];
              const entry = dexEntries.find((e) => e.characterType === id);
              return (
                <div
                  key={id}
                  className={`border flex flex-col items-center gap-1.5 p-4 transition-colors ${
                    entry
                      ? "border-violet-700 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-900/30 opacity-40"
                  }`}
                >
                  <span
                    className="text-4xl leading-none select-none"
                    role="img"
                    aria-label={entry ? char.name : "未入手"}
                  >
                    {entry ? char.emoji : "❓"}
                  </span>
                  <p className="font-mono text-xs text-zinc-100 text-center leading-snug">
                    {entry ? char.name : "???"}
                  </p>
                  {entry ? (
                    <p className="font-mono text-[10px] text-violet-400 tracking-wide">
                      ×{entry.obtainedCount}
                    </p>
                  ) : (
                    <p className="font-mono text-[10px] text-zinc-600 tracking-wide">
                      ー
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {obtainedCount === FINAL_CHARACTER_IDS.length && (
          <p className="font-mono text-xs text-violet-400 text-center tracking-widest border border-violet-800 py-2">
            🎉 全種コンプリート！
          </p>
        )}
      </main>
    </div>
  );
}

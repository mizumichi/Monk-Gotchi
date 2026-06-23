"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { client } from "@/lib/amplifyClient";
import type { Schema } from "../../../amplify/data/resource";

type HarvestEntry = Schema["Harvest"]["type"];

const RANK_LABELS: Record<string, string> = {
  low:  'いまいち',
  mid:  '普通',
  high: 'だいぶ良い',
};

const RANK_COLORS: Record<string, string> = {
  low:  'text-zinc-400',
  mid:  'text-violet-300',
  high: 'text-emerald-400',
};

export default function OrchardPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  const [harvests, setHarvests] = useState<HarvestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    async function load() {
      setLoading(true);
      try {
        const { data } = await client.models.Harvest.list();
        setHarvests(
          (data ?? []).sort((a, b) =>
            (b.harvestedAt ?? '').localeCompare(a.harvestedAt ?? '')
          )
        );
      } catch (err) {
        console.error("Harvest fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authStatus]);

  const totalFruits = harvests.reduce((sum, h) => sum + (h.fruitCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="font-mono font-bold text-violet-400 tracking-widest text-sm">
          🌳 果樹園
        </span>
        <Link
          href="/dashboard"
          className="font-mono text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 transition-colors"
        >
          ホーム
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Total fruits */}
        <div className="flex flex-col items-center gap-1 py-6 border border-zinc-800 bg-zinc-900">
          <p className="font-mono text-[10px] text-zinc-500 tracking-widest">合計実数</p>
          <p className="font-mono text-6xl font-bold text-emerald-400">{totalFruits}</p>
          <p className="font-mono text-sm text-zinc-400 mt-1">🍎 個</p>
        </div>

        {/* Harvest history */}
        <section>
          <p className="font-mono text-[10px] text-zinc-500 tracking-widest mb-2 border-b border-zinc-800 pb-1">
            収穫履歴
          </p>
          {loading ? (
            <p className="font-mono text-xs text-zinc-500 animate-pulse py-6 text-center tracking-widest">
              LOADING...
            </p>
          ) : harvests.length === 0 ? (
            <p className="font-mono text-xs text-zinc-600 py-6 text-center">
              まだ収穫がありません
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {harvests.map((h) => {
                const rank = (h.rank ?? 'low') as keyof typeof RANK_LABELS;
                const startDate = h.cycleStartDate ?? '';
                const endDate = h.harvestedAt?.slice(0, 10) ?? '';
                return (
                  <div
                    key={h.id}
                    className="border border-zinc-800 bg-zinc-900 px-3 py-2.5 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="font-mono text-[10px] text-zinc-500">
                        {startDate} 〜 {endDate}
                      </p>
                      <p className={`font-mono text-xs ${RANK_COLORS[rank] ?? 'text-zinc-400'}`}>
                        {RANK_LABELS[rank] ?? rank}
                      </p>
                      <p className="font-mono text-[10px] text-zinc-600">
                        累計 {h.totalScore ?? 0}pt
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-lg font-bold text-zinc-200">
                        {h.fruitCount}
                      </span>
                      <span className="text-lg">🍎</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

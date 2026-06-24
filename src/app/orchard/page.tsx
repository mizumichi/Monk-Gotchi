"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { client } from "@/lib/amplifyClient";
import CrateDisplay from "@/components/CrateDisplay";
import type { Schema } from "../../../amplify/data/resource";

type HarvestEntry = Schema["Harvest"]["type"];

function formatHarvestedAt(iso: string): string {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`;
}

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
        {/* Summary */}
        <div className="flex gap-6 justify-center py-4 border border-zinc-800 bg-zinc-900">
          <div className="text-center">
            <p className="font-mono text-[10px] text-zinc-500 tracking-widest">果樹園の実</p>
            <p className="font-mono text-3xl font-bold text-emerald-400">{totalFruits}</p>
            <p className="font-mono text-[10px] text-zinc-400">個</p>
          </div>
          <div className="w-px bg-zinc-800" />
          <div className="text-center">
            <p className="font-mono text-[10px] text-zinc-500 tracking-widest">収穫回数</p>
            <p className="font-mono text-3xl font-bold text-violet-400">{harvests.length}</p>
            <p className="font-mono text-[10px] text-zinc-400">回</p>
          </div>
        </div>

        {/* Card grid */}
        {loading ? (
          <p className="font-mono text-xs text-zinc-500 animate-pulse py-6 text-center tracking-widest">
            LOADING...
          </p>
        ) : harvests.length === 0 ? (
          <p className="font-mono text-xs text-zinc-600 py-6 text-center">
            まだ収穫がありません
          </p>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
          >
            {harvests.map((h) => (
              <div
                key={h.id}
                className="border border-zinc-800 bg-zinc-900 p-2 flex flex-col items-center"
              >
                <CrateDisplay fruitCount={h.fruitCount ?? 0} />
                <p className="font-mono text-xs text-zinc-200 mt-1">
                  {formatHarvestedAt(h.harvestedAt ?? '')}
                </p>
                <p className="font-mono text-[10px] text-zinc-500">
                  {h.totalScore ?? 0} pt
                </p>
                <p className="font-mono text-[10px] text-zinc-400">
                  🍎 {h.fruitCount} 個
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

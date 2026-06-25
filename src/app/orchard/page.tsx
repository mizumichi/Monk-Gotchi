"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { client } from "@/lib/amplifyClient";
import CrateDisplay from "@/components/CrateDisplay";
import type { Schema } from "../../../amplify/data/resource";

type HarvestEntry = Schema["Harvest"]["type"];

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

const RANK_LABEL: Record<string, string> = {
  low: "いまいち",
  mid: "普通",
  high: "だいぶ良い",
};

const RANK_COLOR: Record<string, string> = {
  low: "#C07A6A",
  mid: "#C58A2A",
  high: "#5A7A33",
};

function formatHarvestedAt(iso: string): string {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${jst.getUTCFullYear()}/${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`;
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
            (b.harvestedAt ?? "").localeCompare(a.harvestedAt ?? "")
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
    <div style={{ minHeight: "100vh", background: "#E7DECB", fontFamily: FONT }}>
      <div style={{ width: "390px", maxWidth: "100%", minHeight: "100vh", margin: "0 auto", background: "#F3ECDD", boxShadow: "0 0 60px rgba(80,60,30,.15)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 12px", background: "#F3ECDD", borderBottom: "1px solid #E4D9C2" }}>
          <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: ".08em", color: "#6E4A2A" }}>🧺 果樹園</span>
          <Link
            href="/dashboard"
            style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: FONT, fontWeight: 700, fontSize: "11.5px", color: "#5A7A33", background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "999px", padding: "6px 12px", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            ← ダッシュボードへ
          </Link>
        </header>

        <main style={{ flex: 1, padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Summary */}
          <div style={{ display: "flex", gap: "0", background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 14px rgba(90,70,35,.08)" }}>
            <div style={{ flex: 1, padding: "18px 16px", textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, color: "#A8987F", letterSpacing: ".06em" }}>果樹園の実</p>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 800, color: "#5A9E2E", lineHeight: 1 }}>{totalFruits}</p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#A8987F" }}>個</p>
            </div>
            <div style={{ width: "1px", background: "#E6DBC4", margin: "14px 0" }} />
            <div style={{ flex: 1, padding: "18px 16px", textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: "10.5px", fontWeight: 700, color: "#A8987F", letterSpacing: ".06em" }}>収穫回数</p>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 800, color: "#C77B4A", lineHeight: 1 }}>{harvests.length}</p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#A8987F" }}>回</p>
            </div>
          </div>

          {/* Card grid */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#B6A485" }}>読み込み中...</p>
            </div>
          ) : harvests.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🧺</div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#6E4A2A" }}>まだ収穫がありません</p>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#A8987F" }}>7日間頑張ったら最初の実がなります</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {harvests.map((h) => (
                <div
                  key={h.id}
                  style={{ background: "#FBF6EC", border: "1px solid #E6DBC4", borderRadius: "18px", padding: "12px 12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(90,70,35,.06)" }}
                >
                  <CrateDisplay fruitCount={h.fruitCount ?? 0} />
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#43382A" }}>
                    {formatHarvestedAt(h.harvestedAt ?? "")}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: RANK_COLOR[h.rank ?? "mid"] ?? "#A8987F" }}>
                    {RANK_LABEL[h.rank ?? "mid"] ?? h.rank}
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "10.5px", color: "#A8987F" }}>{h.totalScore ?? 0}pt</span>
                    <span style={{ fontSize: "10.5px", color: "#5A9E2E", fontWeight: 700 }}>🍎 {h.fruitCount}個</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

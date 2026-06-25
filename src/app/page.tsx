import Link from "next/link";

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

function TreeIcon() {
  return (
    <svg width="80" height="90" viewBox="0 0 220 206" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="190" rx="84" ry="18" fill="#000" opacity="0.07"/>
      <ellipse cx="110" cy="184" rx="80" ry="20" fill="#4F7D1C"/>
      <ellipse cx="110" cy="178" rx="80" ry="18" fill="#639922"/>
      <path d="M101 180 Q99 148 105 122 L116 122 Q121 150 119 180 Z" fill="#7A5230"/>
      <path d="M105 122 Q103 150 105 180 L101 180 Q99 148 105 122 Z" fill="#653F22"/>
      <ellipse cx="98" cy="92" rx="56" ry="48" fill="#3B6D11"/>
      <ellipse cx="148" cy="108" rx="38" ry="34" fill="#3B6D11"/>
      <ellipse cx="70" cy="112" rx="33" ry="30" fill="#3B6D11"/>
      <ellipse cx="104" cy="98" rx="48" ry="42" fill="#5A9E2E"/>
      <ellipse cx="140" cy="112" rx="30" ry="26" fill="#5A9E2E"/>
      <ellipse cx="76" cy="116" rx="27" ry="24" fill="#5A9E2E"/>
      <ellipse cx="90" cy="80" rx="20" ry="15" fill="#6FB83A" opacity="0.85"/>
      <ellipse cx="128" cy="96" rx="13" ry="10" fill="#6FB83A" opacity="0.7"/>
      <circle cx="86" cy="124" r="7" fill="#E24B4A"/>
      <circle cx="128" cy="128" r="7" fill="#E24B4A"/>
      <circle cx="110" cy="110" r="6" fill="#E24B4A"/>
    </svg>
  );
}

const HABITS = ["💪 筋トレ", "😴 睡眠", "🥗 栄養", "☀️ 日光", "🧘 精神"];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#E7DECB", fontFamily: FONT }}>
      <div style={{ width: "390px", maxWidth: "100%", minHeight: "100vh", margin: "0 auto", background: "#F3ECDD", boxShadow: "0 0 60px rgba(80,60,30,.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", boxSizing: "border-box" }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "36px" }}>
          <div style={{ background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "24px", width: "96px", height: "96px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(90,154,46,.15)" }}>
            <TreeIcon />
          </div>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: "26px", letterSpacing: ".08em", color: "#6E4A2A" }}>HI-T-TREE</h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#A8987F", fontWeight: 500 }}>健康習慣を木として育てよう</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "36px" }}>
          {HABITS.map((label) => (
            <span
              key={label}
              style={{ padding: "8px 16px", background: "#EBF1DC", border: "1px solid #CFE0AE", borderRadius: "999px", fontSize: "13px", fontWeight: 600, color: "#4A6629" }}
            >
              {label}
            </span>
          ))}
        </div>

        <Link
          href="/login"
          style={{ display: "block", width: "100%", maxWidth: "280px", padding: "14px 0", background: "#5A7A33", color: "#fff", fontWeight: 800, fontSize: "15px", borderRadius: "14px", textAlign: "center", textDecoration: "none", boxShadow: "0 4px 16px rgba(90,122,51,.25)", letterSpacing: ".04em" }}
        >
          ログイン / 新規登録
        </Link>
      </div>
    </div>
  );
}

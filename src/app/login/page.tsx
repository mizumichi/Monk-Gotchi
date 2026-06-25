"use client";

import { Authenticator, translations } from "@aws-amplify/ui-react";
import { I18n } from "aws-amplify/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "@aws-amplify/ui-react/styles.css";
import type { AuthUser } from "aws-amplify/auth";

I18n.putVocabularies(translations);
I18n.setLanguage("ja");

const FONT = "'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif";

function RedirectAfterLogin({ user }: { user: AuthUser | undefined }) {
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);
  return null;
}

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

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#E7DECB", fontFamily: FONT }}>
      <div style={{ width: "390px", maxWidth: "100%", minHeight: "100vh", margin: "0 auto", background: "#F3ECDD", boxShadow: "0 0 60px rgba(80,60,30,.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", overflowX: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px", gap: "10px" }}>
          <div style={{ background: "#EBF1DC", border: "1.5px solid #CFE0AE", borderRadius: "24px", width: "96px", height: "96px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(90,154,46,.15)" }}>
            <TreeIcon />
          </div>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: "22px", letterSpacing: ".08em", color: "#6E4A2A" }}>HI-T-TREE</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#A8987F", fontWeight: 500 }}>健康習慣を木として育てよう</p>
        </div>

        <style>{`
          [data-amplify-authenticator] {
            width: 100%;
            max-width: 100%;
            --amplify-components-authenticator-router-width: 100%;
            --amplify-components-authenticator-container-width-max: 100%;
            --amplify-colors-background-primary: #F3ECDD;
            --amplify-colors-background-secondary: #FBF6EC;
            --amplify-colors-border-primary: #E0D4BD;
            --amplify-colors-border-secondary: #E6DBC4;
            --amplify-colors-font-primary: #43382A;
            --amplify-colors-font-secondary: #7A6A53;
            --amplify-colors-font-interactive: #5A7A33;
            --amplify-colors-brand-primary-10: #EBF1DC;
            --amplify-colors-brand-primary-80: #5A7A33;
            --amplify-colors-brand-primary-90: #4A6629;
            --amplify-colors-brand-primary-100: #3A5220;
            --amplify-components-button-primary-background-color: #5A7A33;
            --amplify-components-button-primary-hover-background-color: #4A6629;
            --amplify-components-authenticator-router-border-color: #E6DBC4;
            --amplify-components-authenticator-router-background-color: #FBF6EC;
            --amplify-components-authenticator-max-width: 100%;
            font-family: 'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif;
          }
          [data-amplify-authenticator] * {
            box-sizing: border-box;
          }
          [data-amplify-authenticator] [data-amplify-container] {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          [data-amplify-authenticator] [data-amplify-router] {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            border-radius: 20px;
            border: 1px solid #E6DBC4;
            box-shadow: 0 4px 20px rgba(90,70,35,.08);
            background: #FBF6EC;
            box-sizing: border-box !important;
            overflow: hidden;
          }
          [data-amplify-authenticator] [data-amplify-form] {
            padding: 20px 20px 16px !important;
            box-sizing: border-box !important;
          }
          [data-amplify-authenticator] [data-amplify-footer] {
            padding: 0 20px 20px !important;
            box-sizing: border-box !important;
          }
          [data-amplify-authenticator] .amplify-flex,
          [data-amplify-authenticator] .amplify-field,
          [data-amplify-authenticator] .amplify-field-group {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          [data-amplify-authenticator] .amplify-field-group__outer-end {
            flex-shrink: 0;
          }
          [data-amplify-authenticator] input {
            width: 100% !important;
            min-width: 0 !important;
            border-radius: 10px !important;
            border-color: #E0D4BD !important;
            background: #fff !important;
            font-family: 'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif !important;
            box-sizing: border-box !important;
          }
          [data-amplify-authenticator] button[type="submit"] {
            border-radius: 12px !important;
            font-weight: 800 !important;
            font-family: 'M PLUS Rounded 1c', 'Noto Sans JP', system-ui, sans-serif !important;
          }
        `}</style>

        <div style={{ width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
          <Authenticator loginMechanisms={["email"]}>
            {({ user }) => <RedirectAfterLogin user={user} />}
          </Authenticator>
        </div>
      </div>
    </div>
  );
}

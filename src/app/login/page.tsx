"use client";

import { Authenticator, translations } from "@aws-amplify/ui-react";
import { I18n } from "aws-amplify/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "@aws-amplify/ui-react/styles.css";
import type { AuthUser } from "aws-amplify/auth";

I18n.putVocabularies(translations);
I18n.setLanguage("ja");

function RedirectAfterLogin({ user }: { user: AuthUser | undefined }) {
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return null;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 px-4">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🥚</div>
        <h1 className="text-2xl font-bold text-orange-900">Monk-Gotchi</h1>
      </div>
      <Authenticator loginMechanisms={["email"]}>
        {({ user }) => <RedirectAfterLogin user={user} />}
      </Authenticator>
    </div>
  );
}

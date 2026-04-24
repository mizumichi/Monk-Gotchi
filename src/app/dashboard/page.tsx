"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import CharacterDisplay from "@/components/CharacterDisplay";
import ScoreBars from "@/components/ScoreBars";
import TaskList from "@/components/TaskList";

export default function DashboardPage() {
  const { signOut, authStatus } = useAuthenticator((context) => [
    context.authStatus,
  ]);
  const router = useRouter();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="font-mono text-zinc-500 tracking-widest text-sm animate-pulse">
          LOADING...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="font-mono font-bold text-violet-400 tracking-widest text-sm">
          MONK-GOTCHI
        </span>
        <button
          onClick={signOut}
          className="font-mono text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 transition-colors"
        >
          サインアウト
        </button>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Character + Score */}
        <div className="flex flex-col sm:flex-row gap-3">
          <CharacterDisplay />
          <ScoreBars />
        </div>

        {/* Task list */}
        <TaskList />
      </main>
    </div>
  );
}

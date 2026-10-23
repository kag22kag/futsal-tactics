"use client";

import { useState } from "react";
import IntroSplash from "@/components/IntroSplash";
import TacticalBoard from "@/components/board/TacticalBoard";
import { AccountProvider } from "@/context/AccountContext";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <main className="app-shell flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {showIntro ? (
        <IntroSplash onComplete={() => setShowIntro(false)} />
      ) : (
        <AccountProvider><TacticalBoard /></AccountProvider>
      )}
    </main>
  );
}

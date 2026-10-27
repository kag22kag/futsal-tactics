"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IntroSplash from "@/components/IntroSplash";
import TacticalBoard from "@/components/board/TacticalBoard";
import { AccountProvider } from "@/context/AccountContext";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const focusRequested = useRef(false);
  const fullscreenRequested = useRef(false);

  const exitFocusMode = useCallback(() => {
    focusRequested.current = false;
    fullscreenRequested.current = false;
    setIsFocusMode(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  // The browser may handle Esc itself; fullscreenchange keeps the UI in sync.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && focusRequested.current) exitFocusMode();
    }

    function onFullscreenChange() {
      if (!document.fullscreenElement && fullscreenRequested.current) {
        exitFocusMode();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [exitFocusMode]);

  async function enterFocusMode() {
    focusRequested.current = true;
    setIsFocusMode(true);

    // Focus layout still works when the browser does not offer Fullscreen API.
    if (!document.documentElement.requestFullscreen) return;

    fullscreenRequested.current = true;
    try {
      // Call during the button click so the browser accepts the user gesture.
      await document.documentElement.requestFullscreen();
      if (!focusRequested.current && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      fullscreenRequested.current = false;
    }
  }

  return (
    <main className="app-shell flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      {showIntro ? (
        <IntroSplash onComplete={() => setShowIntro(false)} />
      ) : (
        <AccountProvider>
          <TacticalBoard
            isFocusMode={isFocusMode}
            onEnterFocus={enterFocusMode}
            onExitFocus={exitFocusMode}
          />
        </AccountProvider>
      )}
    </main>
  );
}

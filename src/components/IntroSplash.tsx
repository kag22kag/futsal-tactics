"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CircleDot, Goal } from "lucide-react";

const STORAGE_KEY = "hasSeenIntro";
const INTRO_DURATION_MS = 2500;
const FADE_DURATION_MS = 350;

type Phase = "checking" | "playing" | "leaving";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [ready, setReady] = useState(false);
  const startedHere = useRef(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    let seen = false;

    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "true";
      if (!seen) sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Intro vẫn hoạt động nếu trình duyệt chặn sessionStorage.
    }

    if (seen && !startedHere.current) {
      finish();
      return;
    }

    // Giữ thời gian Intro ổn định khi React Strict Mode chạy effect hai lần.
    startedHere.current = true;
    setPhase("playing");

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setReady(true));
    });
    const timeout = window.setTimeout(
      () => setPhase("leaving"),
      INTRO_DURATION_MS,
    );

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      clearTimeout(timeout);
    };
  }, [finish]);

  useEffect(() => {
    if (phase !== "leaving") return;

    // Dự phòng khi hiệu ứng chuyển cảnh không phát.
    const timeout = window.setTimeout(finish, FADE_DURATION_MS + 50);
    return () => clearTimeout(timeout);
  }, [phase, finish]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-slate-950 px-5 text-center text-slate-100 transition-opacity ease-out motion-reduce:transition-none ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && phase === "leaving") {
          finish();
        }
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(110,231,183,0.3)_1px,transparent_1px)] [background-size:28px_28px]"
      />

      <div className="relative flex w-full max-w-lg flex-col items-center">
        <div
          aria-hidden="true"
          className={`relative mb-10 grid size-24 place-items-center rounded-[28px] border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-transform duration-700 ease-out motion-safe:animate-pulse motion-reduce:transition-none sm:size-28 ${
            ready ? "rotate-0 scale-110" : "-rotate-12 scale-75"
          }`}
        >
          <Goal size={58} strokeWidth={1.5} />
          <CircleDot
            className="absolute -right-3 -bottom-3 rounded-full bg-slate-950 text-white"
            size={30}
            strokeWidth={2}
          />
        </div>

        <div
          className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
            ready ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <p className="mb-3 text-[11px] font-semibold tracking-[0.35em] text-emerald-400">
            DESIGN THE GAME
          </p>
          <h2
            id="intro-title"
            className="text-3xl font-black tracking-tight sm:text-5xl"
          >
            FUTSAL TACTICS <span className="text-emerald-400">PRO</span>
          </h2>
          <p className="mt-5 text-sm text-slate-400 sm:text-base">
            Nền tảng Phân tích Chiến thuật Futsal 5v5 Top #1
          </p>
        </div>

        <div className="mt-12 w-52 sm:w-64" aria-label="Đang mở sa bàn">
          <div className="h-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full origin-left rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] transition-transform ease-linear motion-reduce:transition-none"
              style={{
                transform: `scaleX(${ready ? 1 : 0})`,
                transitionDuration: `${INTRO_DURATION_MS}ms`,
              }}
            />
          </div>
          <p className="mt-3 text-[10px] font-medium tracking-[0.2em] text-slate-500">
            ĐANG CHUẨN BỊ SA BÀN
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-slate-700 bg-slate-900/80 px-5 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 sm:bottom-12"
      >
        Vào sa bàn ngay <ArrowRight size={17} />
      </button>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

const TacticalBoardCanvas = dynamic(() => import("./TacticalBoardCanvas"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-96 max-w-5xl items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-300">
      Đang tải sa bàn…
    </div>
  ),
});

export default function TacticalBoard() {
  return <TacticalBoardCanvas />;
}

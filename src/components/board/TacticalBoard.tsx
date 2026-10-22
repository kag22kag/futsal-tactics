"use client";

import dynamic from "next/dynamic";

const TacticalBoardCanvas = dynamic(() => import("./TacticalBoardCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 text-slate-400" role="status">
      Đang tải sa bàn…
    </div>
  ),
});

export default function TacticalBoard() {
  return <TacticalBoardCanvas />;
}

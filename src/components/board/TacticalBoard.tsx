"use client";

import dynamic from "next/dynamic";

interface Props {
  isFocusMode: boolean;
  onEnterFocus: () => void;
  onExitFocus: () => void;
}

const TacticalBoardCanvas = dynamic(() => import("./TacticalBoardCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 text-slate-400" role="status">
      Đang tải sa bàn.
    </div>
  ),
});

export default function TacticalBoard(props: Props) {
  return <TacticalBoardCanvas {...props} />;
}

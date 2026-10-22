"use client";
import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import type { PitchType } from "@/types/tactics";

interface Props {
  open: boolean;
  currentPitchType: PitchType;
  canDismiss: boolean;
  onSelect: (pitchType: PitchType) => void;
  onClose: () => void;
}

function PitchPreview({ half }: { half: boolean }) {
  return (
    <svg viewBox={half ? "0 0 220 220" : "0 0 420 220"} className="h-28 w-full text-emerald-200" aria-hidden="true">
      <rect x="10" y="10" width={half ? 200 : 400} height="200" rx="3" fill="#14532d" stroke="currentColor" strokeWidth="2" />
      <path d="M210 10 V210" stroke="currentColor" strokeWidth="2" />
      {half ? <path d="M210 80 A30 30 0 0 0 210 140" fill="none" stroke="currentColor" strokeWidth="2" /> : <circle cx="210" cy="110" r="30" fill="none" stroke="currentColor" strokeWidth="2" />}
      <path d="M10 65 Q70 65 70 110 Q70 155 10 155 M10 95 H3 V125 H10" fill="none" stroke="currentColor" strokeWidth="2" />
      {!half && <path d="M410 65 Q350 65 350 110 Q350 155 410 155 M410 95 H417 V125 H410" fill="none" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );
}

export default function PitchSelectorModal({ open, currentPitchType, canDismiss, onSelect, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} aria-labelledby="pitch-selector-title" aria-describedby="pitch-selector-description"
      onCancel={(event) => { event.preventDefault(); if (canDismiss) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl backdrop:bg-slate-950/85 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Futsal Tactics Pro</p><h2 id="pitch-selector-title" className="mt-2 text-2xl font-bold">Chọn không gian chiến thuật</h2></div>
        {canDismiss && <button type="button" onClick={onClose} aria-label="Đóng chọn sân" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X size={20} /></button>}
      </div>
      <p id="pitch-selector-description" className="mt-3 text-sm leading-6 text-slate-400">{canDismiss ? "Đổi loại sân sẽ tạo bài mới. Bạn sẽ được hỏi xác nhận trước khi xóa bài hiện tại." : "Chọn loại sân để bắt đầu. Bạn có thể đổi lại trên thanh công cụ."}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["full", "half"] as const).map((type) => (
          <button key={type} type="button" onClick={() => onSelect(type)} className={`rounded-2xl border p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-500/10 ${canDismiss && type === currentPitchType ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 bg-slate-950/50"}`}>
            <PitchPreview half={type === "half"} />
            <span className="mt-5 flex items-center justify-between text-lg font-bold">Futsal {type === "full" ? "Full" : "Half"}<ArrowRight size={18} className="text-emerald-400" /></span>
            <span className="mt-2 block text-sm leading-6 text-slate-400">{type === "full" ? "Phân tích chiến thuật toàn sân (5v5)" : "Phân tích bài tập nửa sân (Power-play, Cố định)"}</span>
            <span className="mt-3 block text-xs text-emerald-400">{type === "full" ? "800 × 400 • Hai khung thành" : "400 × 400 • Một khung thành"}</span>
          </button>
        ))}
      </div>
    </dialog>
  );
}

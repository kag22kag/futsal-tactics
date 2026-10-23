"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function ModalShell({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-slate-950/80">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <button type="button" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-800" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
    </div>
    {children}
  </dialog>;
}

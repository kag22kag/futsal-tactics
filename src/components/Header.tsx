"use client";
import { BookOpen, Download, Goal, RotateCcw, Save, Upload } from "lucide-react";
import type { PitchType } from "@/types/tactics";

interface Props {
  pitchType: PitchType;
  disabled: boolean;
  importDisabled: boolean;
  resetDisabled: boolean;
  onPitchChange: (type: PitchType) => void;
  onExportPng: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onReset: () => void;
  onOpenLibrary: () => void;
}

export default function Header(props: Props) {
  return (
    <header className="app-header z-20 shrink-0 border-b border-slate-800 bg-slate-950/95 px-3 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-400"><Goal size={24} /></span>
          <div><h1 className="text-xs font-black tracking-wider sm:text-sm">SA BÀN <span className="text-emerald-400">FUTSAL</span></h1>
            <p className="mt-0.5 flex items-center gap-2 text-[10px] tracking-widest text-slate-500">TACTICAL WORKSPACE <span className="rounded border border-slate-700 px-1 text-slate-400">v1.0</span></p>
          </div>
        </div>
        <div className="order-3 flex w-full justify-center md:order-none md:w-auto" role="group" aria-label="Chế độ sân">
          <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            {(["full", "half"] as const).map((type) => <button key={type} type="button" aria-pressed={props.pitchType === type} disabled={props.resetDisabled} onClick={() => props.onPitchChange(type)} className={`min-h-9 rounded-lg px-5 text-xs font-semibold transition ${props.pitchType === type ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10" : "text-slate-400 hover:text-white"}`}>Futsal {type === "full" ? "Full" : "Half"}</button>)}
          </div>
        </div>
        <nav className="flex items-center gap-1.5" aria-label="Tệp chiến thuật">
          <button className="header-action bg-emerald-400 text-slate-950 hover:bg-emerald-300" disabled={props.disabled} onClick={props.onExportPng} title="Tải ảnh PNG" aria-label="Tải ảnh PNG"><Download size={17} /><span className="hidden xl:inline">Tải ảnh PNG</span></button>
          <button className="header-action bg-slate-900 text-slate-300 hover:bg-slate-800" disabled={props.disabled} onClick={props.onExportJson} title="Lưu JSON" aria-label="Lưu JSON"><Save size={17} /><span className="hidden xl:inline">Lưu JSON</span></button>
          <button className="header-action bg-slate-900 text-slate-300 hover:bg-slate-800" disabled={props.importDisabled} onClick={props.onImportJson} title="Mở JSON" aria-label="Mở JSON"><Upload size={17} /><span className="hidden xl:inline">Mở JSON</span></button>
          <button className="header-action bg-slate-900 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300" disabled={props.resetDisabled} onClick={props.onReset} title="Reset · Tạo bài mới" aria-label="Reset · Tạo bài mới"><RotateCcw size={17} /><span className="hidden xl:inline">Reset</span></button>
          <button className="header-action bg-slate-900 text-emerald-400 lg:hidden" onClick={props.onOpenLibrary} title="Mở thư viện bài mẫu" aria-label="Mở thư viện bài mẫu"><BookOpen size={17} /></button>
        </nav>
      </div>
    </header>
  );
}

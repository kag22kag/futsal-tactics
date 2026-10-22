"use client";
import { BookOpen, ChevronLeft, ChevronRight, X, ArrowUpRight, Layers, Check } from "lucide-react";
import { PLAYBOOK_PRESETS, type PlaybookPreset } from "@/constants/presets";
import type { PitchType } from "@/types/tactics";
import FrameMiniature from "./FrameMiniature";

interface Props {
  pitchType: PitchType;
  disabled: boolean;
  activePreset: string | null;
  expanded: boolean;
  mobileOpen: boolean;
  onToggleExpanded: () => void;
  onCloseMobile: () => void;
  onLoad: (preset: PlaybookPreset) => void;
}
export default function PlaybookPresets(props: Props) {
  const presets = PLAYBOOK_PRESETS.filter(preset => preset.pitchType === props.pitchType);
  return <>
    {props.mobileOpen && <button type="button" className="absolute inset-0 z-20 bg-slate-950/65 backdrop-blur-sm lg:hidden" onClick={props.onCloseMobile} aria-label="Đóng thư viện bài mẫu" />}
    <aside aria-label="Thư viện bài mẫu" className={`preset-sidebar shrink-0 flex-col border-l border-slate-800 bg-slate-950 ${props.mobileOpen ? "absolute inset-y-0 right-0 z-30 flex w-[min(320px,90vw)]" : "hidden"} lg:relative lg:z-auto lg:flex ${props.expanded ? "lg:w-72 xl:w-80" : "lg:w-16"}`}>
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-4">
        <h2 className={`flex items-center gap-2 text-sm font-bold ${props.expanded ? "" : "lg:hidden"}`}><BookOpen size={18} className="text-emerald-400" /> Thư viện bài đánh</h2>
        <button type="button" className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 lg:flex" onClick={props.onToggleExpanded} aria-label={props.expanded ? "Thu gọn thư viện" : "Mở rộng thư viện"} title={props.expanded ? "Thu gọn thư viện" : "Mở rộng thư viện"} aria-expanded={props.expanded}>{props.expanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
        <button type="button" className="tool-button text-slate-400 lg:hidden" onClick={props.onCloseMobile} aria-label="Đóng thư viện"><X size={20} /></button>
      </div>
      {!props.expanded && <div className="hidden flex-1 items-center flex-col gap-4 pt-5 text-slate-500 lg:flex"><BookOpen size={20} /><span className="text-xs font-bold">{presets.length}</span></div>}
      <div className={`min-h-0 flex-1 overflow-y-auto p-4 ${props.expanded ? "" : "lg:hidden"}`}>
        <div className="mb-4 flex items-center justify-between"><p className="text-[10px] font-semibold tracking-widest text-slate-500">PLAYBOOK / {presets.length} BÀI MẪU</p><span className="rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2 py-1 text-[10px] text-emerald-400">{props.pitchType === "full" ? "Full Court" : "Half Court"}</span></div>
        <div className="space-y-3">
          {presets.map((preset, index) => <button key={preset.id} type="button" disabled={props.disabled} aria-pressed={props.activePreset === preset.id} onClick={() => props.onLoad(preset)} className={`group w-full overflow-hidden rounded-xl border text-left transition ${props.activePreset === preset.id ? "border-emerald-400/60 bg-emerald-400/5" : "border-slate-800 bg-slate-900/60 hover:border-slate-600"}`}>
            <div className="relative h-24 border-b border-slate-800 bg-gradient-to-br from-emerald-950/60 to-slate-900 px-6 py-3">{preset.frames[0] && <FrameMiniature frame={preset.frames[0]} pitchType={props.pitchType} />}<span className="absolute left-3 top-3 rounded bg-slate-950/80 px-1.5 py-1 font-mono text-[9px] text-emerald-400">0{index + 1}</span><span className="absolute right-3 top-3 text-emerald-400">{props.activePreset === preset.id ? <Check size={16} /> : <ArrowUpRight size={16} />}</span></div>
            <div className="p-3.5"><span className="block text-sm font-bold leading-5 text-slate-100">{preset.title}</span><span className="mt-2 block text-xs leading-5 text-slate-400">{preset.description}</span><span className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span className="flex items-center gap-1"><Layers size={12} /> {preset.frames.length} frames</span><span className="text-emerald-400">{props.activePreset === preset.id ? "Đang sử dụng" : "Nạp bài đánh →"}</span></span></div>
          </button>)}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-slate-500">Nạp bài mẫu sẽ thay thế các frame. Lưu JSON để giữ bài đang chỉnh sửa. Chuyển động mang tính minh họa.</p>
      </div>
    </aside>
  </>;
}

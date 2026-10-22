"use client";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { PLAYBOOK_PRESETS, PRESET_FRAME_DURATION_MS, type PlaybookPreset } from "@/constants/presets";

import type { PitchType } from "@/types/tactics";

interface Props {
  pitchType: PitchType;
  disabled: boolean;
  activePreset: string | null;
  onLoad: (preset: PlaybookPreset) => void;
}
export default function PlaybookPresets({ disabled, activePreset, onLoad, pitchType }: Props) {
  return (
    <aside className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center gap-2 text-emerald-400"><BookOpen size={19} /><h2 className="font-semibold text-white">Thư viện {pitchType === "full" ? "Full" : "Half"}</h2></div>
      <p className="mt-2 text-sm leading-6 text-slate-400">Chọn bài mẫu, sau đó bấm Play. Chuyển động mang tính minh họa để bạn tiếp tục chỉnh sửa.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {PLAYBOOK_PRESETS.filter((preset) => preset.pitchType === pitchType).map((preset, index) => (
          <button key={preset.id} type="button" disabled={disabled} aria-pressed={activePreset === preset.id} onClick={() => onLoad(preset)} className={`rounded-xl border p-4 text-left transition enabled:hover:border-emerald-400 disabled:opacity-40 ${activePreset === preset.id ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 bg-slate-950/50"}`}>
            <span className="flex items-center justify-between text-xs text-emerald-400">BÀI 0{index + 1}<ArrowUpRight size={17} /></span>
            <span className="mt-3 block font-semibold text-white">{preset.title}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-400">{preset.description}</span>
            <span className="mt-3 block text-xs text-slate-500">{preset.frames.length} frame · {(PRESET_FRAME_DURATION_MS / 1000).toFixed(1)}s/frame · {activePreset === preset.id ? "Đang chọn" : "Có hoạt cảnh"}</span>
          </button>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-400">Nạp bài mẫu sẽ thay toàn bộ frame. Lưu JSON trước nếu muốn giữ bài đang chỉnh sửa.</p>
    </aside>
  );
}

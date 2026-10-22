"use client";
import { memo, useEffect, useRef } from "react";
import { Pause, Play, Plus, Trash2, Film } from "lucide-react";
import type { Frame, PitchType } from "@/types/tactics";
import { MAX_FRAMES } from "@/constants/board";
import FrameMiniature from "./FrameMiniature";

interface Props {
  frames: Frame[];
  pitchType: PitchType;
  currentFrameIndex: number;
  isPlaying: boolean;
  isPreviewing: boolean;
  busy: boolean;
  speed: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
}

function FrameTimeline(props: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children.item(props.currentFrameIndex) as HTMLElement | null;
    if (!list || !item) return;
    // Chỉ cuộn danh sách frame, không kéo toàn bộ trang.
    if (item.offsetLeft < list.scrollLeft) list.scrollLeft = item.offsetLeft;
    else if (item.offsetLeft + item.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = item.offsetLeft + item.offsetWidth - list.clientWidth;
    }
  }, [props.currentFrameIndex]);
  return <section className="timeline shrink-0 border-t border-slate-800 bg-slate-900/90 p-3" aria-label="Timeline hoạt cảnh">
    <div className="mb-2 flex items-center justify-between text-[10px] font-semibold tracking-widest text-slate-500"><span className="flex items-center gap-1.5"><Film size={13} /> TIMELINE</span><span>{String(props.currentFrameIndex + 1).padStart(2, "0")} / {String(props.frames.length).padStart(2, "0")} FRAMES</span></div>
    <div className="timeline-content flex items-center gap-3">
      <div className="playback-controls flex shrink-0 items-center gap-3">
        <button type="button" onClick={props.onTogglePlay} disabled={props.busy || props.frames.length < 2} aria-label={props.isPlaying ? "Tạm dừng" : props.isPreviewing ? "Tiếp tục" : "Phát hoạt cảnh"} title={props.isPlaying ? "Tạm dừng" : "Phát hoạt cảnh"} className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15 hover:bg-emerald-300">{props.isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button>
        <label className="speed-control block w-24 text-[10px] text-slate-400"><span className="flex justify-between">TỐC ĐỘ <b className="text-emerald-400">{props.speed}x</b></span><input aria-label="Tốc độ hoạt cảnh" type="range" min="0.5" max="2" step="0.5" value={props.speed} disabled={props.busy} onChange={event => props.onSpeedChange(Number(event.target.value))} className="h-8 w-full accent-emerald-400" /><span className="flex justify-between text-[9px]"><span>0.5x</span><span>1x</span><span>1.5x</span><span>2x</span></span></label>
      </div>
      <div ref={listRef} className="frame-list relative flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" aria-label="Danh sách khung hình">
        {props.frames.map((frame, index) => <button key={frame.id} type="button" disabled={props.busy} onClick={() => props.onSelect(index)} aria-pressed={index === props.currentFrameIndex} aria-label={`Chọn Frame ${index + 1}`} className={`frame-card w-24 shrink-0 rounded-lg border p-1 transition ${index === props.currentFrameIndex ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-slate-700 bg-slate-950/60 text-slate-500 hover:border-slate-500"}`}><span className="frame-image block h-10"><FrameMiniature frame={frame} pitchType={props.pitchType} /></span><span className="block pt-1 text-[10px] font-semibold">Frame {index + 1}</span></button>)}
      </div>
      <div className="frame-actions flex shrink-0 gap-1.5">
        <button type="button" onClick={props.onAdd} disabled={props.busy || props.isPreviewing || props.frames.length >= MAX_FRAMES} className="tool-button border border-dashed border-slate-600 text-emerald-400 hover:bg-emerald-400/10" title="Thêm Frame" aria-label="Thêm Frame"><Plus size={20} /></button>
        <button type="button" onClick={props.onDelete} disabled={props.busy || props.isPreviewing || props.frames.length <= 1} className="tool-button text-slate-500 hover:bg-rose-500/10 hover:text-rose-300" title="Xóa Frame hiện tại" aria-label="Xóa Frame hiện tại"><Trash2 size={18} /></button>
      </div>
    </div>
  </section>;
}
export default memo(FrameTimeline);

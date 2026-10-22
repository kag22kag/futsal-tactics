"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

import type { Frame } from "@/types/tactics";
import { MAX_FRAMES } from "@/constants/board";

interface FrameTimelineProps {
  frames: Frame[];
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

const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-lg " +
  "border border-slate-600 px-3 py-2 text-sm text-slate-200 " +
  "enabled:hover:bg-slate-700 disabled:cursor-not-allowed " +
  "disabled:opacity-40";

export default function FrameTimeline({
  frames,
  currentFrameIndex,
  isPlaying,
  isPreviewing,
  busy,
  speed,
  onSelect,
  onAdd,
  onDelete,
  onTogglePlay,
  onSpeedChange,
}: FrameTimelineProps) {
  return (
    <div className="space-y-4 border-t border-slate-700 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={BUTTON_CLASS}
          disabled={busy || frames.length < 2}
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          {isPlaying ? "Pause" : isPreviewing ? "Tiếp tục" : "Play từ đầu"}
        </button>

        <button
          type="button"
          aria-label="Frame trước"
          className={BUTTON_CLASS}
          disabled={busy || currentFrameIndex === 0}
          onClick={() => onSelect(currentFrameIndex - 1)}
        >
          <ChevronLeft size={17} />
        </button>

        <button
          type="button"
          aria-label="Frame tiếp theo"
          className={BUTTON_CLASS}
          disabled={busy || currentFrameIndex === frames.length - 1}
          onClick={() => onSelect(currentFrameIndex + 1)}
        >
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          className={BUTTON_CLASS}
          disabled={busy || isPreviewing || frames.length >= MAX_FRAMES}
          onClick={onAdd}
        >
          <Plus size={17} />
          Thêm frame
        </button>

        <button
          type="button"
          className={BUTTON_CLASS}
          disabled={busy || isPreviewing || frames.length <= 1}
          onClick={onDelete}
        >
          <Trash2 size={17} />
          Xóa frame
        </button>

        <label className="ml-auto flex items-center gap-3 text-sm text-slate-300">
          Tốc độ: {speed}x
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.5}
            value={speed}
            disabled={busy}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="w-28 accent-emerald-400"
          />
        </label>
      </div>

      <div
        role="group"
        aria-label="Danh sách khung hình"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {frames.map((frame, index) => (
          <button
            key={frame.id}
            type="button"
            disabled={busy}
            aria-pressed={index === currentFrameIndex}
            onClick={() => onSelect(index)}
            className={`min-w-24 shrink-0 rounded-lg border px-4 py-3 text-sm font-medium ${
              index === currentFrameIndex
                ? "border-emerald-400 bg-emerald-500 text-slate-950"
                : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            Frame {index + 1}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        {isPreviewing
          ? "Đang xem hoạt cảnh. Bấm một frame để dừng và chỉnh sửa."
          : "Thêm frame sẽ sao chép cầu thủ, bóng và nét vẽ của frame đang chọn."}
      </p>
    </div>
  );
}

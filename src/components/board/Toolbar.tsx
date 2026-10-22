"use client";

import {
  MousePointer,
  MoveUpRight,
  Spline,
  Minus,
  RotateCcw,
  Trash2,
  RefreshCw,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { DrawingTool } from "@/types/tactics";

interface ToolbarProps {
  activeTool: DrawingTool;
  canUndo: boolean;
  disabled: boolean;
  resetDisabled: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onUndo: () => void;
  onClearAll: () => void;
  onReset: () => void;
}

interface ToolOption {
  id: DrawingTool;
  label: string;
  icon: LucideIcon;
}

const TOOL_OPTIONS: ToolOption[] = [
  {
    id: "select",
    label: "Chọn / Kéo",
    icon: MousePointer,
  },
  {
    id: "arrow",
    label: "Chạy chỗ",
    icon: MoveUpRight,
  },
  {
    id: "dashed-arrow",
    label: "Chuyền bóng",
    icon: Spline,
  },
  {
    id: "line",
    label: "Đường thẳng",
    icon: Minus,
  },
];

const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-lg " +
  "border px-3 py-2 text-sm font-medium transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-emerald-400 " +
  "disabled:cursor-not-allowed disabled:opacity-40";

export default function Toolbar({
  activeTool,
  canUndo,
  disabled,
  resetDisabled,
  onToolChange,
  onUndo,
  onClearAll,
  onReset,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 p-4">
      <div
        role="group"
        aria-label="Công cụ chiến thuật"
        className="flex flex-wrap gap-2"
      >
        {TOOL_OPTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTool === id;

          return (
            <button
              key={id}
              type="button"
              title={label}
              disabled={disabled}
              aria-pressed={isActive}
              onClick={() => onToolChange(id)}
              className={`${BUTTON_CLASS} ${
                isActive
                  ? "border-emerald-400 bg-emerald-500 text-slate-950"
                  : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label="Thao tác với sa bàn"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          title="Xóa nét vẽ gần nhất"
          disabled={disabled || !canUndo}
          onClick={onUndo}
          className={`${BUTTON_CLASS} border-slate-600 text-slate-200 enabled:hover:bg-slate-800`}
        >
          <RotateCcw size={17} aria-hidden="true" />
          Undo
        </button>

        <button
          type="button"
          title="Xóa toàn bộ nét vẽ"
          disabled={disabled || !canUndo}
          onClick={onClearAll}
          className={`${BUTTON_CLASS} border-red-500/40 text-red-300 enabled:hover:bg-red-500/10`}
        >
          <Trash2 size={17} aria-hidden="true" />
          Xóa nét vẽ
        </button>

        <button
          type="button"
          title="Xóa toàn bộ frame và tạo bài đánh mới"
          disabled={resetDisabled}
          onClick={onReset}
          className={`${BUTTON_CLASS} border-slate-600 text-slate-200 hover:bg-slate-800`}
        >
          <RefreshCw size={17} aria-hidden="true" />
          Tạo bài đánh mới
        </button>
      </div>
    </div>
  );
}

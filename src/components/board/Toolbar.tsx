"use client";

import { useState } from "react";
import { MousePointer2, MoveUpRight, Spline, Minus, Undo2, Trash2, Palette } from "lucide-react";
import type { DrawingTool } from "@/types/tactics";

interface Props {
  activeTool: DrawingTool;
  color: string;
  canUndo: boolean;
  disabled: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onClearAll: () => void;
}

const tools = [
  { id: "select", label: "Chọn / Kéo thả", Icon: MousePointer2 },
  { id: "arrow", label: "Mũi tên chạy chỗ", Icon: MoveUpRight },
  { id: "dashed-arrow", label: "Đường chuyền nét đứt", Icon: Spline },
  { id: "line", label: "Đường thẳng", Icon: Minus },
] as const;

const colors = [
  { value: "#EF4444", name: "Đỏ" },
  { value: "#FDE047", name: "Vàng" },
  { value: "#3B82F6", name: "Xanh" },
  { value: "#FFFFFF", name: "Trắng" },
];

export default function Toolbar(props: Props) {
  const [colorsOpen, setColorsOpen] = useState(false);

  return (
    <div
      className="floating-tools absolute z-10 flex gap-1 rounded-2xl border border-slate-700/70 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-md"
      role="toolbar"
      aria-label="Công cụ vẽ chiến thuật"
    >
      {tools.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          disabled={props.disabled}
          onClick={() => props.onToolChange(id)}
          aria-label={label}
          aria-pressed={props.activeTool === id}
          title={label}
          className={`tool-button group relative ${props.activeTool === id
            ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
        >
          <Icon size={20} />
          <span className="tool-tip">{label}</span>
        </button>
      ))}
      <div className="tool-divider" />
      <button
        type="button"
        className="mobile-color-toggle tool-button hidden text-slate-200"
        onClick={() => setColorsOpen(open => !open)}
        aria-label="Chọn màu nét vẽ"
        aria-expanded={colorsOpen}
        disabled={props.disabled}
        title="Chọn màu nét vẽ"
      >
        <Palette size={19} style={{ color: props.color }} />
      </button>
      <div className="color-picker grid grid-cols-2 gap-1" data-open={colorsOpen} role="group" aria-label="Màu nét vẽ">
        {colors.map(({ value, name }) => (
          <button
            key={value}
            type="button"
            disabled={props.disabled}
            onClick={() => { props.onColorChange(value); setColorsOpen(false); }}
            aria-label={`Màu ${name}`}
            aria-pressed={props.color === value}
            title={`Màu ${name}`}
            className={`color-button grid place-items-center rounded-full border ${props.color === value
              ? "border-emerald-400 bg-emerald-400/15"
              : "border-transparent hover:bg-slate-800"}`}
          >
            <span className="size-3 rounded-full" style={{ backgroundColor: value }} />
          </button>
        ))}
      </div>
      <div className="tool-divider" />
      <button
        type="button"
        className="tool-button group relative text-slate-400 hover:bg-slate-800 hover:text-white"
        disabled={props.disabled || !props.canUndo}
        onClick={props.onUndo}
        title="Hoàn tác nét vẽ"
        aria-label="Hoàn tác nét vẽ"
      >
        <Undo2 size={20} /><span className="tool-tip">Hoàn tác nét vẽ</span>
      </button>
      <button
        type="button"
        className="tool-button group relative text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
        disabled={props.disabled || !props.canUndo}
        onClick={props.onClearAll}
        title="Xóa nét vẽ trong frame"
        aria-label="Xóa nét vẽ trong frame"
      >
        <Trash2 size={19} /><span className="tool-tip">Xóa nét vẽ trong frame</span>
      </button>
    </div>
  );
}

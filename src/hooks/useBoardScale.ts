"use client";
import { useEffect, useRef, useState } from "react";
import { STAGE_WIDTH } from "@/constants/board";

export function useBoardScale(stageWidth: number = STAGE_WIDTH) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  // Tính lại ngay khi đổi loại sân, không cần chờ sự kiện resize.
  const scale = containerWidth === null ? 1 : Math.min(1, containerWidth / stageWidth);
  return { containerRef, scale };
}

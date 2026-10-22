"use client";
import { useEffect, useRef, useState } from "react";
import { STAGE_WIDTH, STAGE_HEIGHT } from "@/constants/board";

export function useBoardScale(stageWidth = STAGE_WIDTH, stageHeight = STAGE_HEIGHT) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // Container có kích thước riêng: canvas không quyết định chiều cao của nó.
  const scale = size.width > 0 && size.height > 0
    ? Math.min(1.5, size.width / stageWidth, size.height / stageHeight) : 0.1;
  return { containerRef, scale };
}

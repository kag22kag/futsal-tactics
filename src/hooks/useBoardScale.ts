"use client";
import { useEffect, useRef, useState } from "react";
import { STAGE_WIDTH } from "@/constants/board";

export function useBoardScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setScale(Math.min(1, entry.contentRect.width / STAGE_WIDTH));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return { containerRef, scale };
}

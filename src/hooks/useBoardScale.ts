"use client";

import { useEffect, useRef, useState } from "react";
import { STAGE_HEIGHT, STAGE_WIDTH } from "@/constants/board";

interface AvailableSpace {
  width: number;
  height: number;
}

export function useBoardScale(stageWidth = STAGE_WIDTH, stageHeight = STAGE_HEIGHT) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [space, setSpace] = useState<AvailableSpace>({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const node: HTMLDivElement = element;
    let animationFrame = 0;

    function measure() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        // The canvas fits the board area left after the header, toolbar and timeline.
        const viewport = window.visualViewport;
        const bounds = node.getBoundingClientRect();
        const width = Math.min(bounds.width, window.innerWidth, viewport?.width ?? Infinity);
        const height = Math.min(bounds.height, window.innerHeight, viewport?.height ?? Infinity);
        setSpace(previous =>
          previous.width === width && previous.height === height ? previous : { width, height },
        );
      });
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.visualViewport?.addEventListener("resize", measure);
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const scale = space.width > 0 && space.height > 0
    ? Math.min(1.5, space.width / stageWidth, space.height / stageHeight)
    : 0.1;

  return { containerRef, scale };
}

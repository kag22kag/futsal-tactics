"use client";

import { Circle, Group, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Player } from "@/types/tactics";

interface PlayerTokenProps {
  player: Player;
  pitchWidth: number;
  pitchHeight: number;
  isDraggable: boolean;
  scale?: number;
  onPositionChange: (id: string, x: number, y: number) => void;
}

const RADIUS = 18;

const TEAM_COLORS = {
  home: "#EF4444",
  away: "#3B82F6",
} as const;

export default function PlayerToken({
  player,
  pitchWidth,
  pitchHeight,
  isDraggable,
  scale = 1,
  onPositionChange,
}: PlayerTokenProps) {
  const fill = player.isGK ? "#FACC15" : TEAM_COLORS[player.team];
  const textColor = player.isGK ? "#172033" : "#FFFFFF";

  function keepInsidePitch(event: KonvaEventObject<DragEvent>) {
    const node = event.target;

    const x = Math.max(RADIUS, Math.min(pitchWidth - RADIUS, node.x()));

    const y = Math.max(RADIUS, Math.min(pitchHeight - RADIUS, node.y()));

    node.position({ x, y });

    return { x, y };
  }

  function handleDragEnd(event: KonvaEventObject<DragEvent>) {
    const { x, y } = keepInsidePitch(event);
    onPositionChange(player.id, x, y);
  }

  return (
    <Group
      x={player.x}
      y={player.y}
      draggable={isDraggable}
      listening={isDraggable}
      onDragMove={keepInsidePitch}
      onDragEnd={handleDragEnd}
    >
      <Circle
        radius={RADIUS}
        hitStrokeWidth={Math.max(2, 44 / scale - RADIUS * 2)}
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth={2}
        shadowColor="#000000"
        shadowBlur={6}
        shadowOpacity={0.25}
        shadowOffsetY={3}
      />

      <Text
        x={-RADIUS}
        y={-8}
        width={RADIUS * 2}
        height={16}
        text={String(player.number)}
        fontSize={16}
        fontStyle="bold"
        align="center"
        fill={textColor}
        listening={false}
      />

      <Text
        x={-55}
        y={RADIUS + 6}
        width={110}
        text={`${player.name}${player.isGK ? " · GK" : ""}`}
        fontSize={11}
        fontStyle="bold"
        align="center"
        fill="#FFFFFF"
        shadowColor="#000000"
        shadowBlur={3}
        listening={false}
      />
    </Group>
  );
}

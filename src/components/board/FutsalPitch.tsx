"use client";
import { Arc, Circle, Group, Line, Rect } from "react-konva";
import { getPitchDimensions } from "@/constants/board";
import type { PitchType } from "@/types/tactics";

const WHITE = "#FFFFFF";
const STROKE = 2;
const PENALTY_RADIUS = 120; // 6 m, với 20 px/m.
const UPPER_POST = 200 - 31.6;
const LOWER_POST = 200 + 31.6;

function GoalArea({ x, mirror = false }: { x: number; mirror?: boolean }) {
  return (
    <Group x={x} scaleX={mirror ? -1 : 1} listening={false}>
      <Rect x={-20} y={170} width={20} height={60} fill="#FFFFFF18" stroke={WHITE} strokeWidth={STROKE} />
      <Arc x={0} y={UPPER_POST} innerRadius={119} outerRadius={121} angle={90} rotation={270} fill={WHITE} />
      <Arc x={0} y={LOWER_POST} innerRadius={119} outerRadius={121} angle={90} rotation={0} fill={WHITE} />
      <Line points={[PENALTY_RADIUS, UPPER_POST, PENALTY_RADIUS, LOWER_POST]} stroke={WHITE} strokeWidth={STROKE} />
      {[120, 200].map((mark) => <Circle key={mark} x={mark} y={200} radius={2.5} fill={WHITE} />)}
      <Arc x={0} y={0} innerRadius={4} outerRadius={6} angle={90} rotation={0} fill={WHITE} />
      <Arc x={0} y={400} innerRadius={4} outerRadius={6} angle={90} rotation={270} fill={WHITE} />
    </Group>
  );
}

export default function FutsalPitch({ pitchType = "full" }: { pitchType?: PitchType }) {
  const { width, height } = getPitchDimensions(pitchType);
  const full = pitchType === "full";
  return (
    <Group listening={false}>
      <Rect width={width} height={height} fill="#166534" />
      {Array.from({ length: width / 80 }, (_, index) => <Rect key={index} x={index * 80} width={80} height={height} fill={index % 2 === 0 ? "#15803D" : "#166534"} />)}
      <Rect width={width} height={height} stroke={WHITE} strokeWidth={STROKE} />
      {/* Đường giữa sân luôn ở x=400; trong Half nó nằm sát mép phải. */}
      <Line points={[400, 0, 400, height]} stroke={WHITE} strokeWidth={STROKE} />
      <Group clipX={0} clipY={0} clipWidth={width} clipHeight={height}>
        <Circle x={400} y={200} radius={60} stroke={WHITE} strokeWidth={STROKE} />
        <Circle x={400} y={200} radius={2} fill={WHITE} />
      </Group>
      <GoalArea x={0} />
      {full && <GoalArea x={800} mirror />}
      {(full ? [200, 300, 500, 600] : [200, 300]).map((x) => <Line key={x} points={[x, 392, x, 408]} stroke={WHITE} strokeWidth={STROKE} />)}
    </Group>
  );
}

"use client";

import { Arc, Circle, Group, Line, Rect } from "react-konva";

const WIDTH = 800;
const HEIGHT = 400;
const SCALE = 20; // 20 px = 1 m.
const LINE_COLOR = "#FFFFFF";
const LINE_WIDTH = 2;

const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

const PENALTY_RADIUS = 6 * SCALE;
const GOAL_WIDTH = 3 * SCALE;
const GOAL_DEPTH = 20;

// Khoảng cách giữa mép ngoài hai cột: 3,16 m.
const PENALTY_HALF_STRAIGHT = (3.16 * SCALE) / 2;
const UPPER_POST_Y = CENTER_Y - PENALTY_HALF_STRAIGHT;
const LOWER_POST_Y = CENTER_Y + PENALTY_HALF_STRAIGHT;

const PENALTY_ARCS = [
  { id: "left-upper", x: 0, y: UPPER_POST_Y, rotation: 270 },
  { id: "left-lower", x: 0, y: LOWER_POST_Y, rotation: 0 },
  { id: "right-upper", x: WIDTH, y: UPPER_POST_Y, rotation: 180 },
  { id: "right-lower", x: WIDTH, y: LOWER_POST_Y, rotation: 90 },
];

const CORNERS = [
  { x: 0, y: 0, rotation: 0 },
  { x: WIDTH, y: 0, rotation: 90 },
  { x: WIDTH, y: HEIGHT, rotation: 180 },
  { x: 0, y: HEIGHT, rotation: 270 },
];

// Hai khu thay người dài 5 m, cách vạch giữa sân 5 m.
const SUBSTITUTION_ZONES = [
  { start: CENTER_X - 10 * SCALE, end: CENTER_X - 5 * SCALE },
  { start: CENTER_X + 5 * SCALE, end: CENTER_X + 10 * SCALE },
];

export default function FutsalPitch() {
  return (
    // Sân là lớp nền, không nhận sự kiện chuột.
    <Group listening={false}>
      <Rect width={WIDTH} height={HEIGHT} fill="#166534" />

      {/* Các dải màu chỉ dùng để trang trí mặt sân. */}
      {Array.from({ length: 10 }, (_, index) => (
        <Rect
          key={index}
          x={index * 80}
          y={0}
          width={80}
          height={HEIGHT}
          fill={index % 2 === 0 ? "#15803D" : "#166534"}
        />
      ))}

      {/* Hai khung thành nằm ngoài đường biên ngang. */}
      {[-GOAL_DEPTH, WIDTH].map((x) => (
        <Rect
          key={x}
          x={x}
          y={CENTER_Y - GOAL_WIDTH / 2}
          width={GOAL_DEPTH}
          height={GOAL_WIDTH}
          fill="#FFFFFF18"
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
        />
      ))}

      {/* Đường biên sân. */}
      <Rect
        width={WIDTH}
        height={HEIGHT}
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Vạch giữa sân và vòng tròn trung tâm bán kính 3 m. */}
      <Line
        points={[CENTER_X, 0, CENTER_X, HEIGHT]}
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      <Circle
        x={CENTER_X}
        y={CENTER_Y}
        radius={3 * SCALE}
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      <Circle x={CENTER_X} y={CENTER_Y} radius={2} fill={LINE_COLOR} />

      {/* Vẽ cung bằng một dải tròn mỏng, không có đường nối vào tâm. */}
      {PENALTY_ARCS.map((arc) => (
        <Arc
          key={arc.id}
          x={arc.x}
          y={arc.y}
          innerRadius={PENALTY_RADIUS - LINE_WIDTH / 2}
          outerRadius={PENALTY_RADIUS + LINE_WIDTH / 2}
          angle={90}
          rotation={arc.rotation}
          fill={LINE_COLOR}
        />
      ))}

      {/* Đoạn thẳng nối hai cung của mỗi khu phạt đền. */}
      {[PENALTY_RADIUS, WIDTH - PENALTY_RADIUS].map((x) => (
        <Line
          key={x}
          points={[x, UPPER_POST_Y, x, LOWER_POST_Y]}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
        />
      ))}

      {/* Điểm phạt đền 6 m và điểm 10 m ở hai đầu sân. */}
      {[6 * SCALE, 10 * SCALE, WIDTH - 10 * SCALE, WIDTH - 6 * SCALE].map(
        (x) => (
          <Circle key={x} x={x} y={CENTER_Y} radius={2.5} fill={LINE_COLOR} />
        ),
      )}

      {/* Cung phạt góc bán kính 0,25 m. */}
      {CORNERS.map((corner, index) => (
        <Arc
          key={index}
          x={corner.x}
          y={corner.y}
          innerRadius={0.25 * SCALE - LINE_WIDTH / 2}
          outerRadius={0.25 * SCALE + LINE_WIDTH / 2}
          angle={90}
          rotation={corner.rotation}
          fill={LINE_COLOR}
        />
      ))}

      {/* Vạch thay người dài 80 cm: 40 cm trong và 40 cm ngoài sân. */}
      {SUBSTITUTION_ZONES.map((zone) => (
        <Group key={zone.start}>
          {[zone.start, zone.end].map((x) => (
            <Line
              key={x}
              points={[x, HEIGHT - 0.4 * SCALE, x, HEIGHT + 0.4 * SCALE]}
              stroke={LINE_COLOR}
              strokeWidth={LINE_WIDTH}
            />
          ))}
        </Group>
      ))}
    </Group>
  );
}

import type {
  Ball,
  Frame,
  Player,
  TacticalLine,
  TacticsDocument,
} from "@/types/tactics";

import {
  BALL_RADIUS,
  MAX_FRAMES,
  MAX_LINES,
  PITCH_HEIGHT,
  PITCH_WIDTH,
  PLAYER_RADIUS,
} from "@/constants/board";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Sao chép cả các mảng con để hai frame không dùng chung dữ liệu.
export function cloneFrame(frame: Frame, id: string): Frame {
  return {
    id,
    players: frame.players.map((player) => ({ ...player })),
    ball: { ...frame.ball },
    lines: frame.lines.map((line) => ({
      ...line,
      points: [...line.points],
    })),
  };
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

// Chỉ nội suy cầu thủ và bóng; nét vẽ giữ theo frame bắt đầu.
export function interpolateFrame(
  from: Frame,
  to: Frame,
  progress: number,
): Frame {
  const t = clamp(progress, 0, 1);
  const destinations = new Map(to.players.map((player) => [player.id, player]));

  return {
    ...from,
    players: from.players.map((player) => {
      const destination = destinations.get(player.id);

      if (!destination) {
        return { ...player };
      }

      return {
        ...player,
        x: lerp(player.x, destination.x, t),
        y: lerp(player.y, destination.y, t),
      };
    }),
    ball: {
      x: lerp(from.ball.x, to.ball.x, t),
      y: lerp(from.ball.y, to.ball.y, t),
    },
  };
}

export function downloadUrl(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadJson(data: TacticsDocument): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  downloadUrl(url, "bai-danh-futsal.json");

  // Giải phóng URL sau khi trình duyệt bắt đầu tải.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Kiểm tra file nhập ----------

function fail(message: string): never {
  throw new Error(message);
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail("Cấu trúc JSON không hợp lệ.");
  }

  return value as Record<string, unknown>;
}

function readText(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 100
  ) {
    return fail(`${label} không hợp lệ.`);
  }

  return value;
}

function readNumber(
  value: unknown,
  min: number,
  max: number,
  label: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    return fail(`${label} không hợp lệ.`);
  }

  return value;
}

function readBoolean(value: unknown, label: string): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    return fail(`${label} phải là true hoặc false.`);
  }

  return value;
}

function readPlayer(value: unknown): Player {
  const item = record(value);

  if (item.team !== "home" && item.team !== "away") {
    return fail("Đội của cầu thủ không hợp lệ.");
  }

  const number = readNumber(item.number, 0, 99, "Số áo");

  if (!Number.isInteger(number)) {
    return fail("Số áo phải là số nguyên.");
  }

  return {
    id: readText(item.id, "ID cầu thủ"),
    name: readText(item.name, "Tên cầu thủ"),
    team: item.team,
    number,
    isGK: readBoolean(item.isGK, "isGK"),
    x: readNumber(
      item.x,
      PLAYER_RADIUS,
      PITCH_WIDTH - PLAYER_RADIUS,
      "Tọa độ x cầu thủ",
    ),
    y: readNumber(
      item.y,
      PLAYER_RADIUS,
      PITCH_HEIGHT - PLAYER_RADIUS,
      "Tọa độ y cầu thủ",
    ),
  };
}

function readBall(value: unknown): Ball {
  const item = record(value);

  return {
    x: readNumber(
      item.x,
      BALL_RADIUS,
      PITCH_WIDTH - BALL_RADIUS,
      "Tọa độ x bóng",
    ),
    y: readNumber(
      item.y,
      BALL_RADIUS,
      PITCH_HEIGHT - BALL_RADIUS,
      "Tọa độ y bóng",
    ),
  };
}

function readLine(value: unknown): TacticalLine {
  const item = record(value);

  if (!Array.isArray(item.points) || item.points.length !== 4) {
    return fail("Mỗi nét vẽ phải có hai điểm [x1, y1, x2, y2].");
  }

  const points = item.points.map((point: unknown, index: number) =>
    readNumber(
      point,
      0,
      index % 2 === 0 ? PITCH_WIDTH : PITCH_HEIGHT,
      "Tọa độ nét vẽ",
    ),
  );

  const color = readText(item.color, "Màu nét vẽ");

  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return fail("Màu nét vẽ phải ở dạng HEX, ví dụ #FFFFFF.");
  }

  return {
    id: readText(item.id, "ID nét vẽ"),
    points,
    color,
    isDashed: readBoolean(item.isDashed, "isDashed"),
    hasArrow: readBoolean(item.hasArrow, "hasArrow"),
  };
}

function readFrame(value: unknown): Frame {
  const item = record(value);

  if (!Array.isArray(item.players) || item.players.length !== 10) {
    return fail("Mỗi frame phải có đúng 10 cầu thủ.");
  }

  if (!Array.isArray(item.lines) || item.lines.length > MAX_LINES) {
    return fail(`Mỗi frame được chứa tối đa ${MAX_LINES} nét vẽ.`);
  }

  const players = item.players.map((player: unknown) => readPlayer(player));
  const lines = item.lines.map((line: unknown) => readLine(line));

  if (new Set(players.map((player) => player.id)).size !== 10) {
    return fail("ID cầu thủ trong một frame không được trùng nhau.");
  }

  if (new Set(lines.map((line) => line.id)).size !== lines.length) {
    return fail("ID nét vẽ trong một frame không được trùng nhau.");
  }

  for (const team of ["home", "away"] as const) {
    const members = players.filter((player) => player.team === team);

    if (
      members.length !== 5 ||
      members.filter((player) => player.isGK).length !== 1
    ) {
      return fail("Mỗi đội phải có 5 cầu thủ, trong đó có đúng 1 thủ môn.");
    }
  }

  return {
    id: readText(item.id, "ID frame"),
    players,
    ball: readBall(item.ball),
    lines,
  };
}

export function parseTacticsJson(text: string): TacticsDocument {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    return fail("File không phải JSON hợp lệ.");
  }

  const item = record(value);

  if (item.format !== "futsal-tactics" || item.version !== 1) {
    return fail("File không đúng định dạng bài đánh Futsal phiên bản 1.");
  }

  if (
    !Array.isArray(item.frames) ||
    item.frames.length < 1 ||
    item.frames.length > MAX_FRAMES
  ) {
    return fail(`Bài đánh phải có từ 1 đến ${MAX_FRAMES} frame.`);
  }

  const frames = item.frames.map((frame: unknown) => readFrame(frame));
  const firstFrame = frames[0];

  if (!firstFrame) {
    return fail("File không có frame.");
  }

  if (new Set(frames.map((frame) => frame.id)).size !== frames.length) {
    return fail("ID các frame không được trùng nhau.");
  }

  // Kiểm tra cùng một đội hình xuyên suốt các frame.
  const roster = new Map(
    firstFrame.players.map((player) => [player.id, player]),
  );

  for (const frame of frames) {
    for (const player of frame.players) {
      const original = roster.get(player.id);

      if (
        !original ||
        original.team !== player.team ||
        original.isGK !== player.isGK
      ) {
        return fail(
          "ID, đội và vai trò cầu thủ phải thống nhất giữa các frame.",
        );
      }
    }
  }

  const currentFrameIndex = readNumber(
    item.currentFrameIndex,
    0,
    frames.length - 1,
    "Frame đang chọn",
  );

  if (!Number.isInteger(currentFrameIndex)) {
    return fail("Chỉ số frame phải là số nguyên.");
  }

  return {
    format: "futsal-tactics",
    version: 1,
    currentFrameIndex,
    frames,
  };
}

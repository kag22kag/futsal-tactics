import type { Ball, Frame, Player } from "@/types/tactics";

export const PITCH_WIDTH = 800;
export const PITCH_HEIGHT = 400;
export const PADDING = 40;

export const STAGE_WIDTH = PITCH_WIDTH + PADDING * 2;
export const STAGE_HEIGHT = PITCH_HEIGHT + PADDING * 2;

export const PLAYER_RADIUS = 18;
export const BALL_RADIUS = 9;
export const MAX_FRAMES = 100;
export const MAX_LINES = 500;
export const MAX_JSON_BYTES = 5 * 1024 * 1024;

export const INITIAL_PLAYERS: readonly Readonly<Player>[] = [
  {
    id: "home-gk",
    x: 40,
    y: 200,
    team: "home",
    number: 1,
    name: "Thủ môn Nhà",
    isGK: true,
  },
  {
    id: "home-2",
    x: 180,
    y: 200,
    team: "home",
    number: 2,
    name: "Fixo Nhà",
  },
  {
    id: "home-7",
    x: 270,
    y: 90,
    team: "home",
    number: 7,
    name: "Ala trái Nhà",
  },
  {
    id: "home-10",
    x: 270,
    y: 310,
    team: "home",
    number: 10,
    name: "Ala phải Nhà",
  },
  {
    id: "home-9",
    x: 350,
    y: 200,
    team: "home",
    number: 9,
    name: "Pivot Nhà",
  },
  {
    id: "away-gk",
    x: 760,
    y: 200,
    team: "away",
    number: 1,
    name: "Thủ môn Khách",
    isGK: true,
  },
  {
    id: "away-2",
    x: 620,
    y: 200,
    team: "away",
    number: 2,
    name: "Fixo Khách",
  },
  {
    id: "away-7",
    x: 530,
    y: 90,
    team: "away",
    number: 7,
    name: "Ala trái Khách",
  },
  {
    id: "away-10",
    x: 530,
    y: 310,
    team: "away",
    number: 10,
    name: "Ala phải Khách",
  },
  {
    id: "away-9",
    x: 450,
    y: 200,
    team: "away",
    number: 9,
    name: "Pivot Khách",
  },
];

export const INITIAL_BALL: Readonly<Ball> = {
  x: PITCH_WIDTH / 2,
  y: PITCH_HEIGHT / 2,
};

// Mỗi lần tạo mới đều sao chép dữ liệu để không sửa nhầm hằng số mặc định.
export function createInitialFrame(): Frame {
  return {
    id: "frame-1",
    players: INITIAL_PLAYERS.map((player) => ({ ...player })),
    ball: { ...INITIAL_BALL },
    lines: [],
  };
}

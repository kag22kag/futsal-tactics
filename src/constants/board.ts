import type { Ball, Frame, Player, PitchType } from "@/types/tactics";

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

// Nửa sân: đội đỏ tấn công khung thành bên trái, đội xanh phòng ngự.
// Power-play gồm 5 cầu thủ tấn công, đối diện 4 hậu vệ + 1 thủ môn.
const HALF_POSITIONS: Record<string, readonly [number, number]> = {
  "home-gk": [350, 200], "home-2": [300, 80], "home-7": [170, 55],
  "home-10": [170, 345], "home-9": [300, 320],
  "away-gk": [30, 200], "away-2": [115, 140], "away-7": [215, 125],
  "away-10": [215, 275], "away-9": [115, 260],
};

export function getPitchDimensions(pitchType: PitchType) {
  const width = pitchType === "half" ? 400 : PITCH_WIDTH;
  return { width, height: PITCH_HEIGHT, stageWidth: width + PADDING * 2, stageHeight: STAGE_HEIGHT };
}

// Sao chép dữ liệu để kéo thả không làm thay đổi hằng số mặc định.
export function createInitialFrame(pitchType: PitchType = "full"): Frame {
  return {
    id: "frame-1",
    players: INITIAL_PLAYERS.map((player) => {
      const point = pitchType === "half" ? HALF_POSITIONS[player.id] : undefined;
      return point ? {
        ...player, x: point[0], y: point[1],
        isGK: player.team === "away" && Boolean(player.isGK),
        name: player.id === "home-gk" ? "Chốt tấn công" : player.name,
      } : { ...player };
    }),
    ball: pitchType === "half" ? { x: 200, y: 200 } : { ...INITIAL_BALL },
    lines: [],
  };
}

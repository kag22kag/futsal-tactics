export type PitchType = "full" | "half";

export interface Player {
  id: string;
  x: number;
  y: number;
  team: "home" | "away";
  number: number;
  name: string;
  isGK?: boolean;
}

export interface Ball {
  x: number;
  y: number;
}

export type DrawingTool = "select" | "arrow" | "dashed-arrow" | "line";

export interface TacticalLine {
  id: string;
  points: number[];
  color: string;
  isDashed?: boolean;
  hasArrow?: boolean;
}

export interface Frame {
  id: string;
  players: Player[];
  ball: Ball;
  lines: TacticalLine[];
}

// Định dạng file JSON do ứng dụng xuất ra.
export interface TacticsDocument {
  format: "futsal-tactics";
  version: 2;
  pitchType: PitchType;
  currentFrameIndex: number;
  frames: Frame[];
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  pitchType: PitchType;
  frames: Frame[];
}

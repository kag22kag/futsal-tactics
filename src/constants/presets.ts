import { createInitialFrame } from "@/constants/board";
import type { Ball, Frame, TacticalLine } from "@/types/tactics";

type Position = readonly [number, number];
type Formation = readonly [Position, Position, Position, Position];
export interface PlaybookPreset {
  id: string;
  title: string;
  description: string;
  frames: Frame[];
}
const HOME_IDS = ["home-2", "home-7", "home-10", "home-9"] as const;

function frame(id: string, positions: Formation, ball: Ball, pressing = false): Frame {
  const base = createInitialFrame();
  const targets = new Map<string, Position>();
  HOME_IDS.forEach((key, index) => { const point = positions[index]; if (point) targets.set(key, point); });
  if (pressing) {
    targets.set("away-9", [250, 200]);
    targets.set("away-7", [310, 85]);
    targets.set("away-10", [310, 315]);
    targets.set("away-2", [520, 200]);
  }
  return {
    ...base, id, ball: { ...ball },
    players: base.players.map((player) => {
      const position = targets.get(player.id);
      return position ? { ...player, x: position[0], y: position[1] } : { ...player };
    }),
  };
}

// Mũi tên của mỗi frame chỉ chuyển động sang frame kế tiếp.
function withRoutes(frames: Frame[]): Frame[] {
  return frames.map((current, index) => {
    const next = frames[index + 1];
    if (!next) return current;
    const lines: TacticalLine[] = [];
    for (const player of current.players) {
      const end = next.players.find((candidate) => candidate.id === player.id);
      if (player.team === "home" && end && Math.hypot(end.x - player.x, end.y - player.y) > 5) {
        lines.push({ id: `${current.id}-${player.id}`, points: [player.x, player.y, end.x, end.y], color: "#FFFFFF", hasArrow: true });
      }
    }
    if (Math.hypot(next.ball.x - current.ball.x, next.ball.y - current.ball.y) > 5) {
      lines.push({ id: `${current.id}-pass`, points: [current.ball.x, current.ball.y, next.ball.x, next.ball.y], color: "#FDE047", isDashed: true, hasArrow: true });
    }
    return { ...current, lines };
  });
}

export const PLAYBOOK_PRESETS: readonly PlaybookPreset[] = [
  {
    id: "diamond", title: "Kim cương 1–2–1", description: "Giữ chiều rộng, chuyền ra biên rồi tìm pivot.",
    frames: withRoutes([
      frame("diamond-1", [[180, 200], [330, 80], [330, 320], [520, 200]], { x: 202, y: 200 }),
      frame("diamond-2", [[230, 200], [350, 80], [390, 320], [540, 200]], { x: 372, y: 80 }),
      frame("diamond-3", [[280, 200], [430, 90], [470, 300], [560, 200]], { x: 582, y: 200 }),
      frame("diamond-4", [[320, 200], [480, 90], [640, 275], [570, 180]], { x: 662, y: 275 }),
    ]),
  },
  {
    id: "pivot", title: "Thoát pressing 3–1", description: "Ba cầu thủ mở bóng, pivot làm tường cho người thứ ba.",
    frames: withRoutes([
      frame("pivot-1", [[150, 200], [180, 65], [180, 335], [460, 200]], { x: 172, y: 200 }, true),
      frame("pivot-2", [[190, 200], [290, 80], [220, 330], [440, 200]], { x: 418, y: 200 }, true),
      frame("pivot-3", [[230, 200], [350, 100], [300, 320], [470, 220]], { x: 372, y: 100 }, true),
      frame("pivot-4", [[290, 200], [540, 90], [390, 310], [550, 220]], { x: 562, y: 90 }, true),
    ]),
  },
  {
    id: "rotation", title: "Xoay compa 4–0", description: "Không cố định pivot; bốn cầu thủ hoán đổi vị trí liên tục.",
    frames: withRoutes([
      frame("rotation-1", [[230, 90], [370, 90], [230, 310], [370, 310]], { x: 252, y: 90 }),
      frame("rotation-2", [[370, 90], [370, 310], [230, 90], [230, 310]], { x: 392, y: 310 }),
      frame("rotation-3", [[370, 310], [230, 310], [370, 90], [230, 90]], { x: 252, y: 90 }),
      frame("rotation-4", [[230, 310], [230, 90], [370, 310], [370, 90]], { x: 392, y: 310 }),
      frame("rotation-5", [[230, 90], [370, 90], [230, 310], [370, 310]], { x: 252, y: 90 }),
    ]),
  },
];

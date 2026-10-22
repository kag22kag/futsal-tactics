import { createInitialFrame } from "@/constants/board";
import type { Ball, Frame, TacticalLine, Preset } from "@/types/tactics";

type Position = readonly [number, number];
type Formation = readonly [Position, Position, Position, Position];
export type PlaybookPreset = Preset;
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

const FULL_PRESETS: readonly PlaybookPreset[] = [
  {
    id: "diamond", pitchType: "full", title: "Kim cương 1–2–1", description: "Giữ chiều rộng, chuyền ra biên rồi tìm pivot.",
    frames: withRoutes([
      frame("diamond-1", [[180, 200], [330, 80], [330, 320], [520, 200]], { x: 202, y: 200 }),
      frame("diamond-2", [[230, 200], [350, 80], [390, 320], [540, 200]], { x: 372, y: 80 }),
      frame("diamond-3", [[280, 200], [430, 90], [470, 300], [560, 200]], { x: 582, y: 200 }),
      frame("diamond-4", [[320, 200], [480, 90], [640, 275], [570, 180]], { x: 662, y: 275 }),
    ]),
  },
  {
    id: "pivot", pitchType: "full", title: "Thoát pressing 3–1", description: "Ba cầu thủ mở bóng, pivot làm tường cho người thứ ba.",
    frames: withRoutes([
      frame("pivot-1", [[150, 200], [180, 65], [180, 335], [460, 200]], { x: 172, y: 200 }, true),
      frame("pivot-2", [[190, 200], [290, 80], [220, 330], [440, 200]], { x: 418, y: 200 }, true),
      frame("pivot-3", [[230, 200], [350, 100], [300, 320], [470, 220]], { x: 372, y: 100 }, true),
      frame("pivot-4", [[290, 200], [540, 90], [390, 310], [550, 220]], { x: 562, y: 90 }, true),
    ]),
  },
  {
    id: "rotation", pitchType: "full", title: "Xoay compa 4–0", description: "Không cố định pivot; bốn cầu thủ hoán đổi vị trí liên tục.",
    frames: withRoutes([
      frame("rotation-1", [[230, 90], [370, 90], [230, 310], [370, 310]], { x: 252, y: 90 }),
      frame("rotation-2", [[370, 90], [370, 310], [230, 90], [230, 310]], { x: 392, y: 310 }),
      frame("rotation-3", [[370, 310], [230, 310], [370, 90], [230, 90]], { x: 252, y: 90 }),
      frame("rotation-4", [[230, 310], [230, 90], [370, 310], [370, 90]], { x: 392, y: 310 }),
      frame("rotation-5", [[230, 90], [370, 90], [230, 310], [370, 310]], { x: 252, y: 90 }),
    ]),
  },
];

type HalfFormation = readonly [Position, Position, Position, Position, Position];
const HALF_IDS = ["home-gk", "home-2", "home-7", "home-10", "home-9"] as const;

function halfFrame(id: string, positions: HalfFormation, ball: Ball): Frame {
  const base = createInitialFrame("half");
  const targets = new Map<string, Position>();
  HALF_IDS.forEach((key, index) => { const point = positions[index]; if (point) targets.set(key, point); });
  return {
    ...base, id, ball: { ...ball },
    players: base.players.map((player) => {
      const point = targets.get(player.id);
      return point ? { ...player, x: point[0], y: point[1] } : { ...player };
    }),
  };
}

const HALF_PRESETS: readonly Preset[] = [
  {
    id: "half-power-play", pitchType: "half", title: "Power-play 5v4",
    description: "5 cầu thủ đỏ luân chuyển bóng trước 4 hậu vệ xanh và thủ môn. Tấn công về trái.",
    frames: withRoutes([
      halfFrame("power-1", [[350,200],[300,75],[170,45],[170,355],[300,325]], {x:330,y:200}),
      halfFrame("power-2", [[340,220],[290,65],[140,45],[180,350],[300,310]], {x:270,y:65}),
      halfFrame("power-3", [[330,220],[260,80],[90,65],[140,335],[290,290]], {x:110,y:65}),
      halfFrame("power-4", [[320,200],[250,100],[75,90],[80,300],[270,290]], {x:100,y:300}),
    ]),
  },
  {
    id: "half-corner", pitchType: "half", title: "Tổ hợp phạt góc",
    description: "Phạt góc trái, phối hợp ngắn và đưa bóng tới người băng vào cột xa.",
    frames: withRoutes([
      halfFrame("corner-1", [[355,200],[280,80],[25,25],[175,320],[230,200]], {x:10,y:10}),
      halfFrame("corner-2", [[350,210],[200,65],[50,35],[145,320],[220,210]], {x:180,y:65}),
      halfFrame("corner-3", [[340,220],[170,80],[100,50],[70,295],[230,230]], {x:90,y:295}),
    ]),
  },
  {
    id: "half-pressure", pitchType: "half", title: "Tổ chức ép sân",
    description: "Dồn đối thủ về khung thành, đổi cánh và đưa người vào khoảng trống.",
    frames: withRoutes([
      halfFrame("pressure-1", [[360,200],[310,90],[220,50],[220,350],[310,310]], {x:290,y:90}),
      halfFrame("pressure-2", [[340,200],[280,80],[180,60],[180,340],[280,320]], {x:260,y:320}),
      halfFrame("pressure-3", [[320,200],[240,100],[140,70],[120,320],[240,290]], {x:140,y:320}),
      halfFrame("pressure-4", [[300,200],[230,100],[80,100],[100,290],[210,270]], {x:100,y:100}),
    ]),
  },
];

export const PLAYBOOK_PRESETS: readonly Preset[] = [...FULL_PRESETS, ...HALF_PRESETS];

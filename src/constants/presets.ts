import { createInitialFrame } from "@/constants/board";
import type { Frame, PitchType, Preset, TacticalLine } from "@/types/tactics";

export type PlaybookPreset = Preset;
export const PRESET_FRAME_DURATION_MS = 500;

type Point = readonly [number, number];
type Four = readonly [Point, Point, Point, Point];
type Five = readonly [Point, Point, Point, Point, Point];

interface Step {
  attack: Five;
  defense: Four;
  ball: Point;
  keeper: Point;
}

const ATTACK_IDS = ["home-gk", "home-2", "home-7", "home-10", "home-9"] as const;
const DEFENSE_IDS = ["away-2", "away-7", "away-10", "away-9"] as const;

function full(attack: Four, defense: Four, ball: Point): Step {
  return { attack: [[60, 200], ...attack], defense, ball, keeper: [765, 200] };
}

function half(attack: Five, defense: Four, ball: Point): Step {
  return { attack, defense, ball, keeper: [30, 200] };
}

function createFrame(id: string, pitchType: PitchType, step: Step): Frame {
  const positions = new Map<string, Point>();
  ATTACK_IDS.forEach((playerId, index) => {
    const point = step.attack[index];
    if (point) positions.set(playerId, point);
  });
  DEFENSE_IDS.forEach((playerId, index) => {
    const point = step.defense[index];
    if (point) positions.set(playerId, point);
  });
  positions.set("away-gk", step.keeper);

  return {
    id,
    players: createInitialFrame(pitchType).players.map((player) => {
      const point = positions.get(player.id);
      return point ? { ...player, x: point[0], y: point[1] } : { ...player };
    }),
    ball: { x: step.ball[0], y: step.ball[1] },
    lines: [],
  };
}

// Mũi tên mô tả bước kế tiếp: trắng = chạy, xanh nhạt = dịch chuyển phòng ngự,
// vàng nét đứt = đường bóng. Frame cuối không còn mũi tên chuyển tiếp.
function addRoutes(frames: Frame[], showDefense: boolean): Frame[] {
  return frames.map((frame, index) => {
    const next = frames[index + 1];
    if (!next) return frame;
    const targets = new Map(next.players.map((player) => [player.id, player]));
    const lines: TacticalLine[] = [];
    for (const player of frame.players) {
      const target = targets.get(player.id);
      if (!target || player.isGK || (player.team === "away" && !showDefense)) continue;
      if (Math.hypot(target.x - player.x, target.y - player.y) < 5) continue;
      lines.push({
        id: `${frame.id}-${player.id}`, points: [player.x, player.y, target.x, target.y],
        color: player.team === "home" ? "#FFFFFF" : "#7DD3FC", hasArrow: true,
      });
    }
    if (Math.hypot(next.ball.x - frame.ball.x, next.ball.y - frame.ball.y) >= 5) {
      lines.push({
        id: `${frame.id}-ball`, points: [frame.ball.x, frame.ball.y, next.ball.x, next.ball.y],
        color: "#FDE047", isDashed: true, hasArrow: true,
      });
    }
    return { ...frame, lines };
  });
}

function makePreset(
  id: string, pitchType: PitchType, title: string, description: string,
  steps: readonly Step[], showDefense = false,
): Preset {
  return {
    id, pitchType, title, description,
    frames: addRoutes(steps.map((step, index) => createFrame(`${id}-${index + 1}`, pitchType, step)), showDefense),
  };
}

// 1. Xoay compa 4-0: lấy 6 điểm liên tiếp trên một cung elip.
// Bốn cầu thủ đổi chỗ một phần tư vòng, không chạy cắt xuyên nhau ở trung tâm.
function rotationSteps(): Step[] {
  const phases = [Math.PI, Math.PI * 1.5, Math.PI * 0.5, 0] as const;
  return Array.from({ length: 6 }, (_, index) => {
    const pointAt = (phase: number): Point => [
      Math.round(380 + 140 * Math.cos(phase + index * Math.PI / 10)),
      Math.round(200 + 115 * Math.sin(phase + index * Math.PI / 10)),
    ];
    const attack: Four = [pointAt(phases[0]), pointAt(phases[1]), pointAt(phases[2]), pointAt(phases[3])];
    // Luân chuyển bóng từ Fixo sang Ala rồi Pivot qua các điểm trung gian.
    const balls: readonly Point[] = [[262,200],[290,155],[360,120],[425,150],[500,210],[500,270]];
    return full(attack, [[620,200],[540,100+index*6],[540,300-index*6],[570,200+index*4]], balls[index] ?? [500,270]);
  });
}

const FULL_PRESETS: readonly Preset[] = [
  makePreset("rotation", "full", "Xoay Compa 4-0 (Total Rotation)",
    "6 frame: bốn cầu thủ xoay vòng, kéo giãn hàng thủ. Đội đỏ tấn công sang phải.", rotationSteps()),

  // 2. Thoát pressing: Fixo chuyền ra Ala; Ala đâm bóng vào Pivot cài lưng.
  makePreset("pivot", "full", "Thoát Pressing 3-1 Pivot",
    "6 frame: Fixo → Ala → Pivot, phối hợp vượt tuyến áp sát.", [
      full([[220,200],[330,90],[330,310],[500,175]], [[550,180],[380,110],[380,300],[280,205]], [240,200]),
      full([[240,205],[345,85],[345,305],[510,170]], [[560,180],[395,105],[395,295],[300,200]], [290,145]),
      full([[260,210],[365,85],[365,300],[520,165]], [[570,175],[415,100],[415,290],[320,190]], [385,85]),
      full([[285,215],[390,90],[390,295],[535,160]], [[585,175],[440,110],[435,285],[340,175]], [445,115]),
      full([[310,210],[420,100],[420,290],[555,160]], [[605,175],[460,125],[460,280],[360,160]], [515,145]),
      full([[335,200],[450,115],[450,280],[575,160]], [[625,175],[480,140],[485,270],[385,155]], [555,160]),
    ]),

  // 3. Phản công 3v2: ba người tăng tốc, hai hậu vệ lùi; hai đối thủ khác ở phía sau.
  // Frame cuối đưa bóng sát góc xa khung thành phải, vẫn nằm trong biên hợp lệ.
  makePreset("counter-3v2", "full", "Phản công nhanh 3v2 (Overload Counter)",
    "5 frame: chuyển trạng thái, tạo thế hơn người rồi dứt điểm góc xa.", [
      full([[290,210],[400,95],[410,305],[440,195]], [[570,150],[580,255],[255,320],[250,100]], [460,195]),
      full([[330,210],[465,85],[475,310],[505,190]], [[610,145],[620,250],[290,310],[285,110]], [525,190]),
      full([[370,210],[535,90],[545,300],[570,175]], [[650,145],[660,245],[330,300],[325,120]], [590,175]),
      full([[410,210],[605,105],[620,280],[640,160]], [[690,155],[700,235],[370,290],[365,130]], [660,155]),
      full([[450,210],[665,120],[690,250],[700,155]], [[725,175],[735,240],[410,280],[405,140]], [790,222]),
    ]),

  // 4. Chồng cánh: Ala nhả bóng, Fixo vòng ra ngoài rồi căng ngang tới cột hai.
  makePreset("overlap-wall-pass", "full", "Chồng cánh 1-2 Biên (Overlap & Wall Pass)",
    "5 frame: bật tường Ala–Fixo, chồng biên và đưa bóng chìm tới cột hai.", [
      full([[350,120],[450,80],[560,300],[580,180]], [[620,180],[500,120],[615,280],[490,220]], [430,80]),
      full([[405,65],[470,90],[590,285],[600,180]], [[640,175],[520,115],[635,270],[515,210]], [425,65]),
      full([[480,45],[500,100],[620,265],[620,180]], [[660,170],[550,105],[655,260],[540,205]], [520,100]),
      full([[560,50],[535,115],[655,240],[645,180]], [[685,165],[585,100],[680,245],[570,200]], [580,50]),
      full([[610,75],[565,130],[700,220],[670,175]], [[715,165],[615,110],[720,265],[600,195]], [720,220]),
    ]),
];

const HALF_PRESETS: readonly Preset[] = [
  // 5. Power-play chữ Y: năm người tấn công; đối phương có bốn hậu vệ + một GK.
  // Bóng đi từ chốt sau sang biên rồi vào trung lộ; hàng thủ co về khung thành trái.
  makePreset("half-power-play", "half", "Power-play 5v4 (Mô hình Chữ Y)",
    "7 frame: mở hai biên, hút hàng thủ rồi đưa bóng vào trung lộ dứt điểm.", [
      half([[350,200],[295,90],[170,55],[170,345],[295,310]], [[105,145],[210,125],[210,275],[105,255]], [330,200]),
      half([[340,190],[290,85],[165,60],[175,340],[295,305]], [[100,140],[200,115],[205,265],[100,250]], [310,130]),
      half([[330,185],[280,85],[155,65],[175,330],[285,300]], [[95,135],[185,105],[195,250],[95,245]], [260,85]),
      half([[320,190],[265,95],[145,80],[165,320],[270,285]], [[90,140],[170,115],[180,240],[90,250]], [200,90]),
      half([[310,200],[250,115],[135,100],[150,305],[250,265]], [[85,150],[155,135],[165,235],[85,255]], [220,165]),
      half([[300,205],[230,135],[120,110],[130,290],[220,240]], [[80,160],[140,155],[150,230],[80,250]], [190,215]),
      half([[290,210],[215,145],[100,120],[110,275],[185,220]], [[75,165],[125,170],[135,235],[75,250]], [10,220]),
    ]),

  // 6. Phạt góc tuyến hai: người ở gần cột một chạy hút; bóng trả ra cho người sút xa.
  makePreset("half-corner", "half", "Phạt góc – Chuyền Tuyến 2 (Corner Set-piece)",
    "5 frame: làm tường giả, trả bóng về tuyến hai và sút xa.", [
      half([[350,220],[255,140],[25,25],[160,310],[120,100]], [[95,140],[195,135],[185,265],[95,260]], [10,10]),
      half([[345,215],[250,145],[50,35],[150,300],[95,115]], [[85,135],[180,125],[175,255],[90,255]], [100,55]),
      half([[335,210],[240,150],[90,50],[135,290],[65,140]], [[75,145],[165,130],[165,245],[85,250]], [210,90]),
      half([[325,205],[230,160],[120,65],[120,280],[60,170]], [[75,160],[150,155],[155,235],[80,245]], [210,160]),
      half([[315,200],[210,170],[140,85],[105,270],[65,195]], [[75,175],[140,175],[145,230],[80,245]], [10,185]),
    ]),

  // 7. Đá biên cột hai: giả sút, chọc khe phía sau hậu vệ; người cánh xa đâm vào.
  makePreset("half-kick-in", "half", "Đá biên Cắt nách Cột 2 (Kick-in Backdoor)",
    "5 frame: giả sút biên rồi chọc khe để người cột hai đệm bóng.", [
      half([[350,210],[255,100],[200,25],[170,320],[265,270]], [[100,145],[205,130],[205,270],[100,255]], [200,10]),
      half([[340,205],[250,115],[195,40],[145,300],[245,265]], [[95,140],[195,120],[195,260],[95,250]], [200,65]),
      half([[330,200],[245,140],[180,60],[115,275],[225,250]], [[90,145],[180,135],[180,245],[90,245]], [225,140]),
      half([[320,195],[230,155],[165,80],[85,250],[205,230]], [[85,160],[165,150],[165,230],[85,240]], [145,200]),
      half([[310,190],[215,165],[150,95],[55,225],[185,220]], [[85,175],[150,170],[150,225],[80,265]], [35,225]),
    ]),

  // 8. Khối thấp: bốn cầu thủ xanh dịch chuyển đồng bộ theo bóng, giữ cự ly hai hàng.
  // Mũi tên xanh nhạt giúp theo dõi đội phòng ngự, không chỉ đội cầm bóng.
  makePreset("half-low-block", "half", "Phòng ngự Khối thấp Nửa sân (Low Block Defense)",
    "6 frame: khối phòng ngự xanh tịnh tiến theo bóng, giữ kín trung lộ.", [
      half([[350,200],[290,80],[170,60],[170,340],[290,320]], [[100,115],[205,105],[205,235],[100,245]], [270,80]),
      half([[345,195],[300,100],[180,70],[180,335],[295,310]], [[105,125],[210,115],[210,245],[105,255]], [320,125]),
      half([[340,200],[305,125],[185,85],[185,320],[300,290]], [[110,140],[215,130],[215,260],[110,270]], [320,200]),
      half([[335,205],[300,140],[180,95],[180,315],[290,300]], [[105,155],[210,145],[210,275],[105,285]], [290,280]),
      half([[330,210],[290,145],[170,100],[165,320],[265,305]], [[100,165],[205,155],[205,285],[100,295]], [225,320]),
      half([[325,205],[275,140],[155,105],[150,300],[240,285]], [[95,150],[200,140],[200,270],[95,280]], [170,270]),
    ], true),
];

export const PLAYBOOK_PRESETS: readonly PlaybookPreset[] = [...FULL_PRESETS, ...HALF_PRESETS];

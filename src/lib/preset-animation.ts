import type { Frame } from "@/types/tactics";
import { clamp, interpolateFrame } from "@/lib/tactics";

// Tiếp tuyến bằng 0 khi đổi chiều; nếu cùng chiều dùng trung bình điều hòa.
// Cách này giữ tọa độ trong khoảng hai keyframe, tránh đường cong vượt biên sân.
function tangent(left: number, right: number): number {
  if (left * right <= 0) return 0;
  return (2 * left * right) / (left + right);
}

function smoothCoordinate(previous: number, from: number, to: number, next: number, t: number): number {
  const delta = to - from;
  const start = tangent(from - previous, delta);
  const end = tangent(delta, next - to);
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * from
    + (t3 - 2 * t2 + t) * start
    + (-2 * t3 + 3 * t2) * to
    + (t3 - t2) * end;
}

export function interpolatePresetFrame(
  previous: Frame, from: Frame, to: Frame, next: Frame, progress: number,
): Frame {
  const t = clamp(progress, 0, 1);
  // Bóng giữ nội suy tuyến tính để mô tả đường chuyền/sút thẳng.
  const result = interpolateFrame(from, to, t);
  const previousPlayers = new Map(previous.players.map((player) => [player.id, player]));
  const targets = new Map(to.players.map((player) => [player.id, player]));
  const nextPlayers = new Map(next.players.map((player) => [player.id, player]));
  return {
    ...result,
    players: from.players.map((player) => {
      const target = targets.get(player.id) ?? player;
      const before = previousPlayers.get(player.id) ?? player;
      const after = nextPlayers.get(player.id) ?? target;
      return {
        ...player,
        x: smoothCoordinate(before.x, player.x, target.x, after.x, t),
        y: smoothCoordinate(before.y, player.y, target.y, after.y, t),
      };
    }),
  };
}

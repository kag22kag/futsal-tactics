import type { Frame, PitchType } from "@/types/tactics";

// SVG thu nhỏ dùng chung; không tạo thêm Konva Stage cho mỗi thẻ.
export default function FrameMiniature({ frame, pitchType }: { frame: Frame; pitchType: PitchType }) {
  const width = pitchType === "full" ? 800 : 400;
  return <svg viewBox={`-15 -15 ${width + 30} 430`} className="h-full w-full" aria-hidden="true">
    <rect x="0" y="0" width={width} height="400" rx="4" fill="#064e3b" stroke="#6ee7b7" strokeOpacity="0.4" strokeWidth="4" />
    <path d={`M${width === 800 ? 400 : 398} 0V400 M0 110H100V290H0 ${width === 800 ? "M800 110H700V290H800" : ""}`} fill="none" stroke="#6ee7b7" strokeOpacity="0.3" strokeWidth="4" />
    {width === 800 && <circle cx="400" cy="200" r="60" fill="none" stroke="#6ee7b7" strokeOpacity="0.3" strokeWidth="4" />}
    {frame.lines.map(line => <polyline key={line.id} points={line.points.join(" ")} fill="none" stroke={line.color} strokeWidth="6" opacity="0.7" strokeDasharray={line.isDashed ? "12 10" : undefined} />)}
    {frame.players.map(player => <circle key={player.id} cx={player.x} cy={player.y} r="15" fill={player.isGK ? "#facc15" : player.team === "home" ? "#f87171" : "#60a5fa"} stroke="#0f172a" strokeWidth="3" />)}
    <circle cx={frame.ball.x} cy={frame.ball.y} r="9" fill="white" />
  </svg>;
}

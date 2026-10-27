"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Arrow, Circle, Group, Layer, Line, Rect, Stage } from "react-konva";

import Header from "@/components/Header";
import { ChevronDown, ChevronUp, Film } from "lucide-react";

import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";

import type { Ball, DrawingTool, Frame, TacticalLine, PitchType, SavedTactic } from "@/types/tactics";
import { useAccount } from "@/context/AccountContext";
import AuthModal from "@/components/auth/AuthModal";
import UserProfileModal from "@/components/auth/UserProfileModal";
import MyTacticsModal from "./MyTacticsModal";

import {
  BALL_RADIUS,
  MAX_FRAMES,
  MAX_JSON_BYTES,
  MAX_LINES,
  PADDING,
  PITCH_HEIGHT,
  getPitchDimensions,
  STAGE_HEIGHT,
  createInitialFrame,
} from "@/constants/board";

import {
  clamp,
  cloneFrame,
  downloadJson,
  downloadUrl,
  interpolateFrame,
  parseTacticsJson,
} from "@/lib/tactics";

import FutsalPitch from "./FutsalPitch";
import FrameTimeline from "./FrameTimeline";
import PlayerToken from "./PlayerToken";
import Toolbar from "./Toolbar";
import PitchSelectorModal from "./PitchSelectorModal";
import PlaybookPresets from "./PlaybookPresets";
import { PRESET_FRAME_DURATION_MS, type PlaybookPreset } from "@/constants/presets";
import { interpolatePresetFrame } from "@/lib/preset-animation";
import { useBoardScale } from "@/hooks/useBoardScale";

type DrawingEvent = KonvaEventObject<MouseEvent | TouchEvent>;

interface Point {
  x: number;
  y: number;
}

const MIN_LINE_LENGTH = 5;
const TRANSITION_DURATION_MS = 1000;

const TOOL_HINTS: Record<DrawingTool, string> = {
  select: "Kéo cầu thủ hoặc bóng để điều chỉnh vị trí.",
  arrow: "Giữ và kéo chuột để vẽ mũi tên chạy chỗ.",
  "dashed-arrow": "Giữ và kéo chuột để vẽ đường chuyền nét đứt.",
  line: "Giữ và kéo chuột để vẽ đường thẳng.",
};


function getPitchPoint(event: DrawingEvent): Point | null {
  const stage = event.target.getStage();
  const pointer = stage?.getPointerPosition();

  if (!pointer || !stage) {
    return null;
  }

  return {
    x: pointer.x / stage.scaleX() - PADDING,
    y: pointer.y / stage.scaleY() - PADDING,
  };
}

function isInsidePitch(point: Point, pitchWidth: number): boolean {
  return (
    point.x >= 0 &&
    point.x <= pitchWidth &&
    point.y >= 0 &&
    point.y <= PITCH_HEIGHT
  );
}

function updateLineEnd(line: TacticalLine, point: Point, pitchWidth: number): TacticalLine {
  const [startX, startY] = line.points;

  if (startX === undefined || startY === undefined) {
    return line;
  }

  return {
    ...line,
    points: [
      startX,
      startY,
      clamp(point.x, 0, pitchWidth),
      clamp(point.y, 0, PITCH_HEIGHT),
    ],
  };
}

function hasValidLength(line: TacticalLine): boolean {
  const [x1, y1, x2, y2] = line.points;

  if (
    x1 === undefined ||
    y1 === undefined ||
    x2 === undefined ||
    y2 === undefined
  ) {
    return false;
  }

  return Math.hypot(x2 - x1, y2 - y1) >= MIN_LINE_LENGTH;
}

function TacticalShape({
  line,
  isPreview = false,
}: {
  line: TacticalLine;
  isPreview?: boolean;
}) {
  const props = {
    points: line.points,
    stroke: line.color,
    strokeWidth: 3,
    dash: line.isDashed ? [10, 7] : [],
    lineCap: "round" as const,
    lineJoin: "round" as const,
    opacity: isPreview ? 0.65 : 1,
    listening: false,
  };

  return line.hasArrow ? (
    <Arrow {...props} fill={line.color} pointerLength={12} pointerWidth={10} />
  ) : (
    <Line {...props} />
  );
}

export default function TacticalBoardCanvas() {
  const account = useAccount();
  const [activeDialog, setActiveDialog] = useState<"auth" | "profile" | "tactics" | null>(null);
  const [pitchType, setPitchType] = useState<PitchType>("full");
  const [hasChosenPitch, setHasChosenPitch] = useState(false);
  const [showPitchSelector, setShowPitchSelector] = useState(true);
  const { width: pitchWidth, stageWidth } = getPitchDimensions(pitchType);
  const { containerRef, scale } = useBoardScale(stageWidth);
  // Toàn bộ dữ liệu chỉnh sửa nằm trong frames.
  const [frames, setFrames] = useState<Frame[]>(() => [createInitialFrame(pitchType)]);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [drawingColor, setDrawingColor] = useState("#FFFFFF");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [showFrameBar, setShowFrameBar] = useState(true);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");

  const [preview, setPreview] = useState<TacticalLine | null>(null);
  const draftRef = useRef<TacticalLine | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const transitionDuration = activePreset === null ? TRANSITION_DURATION_MS : PRESET_FRAME_DURATION_MS;

  // Ví dụ 1.5 = đang ở giữa Frame 2 và Frame 3.
  // null = đang chỉnh sửa, không xem hoạt cảnh.
  const [playbackPosition, setPlaybackPosition] = useState<number | null>(null);

  const playbackPositionRef = useRef<number | null>(null);
  const animationRequestRef = useRef<number | null>(null);
  const stageRef = useRef<KonvaStage | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");

  const isPreviewing = playbackPosition !== null;
  const editingLocked = isPreviewing || isImporting || showPitchSelector || activeDialog !== null;
  const canDrag = !editingLocked && activeTool === "select";

  // Frame luôn tồn tại vì không cho xóa frame cuối cùng.
  const currentFrame =
    frames[currentFrameIndex] ?? frames[0] ?? createInitialFrame(pitchType);

  const visibleFrameIndex =
    playbackPosition === null
      ? currentFrameIndex
      : Math.min(Math.floor(playbackPosition), frames.length - 1);

  let displayFrame = currentFrame;

  if (playbackPosition !== null) {
    const from = frames[visibleFrameIndex] ?? currentFrame;
    const to = frames[visibleFrameIndex + 1] ?? from;

    const progress = playbackPosition - visibleFrameIndex;
    displayFrame = activePreset === null
      ? interpolateFrame(from, to, progress)
      : interpolatePresetFrame(
          frames[visibleFrameIndex - 1] ?? from,
          from, to,
          frames[visibleFrameIndex + 2] ?? to,
          progress,
        );
  }

  // ---------- Animation ----------

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let requestId = 0;
    let previousTime: number | null = null;
    let position = playbackPositionRef.current ?? 0;

    const lastIndex = frames.length - 1;

    function tick(timestamp: number) {
      if (playbackPositionRef.current === null) return;
      if (previousTime === null) {
        previousTime = timestamp;
      }

      // Giới hạn khoảng nhảy khi quay lại tab sau thời gian dài.
      const elapsed = Math.min(timestamp - previousTime, 100);
      previousTime = timestamp;

      position += (elapsed * speed) / transitionDuration;

      if (position >= lastIndex) {
        playbackPositionRef.current = null;
        setPlaybackPosition(null);
        setCurrentFrameIndex(lastIndex);
        setIsPlaying(false);
        return;
      }

      playbackPositionRef.current = position;
      setPlaybackPosition(position);

      requestId = window.requestAnimationFrame(tick);
      animationRequestRef.current = requestId;
    }

    requestId = window.requestAnimationFrame(tick);
      animationRequestRef.current = requestId;

    // Hủy vòng lặp khi Pause, đổi tốc độ hoặc component bị gỡ.
    return () => {
      window.cancelAnimationFrame(requestId);
      animationRequestRef.current = null;
    };
  }, [isPlaying, speed, frames.length, transitionDuration]);

  function setDraft(line: TacticalLine | null) {
    draftRef.current = line;
    setPreview(line);
  }

  function cancelDrawing() {
    setDraft(null);
  }

  function stopPlayback() {
    // Hủy ngay callback đang chờ, tránh frame cũ ghi đè sau khi làm mới.
    if (animationRequestRef.current !== null) {
      window.cancelAnimationFrame(animationRequestRef.current);
      animationRequestRef.current = null;
    }
    setIsPlaying(false);
    playbackPositionRef.current = null;
    setPlaybackPosition(null);
  }

  function togglePlayback() {
    if (isImporting || frames.length < 2) {
      return;
    }

    cancelDrawing();

    if (isPlaying) {
      // Giữ playbackPosition để Pause không làm nhảy vị trí.
      setIsPlaying(false);
      return;
    }

    if (playbackPositionRef.current === null) {
      playbackPositionRef.current = 0;
      setPlaybackPosition(0);
      setCurrentFrameIndex(0);
    }

    setIsPlaying(true);
  }

  // ---------- Quản lý frame ----------

  function loadPreset(preset: PlaybookPreset) {
    if (isImporting || preset.pitchType !== pitchType) return;
    stopPlayback();
    cancelDrawing();
    // Sao chép sâu để sửa bài không làm thay đổi thư viện mẫu.
    setFrames(preset.frames.map((frame) => cloneFrame(frame, crypto.randomUUID())));
    setCurrentFrameIndex(0);
    setActiveTool("select");
    setActivePreset(preset.id);
    setMobileLibraryOpen(false);
    setSpeed(1);
    setMessage(`Đã nạp ${preset.title}. Bấm Play để xem chuyển động.`);
  }

  function choosePitch(nextPitchType: PitchType) {
    if (isImporting) return;
    if (hasChosenPitch && nextPitchType === pitchType) {
      setShowPitchSelector(false);
      return;
    }
    if (hasChosenPitch && !window.confirm(
      "Đổi loại sân sẽ xóa các frame và tạo bài mới. Chọn Hủy để quay lại lưu JSON trước.",
    )) return;
    stopPlayback();
    cancelDrawing();
    setPitchType(nextPitchType);
    setFrames([createInitialFrame(nextPitchType)]);
    setCurrentFrameIndex(0);
    setActivePreset(null);
    setActiveTool("select");
    setSpeed(1);
    setHasChosenPitch(true);
    setShowPitchSelector(false);
    setMessage(`Đã mở sân Futsal ${nextPitchType === "full" ? "Full" : "Half"}.`);
  }

  function selectFrame(index: number) {
    if (isImporting || index < 0 || index >= frames.length) {
      return;
    }

    stopPlayback();
    cancelDrawing();
    setCurrentFrameIndex(index);
    setMessage("");
  }

  function editCurrentFrame(update: (frame: Frame) => Frame) {
    if (editingLocked) {
      return;
    }

    setFrames((currentFrames) =>
      currentFrames.map((frame, index) =>
        index === currentFrameIndex ? update(frame) : frame,
      ),
    );
  }

  function addFrame() {
    if (editingLocked || frames.length >= MAX_FRAMES) {
      return;
    }

    cancelDrawing();

    const nextFrame = cloneFrame(currentFrame, crypto.randomUUID());

    // Chèn ngay sau frame đang chọn.
    setFrames((currentFrames) => [
      ...currentFrames.slice(0, currentFrameIndex + 1),
      nextFrame,
      ...currentFrames.slice(currentFrameIndex + 1),
    ]);

    setCurrentFrameIndex(currentFrameIndex + 1);
  }

  function deleteFrame() {
    if (editingLocked || frames.length <= 1) {
      return;
    }

    cancelDrawing();

    setFrames((currentFrames) =>
      currentFrames.filter((_, index) => index !== currentFrameIndex),
    );

    setCurrentFrameIndex(Math.min(currentFrameIndex, frames.length - 2));
  }

  // ---------- Công cụ vẽ ----------

  function changeTool(tool: DrawingTool) {
    if (editingLocked) {
      return;
    }

    cancelDrawing();
    setActiveTool(tool);
  }

  function handleDrawingStart(event: DrawingEvent) {
    if ("touches" in event.evt && event.evt.touches.length !== 1) {
      cancelDrawing();
      return;
    }
    if (editingLocked || activeTool === "select") {
      return;
    }

    if ("button" in event.evt && event.evt.button !== 0) {
      return;
    }

    if ("touches" in event.evt && event.evt.touches.length !== 1) {
      cancelDrawing();
      return;
    }

    if (currentFrame.lines.length >= MAX_LINES) {
      setMessage(`Mỗi frame được chứa tối đa ${MAX_LINES} nét vẽ.`);
      return;
    }

    const point = getPitchPoint(event);

    if (!point || !isInsidePitch(point, pitchWidth)) {
      return;
    }

    if (event.evt.cancelable) {
      event.evt.preventDefault();
    }

    setDraft({
      id: crypto.randomUUID(),
      points: [point.x, point.y, point.x, point.y],
      color: drawingColor,
      isDashed: activeTool === "dashed-arrow",
      hasArrow: activeTool !== "line",
    });
  }

  function handleDrawingMove(event: DrawingEvent) {
    if ("touches" in event.evt && event.evt.touches.length !== 1) {
      cancelDrawing();
      return;
    }
    const draft = draftRef.current;

    if (!draft || editingLocked) {
      return;
    }

    if ("buttons" in event.evt && (event.evt.buttons & 1) === 0) {
      cancelDrawing();
      return;
    }

    const point = getPitchPoint(event);

    if (!point) {
      return;
    }

    if (event.evt.cancelable) {
      event.evt.preventDefault();
    }

    setDraft(updateLineEnd(draft, point, pitchWidth));
  }

  function handleDrawingEnd(event: DrawingEvent) {
    const draft = draftRef.current;

    if (!draft || editingLocked) {
      return;
    }

    const point = getPitchPoint(event);
    const completedLine = point ? updateLineEnd(draft, point, pitchWidth) : draft;

    if (hasValidLength(completedLine)) {
      editCurrentFrame((frame) => ({
        ...frame,
        lines: [...frame.lines, completedLine],
      }));
    }

    cancelDrawing();
  }

  function undoLine() {
    cancelDrawing();

    editCurrentFrame((frame) => ({
      ...frame,
      lines: frame.lines.slice(0, -1),
    }));
  }

  function clearAllLines() {
    cancelDrawing();

    editCurrentFrame((frame) => ({
      ...frame,
      lines: [],
    }));
  }

  function handleFullReset() {
    if (isImporting) return;

    const confirmed = window.confirm(
      "Tạo bài đánh mới? Toàn bộ frame và nét vẽ hiện tại sẽ bị xóa. " +
      "Nếu muốn giữ bài cũ, hãy chọn Hủy rồi lưu file JSON trước.",
    );
    if (!confirmed) return;

    stopPlayback();
    cancelDrawing();
    setFrames([createInitialFrame(pitchType)]);
    setCurrentFrameIndex(0);
    setActivePreset(null);
    setActiveTool("select");
    setSpeed(1);
    setMessage("Đã tạo bài đánh mới: 1 frame, đội hình mặc định và bóng giữa sân.");
  }

  // ---------- Kéo thả ----------

  function updatePlayerPosition(id: string, x: number, y: number) {
    editCurrentFrame((frame) => ({
      ...frame,
      players: frame.players.map((player) =>
        player.id === id ? { ...player, x, y } : player,
      ),
    }));
  }

  function keepBallInsidePitch(event: KonvaEventObject<DragEvent>): Ball {
    const node = event.target;

    const position: Ball = {
      x: clamp(node.x(), BALL_RADIUS, pitchWidth - BALL_RADIUS),
      y: clamp(node.y(), BALL_RADIUS, PITCH_HEIGHT - BALL_RADIUS),
    };

    node.position(position);
    return position;
  }

  function handleBallDragEnd(event: KonvaEventObject<DragEvent>) {
    const position = keepBallInsidePitch(event);

    editCurrentFrame((frame) => ({
      ...frame,
      ball: position,
    }));
  }

  // ---------- Xuất và nhập ----------

  function exportPng() {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    try {
      // Vẽ đồng bộ trước khi chụp canvas.
      stage.draw();

      const url = stage.toDataURL({
        // Xuất ảnh gấp đôi kích thước gốc: Full 1760 × 960, Half 960 × 960.
        pixelRatio: 2 / stage.scaleX(),
        mimeType: "image/png",
      });

      downloadUrl(url, `sa-ban-frame-${visibleFrameIndex + 1}.png`);
      setMessage("Đã tạo ảnh PNG để tải xuống.");
    } catch {
      setMessage("Không xuất được PNG. Hãy thử tải lại trang.");
    }
  }

  function exportJson() {
    downloadJson({
      format: "futsal-tactics",
      version: 2,
      pitchType,
      currentFrameIndex: visibleFrameIndex,
      frames,
    });

    setMessage("Đã tạo file JSON chứa toàn bộ các frame.");
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    // Cho phép chọn lại cùng một file trong lần tiếp theo.
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_JSON_BYTES) {
      setMessage("File JSON quá lớn. Giới hạn là 5 MB.");
      return;
    }

    setIsImporting(true);
    setMessage("");

    try {
      const document = parseTacticsJson(await file.text());

      // Chỉ thay bài đánh sau khi toàn bộ dữ liệu đã hợp lệ.
      stopPlayback();
      cancelDrawing();

      setPitchType(document.pitchType);
      setHasChosenPitch(true);
      setShowPitchSelector(false);
      setFrames(document.frames);
      setActivePreset(null);
      setSpeed(1);
      setCurrentFrameIndex(document.currentFrameIndex);
      setActiveTool("select");

      setMessage(`Đã mở bài đánh gồm ${document.frames.length} frame.`);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Không đọc được file JSON.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  function openAccountDialog(dialog: "auth" | "profile" | "tactics") {
    if (showPitchSelector || isImporting) return;
    stopPlayback();
    cancelDrawing();
    setActiveDialog(dialog);
  }

  function saveCurrentTactic(title: string) {
    if (isImporting || showPitchSelector || draftRef.current) throw new Error("Hãy hoàn tất thao tác trước khi lưu.");
    account.saveTactic(title, pitchType, frames);
    setMessage(`Đã lưu bài đánh «${title.trim()}» vào kho cá nhân.`);
  }

  function loadMyTactic(tactic: SavedTactic) {
    if (isImporting || !account.user || tactic.userId !== account.user.id) throw new Error("Bạn không thể nạp bài đánh này.");
    if (!window.confirm("Nạp bài này sẽ thay thế các frame đang vẽ. Tiếp tục?")) return;
    const parsed = parseTacticsJson(JSON.stringify({
      format: "futsal-tactics", version: 2, pitchType: tactic.pitchType,
      currentFrameIndex: 0, frames: tactic.frames,
    }));
    stopPlayback();
    cancelDrawing();
    setFrames(parsed.frames.map(frame => cloneFrame(frame, frame.id)));
    setPitchType(parsed.pitchType);
    setHasChosenPitch(true);
    setShowPitchSelector(false);
    setCurrentFrameIndex(0);
    setActivePreset(null);
    setActiveTool("select");
    setSpeed(1);
    setActiveDialog(null);
    setMessage(`Đã nạp «${tactic.title}» vào sa bàn.`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PitchSelectorModal open={showPitchSelector} currentPitchType={pitchType}
        canDismiss={hasChosenPitch} onSelect={choosePitch} onClose={() => setShowPitchSelector(false)} />
      <AuthModal open={activeDialog === "auth"} onClose={() => setActiveDialog(null)} />
      <UserProfileModal key={account.user?.id ?? "guest"} open={activeDialog === "profile"} onClose={() => setActiveDialog(null)} />
      <MyTacticsModal open={activeDialog === "tactics"} onClose={() => setActiveDialog(null)}
        onSave={saveCurrentTactic} onLoad={loadMyTactic} onRequireAuth={() => openAccountDialog("auth")} />
      <Header pitchType={pitchType} onPitchChange={choosePitch}
        disabled={isImporting || preview !== null || showPitchSelector}
        importDisabled={isPlaying || isImporting || preview !== null || showPitchSelector}
        resetDisabled={isImporting || showPitchSelector}
        onExportPng={exportPng} onExportJson={exportJson}
        onImportJson={() => fileInputRef.current?.click()} onReset={handleFullReset}
        onOpenLibrary={() => setMobileLibraryOpen(true)}
        user={account.user} onOpenAuth={() => openAccountDialog("auth")}
        onOpenTactics={() => openAccountDialog("tactics")}
        onOpenProfile={() => openAccountDialog("profile")}
        onLogout={() => { account.signOut(); setMessage("Đã đăng xuất."); }} />
      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" aria-label="Mở file chiến thuật JSON" onChange={importJson} />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label="Sa bàn chiến thuật">
          <div className="workspace-grid flex min-h-0 flex-1 flex-col">
            <div className="workspace-heading flex h-12 shrink-0 items-center justify-between gap-3 px-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-widest text-slate-500"><span className={`size-1.5 rounded-full ${isPlaying ? "bg-emerald-400" : "bg-slate-500"}`} /> {isPlaying ? "ANIMATION LIVE" : "TACTICAL WORKSPACE"}</div>
              <span className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono text-[10px] text-slate-400">{pitchType === "full" ? "FULL COURT · 40 × 20 M" : "HALF COURT · 20 × 20 M"}</span>
            </div>
            <div className="relative min-h-0 flex-1">
              <Toolbar activeTool={activeTool} color={drawingColor} onColorChange={color => { cancelDrawing(); setDrawingColor(color); }}
                canUndo={currentFrame.lines.length > 0} onToolChange={changeTool}
                onUndo={undoLine} onClearAll={clearAllLines} disabled={editingLocked} />
              <div className="canvas-space touch-none">
                <div ref={containerRef} className="stage-fit touch-none" aria-label="Sa bàn tương tác">
                  <div className="shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-800 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
                    style={{ width: stageWidth * scale, height: STAGE_HEIGHT * scale, touchAction: "none", cursor: editingLocked || activeTool === "select" ? "default" : "crosshair" }}>
          <Stage
            ref={stageRef}
            width={stageWidth * scale}
            height={STAGE_HEIGHT * scale}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={handleDrawingStart}
            onMouseMove={handleDrawingMove}
            onMouseUp={handleDrawingEnd}
            onMouseLeave={cancelDrawing}
            onTouchStart={handleDrawingStart}
            onTouchMove={handleDrawingMove}
            onTouchEnd={handleDrawingEnd}
            onTouchCancel={cancelDrawing}
          >
            <Layer listening={false}>
              {/* Nền canvas thật để PNG không có khoảng đệm trong suốt. */}
              <Rect width={stageWidth} height={STAGE_HEIGHT} fill="#0F172A" />

              <Group x={PADDING} y={PADDING}>
                <FutsalPitch pitchType={pitchType} />
              </Group>
            </Layer>

            <Layer listening={false}>
              <Group x={PADDING} y={PADDING}>
                {displayFrame.lines.map((line) => (
                  <TacticalShape key={line.id} line={line} />
                ))}

                {preview && hasValidLength(preview) && (
                  <TacticalShape line={preview} isPreview />
                )}
              </Group>
            </Layer>

            <Layer listening={canDrag}>
              <Group x={PADDING} y={PADDING}>
                {displayFrame.players.map((player) => (
                  <PlayerToken
                    key={player.id}
                    player={player}
                    pitchWidth={pitchWidth}
                    pitchHeight={PITCH_HEIGHT}
                    isDraggable={canDrag}
                    scale={scale}
                    onPositionChange={updatePlayerPosition}
                  />
                ))}

                <Group
                  x={displayFrame.ball.x}
                  y={displayFrame.ball.y}
                  draggable={canDrag}
                  dragDistance={2}
                  listening={canDrag}
                  onDragMove={keepBallInsidePitch}
                  onDragEnd={handleBallDragEnd}
                >
                  <Circle
                    radius={BALL_RADIUS}
                    hitStrokeWidth={Math.max(2, 44 / scale - BALL_RADIUS * 2)}
                    fill="#FFFFFF"
                    stroke="#0F172A"
                    strokeWidth={2}
                    shadowColor="#000000"
                    shadowBlur={5}
                    shadowOpacity={0.3}
                    shadowOffsetY={2}
                  />

                  <Circle radius={3} fill="#0F172A" listening={false} />
                </Group>
              </Group>
            </Layer>
          </Stage>
                  </div>
                </div>
              </div>
            </div>
            <div className="workspace-status flex h-9 shrink-0 items-center justify-between gap-4 px-5 text-[11px] text-slate-500">
              <p role="status" className="min-w-0 truncate" title={message}>{message || (isPreviewing ? isPlaying ? "Đang phát hoạt cảnh…" : "Đã tạm dừng. Chọn một frame để tiếp tục chỉnh sửa." : TOOL_HINTS[activeTool])}</p>
              <span className="hidden shrink-0 items-center gap-3 sm:flex"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-red-400" /> HOME</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-400" /> AWAY</span><span>{activePreset !== null ? `${Math.round(transitionDuration / speed)} ms/frame` : `${displayFrame.lines.length} nét vẽ`}</span></span>
            </div>
          </div>
          {/* This button stays visible even while the timeline is collapsed. */}
          <div className="relative z-10 flex shrink-0 justify-center border-t border-slate-800 bg-slate-950/90">
            <button
              type="button"
              aria-controls="frame-timeline"
              aria-expanded={showFrameBar}
              onClick={() => setShowFrameBar(visible => !visible)}
              className="flex min-h-11 items-center gap-1.5 rounded-t-lg px-4 text-xs font-semibold text-emerald-300 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              <Film size={15} aria-hidden="true" />
              {showFrameBar ? "Ẩn Frame" : "Hiện Frame"}
              {showFrameBar ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
            </button>
          </div>
          {/* 0fr hides the panel; the wrapper removes its minimum content height. */}
          <div
            id="frame-timeline"
            className={`grid shrink-0 overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${showFrameBar ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            aria-hidden={!showFrameBar}
          >
            <div className="min-h-0 overflow-hidden" inert={!showFrameBar}>
              <FrameTimeline pitchType={pitchType} frames={frames} currentFrameIndex={visibleFrameIndex}
                isPlaying={isPlaying} isPreviewing={isPreviewing} busy={isImporting || showPitchSelector}
                speed={speed} onSelect={selectFrame} onAdd={addFrame} onDelete={deleteFrame}
                onTogglePlay={togglePlayback} onSpeedChange={setSpeed} />
            </div>
          </div>
        </section>
        <PlaybookPresets pitchType={pitchType} disabled={isImporting || preview !== null || showPitchSelector}
          activePreset={activePreset} onLoad={loadPreset} expanded={sidebarExpanded}
          mobileOpen={mobileLibraryOpen} onToggleExpanded={() => setSidebarExpanded(value => !value)}
          onCloseMobile={() => setMobileLibraryOpen(false)} />
      </div>
    </div>
  );
}

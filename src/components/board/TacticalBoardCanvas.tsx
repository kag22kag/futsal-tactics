"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Arrow, Circle, Group, Layer, Line, Rect, Stage } from "react-konva";

import { Download, Save, Upload } from "lucide-react";

import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";

import type { Ball, DrawingTool, Frame, TacticalLine } from "@/types/tactics";

import {
  BALL_RADIUS,
  MAX_FRAMES,
  MAX_JSON_BYTES,
  MAX_LINES,
  PADDING,
  PITCH_HEIGHT,
  PITCH_WIDTH,
  STAGE_HEIGHT,
  STAGE_WIDTH,
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
import PlaybookPresets from "./PlaybookPresets";
import type { PlaybookPreset } from "@/constants/presets";
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

const EXPORT_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-lg border border-slate-600 " +
  "px-3 py-2 text-sm text-slate-200 enabled:hover:bg-slate-700 " +
  "disabled:cursor-not-allowed disabled:opacity-40";

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

function isInsidePitch(point: Point): boolean {
  return (
    point.x >= 0 &&
    point.x <= PITCH_WIDTH &&
    point.y >= 0 &&
    point.y <= PITCH_HEIGHT
  );
}

function updateLineEnd(line: TacticalLine, point: Point): TacticalLine {
  const [startX, startY] = line.points;

  if (startX === undefined || startY === undefined) {
    return line;
  }

  return {
    ...line,
    points: [
      startX,
      startY,
      clamp(point.x, 0, PITCH_WIDTH),
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
  const { containerRef, scale } = useBoardScale();
  // Toàn bộ dữ liệu chỉnh sửa nằm trong frames.
  const [frames, setFrames] = useState<Frame[]>(() => [createInitialFrame()]);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");

  const [preview, setPreview] = useState<TacticalLine | null>(null);
  const draftRef = useRef<TacticalLine | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

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
  const editingLocked = isPreviewing || isImporting;
  const canDrag = !editingLocked && activeTool === "select";

  // Frame luôn tồn tại vì không cho xóa frame cuối cùng.
  const currentFrame =
    frames[currentFrameIndex] ?? frames[0] ?? createInitialFrame();

  const visibleFrameIndex =
    playbackPosition === null
      ? currentFrameIndex
      : Math.min(Math.floor(playbackPosition), frames.length - 1);

  let displayFrame = currentFrame;

  if (playbackPosition !== null) {
    const from = frames[visibleFrameIndex] ?? currentFrame;
    const to = frames[visibleFrameIndex + 1] ?? from;

    displayFrame = interpolateFrame(
      from,
      to,
      playbackPosition - visibleFrameIndex,
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

      position += (elapsed * speed) / TRANSITION_DURATION_MS;

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
  }, [isPlaying, speed, frames.length]);

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
    if (isImporting) return;
    stopPlayback();
    cancelDrawing();
    // Sao chép sâu để sửa bài không làm thay đổi thư viện mẫu.
    setFrames(preset.frames.map((frame) => cloneFrame(frame, crypto.randomUUID())));
    setCurrentFrameIndex(0);
    setActiveTool("select");
    setActivePreset(preset.id);
    setMessage(`Đã nạp ${preset.title}. Bấm Play để xem chuyển động.`);
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

    if (!point || !isInsidePitch(point)) {
      return;
    }

    if (event.evt.cancelable) {
      event.evt.preventDefault();
    }

    setDraft({
      id: crypto.randomUUID(),
      points: [point.x, point.y, point.x, point.y],
      color: activeTool === "dashed-arrow" ? "#FDE047" : "#FFFFFF",
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

    setDraft(updateLineEnd(draft, point));
  }

  function handleDrawingEnd(event: DrawingEvent) {
    const draft = draftRef.current;

    if (!draft || editingLocked) {
      return;
    }

    const point = getPitchPoint(event);
    const completedLine = point ? updateLineEnd(draft, point) : draft;

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
    setFrames([createInitialFrame()]);
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
      x: clamp(node.x(), BALL_RADIUS, PITCH_WIDTH - BALL_RADIUS),
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
        // Giữ ảnh 1760 × 960 ngay cả khi sân bị thu nhỏ trên điện thoại.
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
      version: 1,
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

      setFrames(document.frames);
      setActivePreset(null);
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

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
      {/* Chỉ khóa công cụ chỉnh sửa; nút tạo bài mới vẫn dùng được khi Play/Pause. */}
        <Toolbar
          activeTool={activeTool}
          canUndo={currentFrame.lines.length > 0}
          onToolChange={changeTool}
          onUndo={undoLine}
          onClearAll={clearAllLines}
          onReset={handleFullReset}
          disabled={editingLocked}
          resetDisabled={isImporting}
        />


      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 p-4">
        <button
          type="button"
          className={EXPORT_BUTTON_CLASS}
          disabled={isImporting || preview !== null}
          onClick={exportPng}
        >
          <Download size={17} />
          Tải ảnh Sa bàn
        </button>

        <button
          type="button"
          className={EXPORT_BUTTON_CLASS}
          disabled={isImporting || preview !== null}
          onClick={exportJson}
        >
          <Save size={17} />
          Lưu bài đánh (.json)
        </button>

        <button
          type="button"
          className={EXPORT_BUTTON_CLASS}
          disabled={isPlaying || isImporting || preview !== null}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={17} />
          {isImporting ? "Đang mở..." : "Mở file bài đánh"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={importJson}
        />
      </div>

      {message && (
        <p
          role="status"
          className="border-b border-slate-700 px-5 py-3 text-sm text-amber-300"
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2 px-5 pt-4 text-sm">
        <p className="text-slate-300">
          {isPreviewing
            ? isPlaying
              ? "Đang phát hoạt cảnh..."
              : "Đã tạm dừng. Bấm Tiếp tục hoặc chọn một frame để sửa."
            : TOOL_HINTS[activeTool]}
        </p>

        <span className="text-slate-400">
          Frame {visibleFrameIndex + 1}/{frames.length}
          {" · "}
          {displayFrame.lines.length} nét vẽ
        </span>
      </div>

      <div ref={containerRef} className="w-full min-w-0 overflow-hidden" aria-label="Sa bàn tương tác: kéo cầu thủ hoặc chọn công cụ để vẽ">
        <div
          className="mx-auto"
          style={{
            width: STAGE_WIDTH * scale,
            height: STAGE_HEIGHT * scale,
            cursor:
              editingLocked || activeTool === "select"
                ? "default"
                : "crosshair",
            touchAction: "none",
          }}
        >
          <Stage
            ref={stageRef}
            width={STAGE_WIDTH * scale}
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
              <Rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#0F172A" />

              <Group x={PADDING} y={PADDING}>
                <FutsalPitch />
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
                    pitchWidth={PITCH_WIDTH}
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

      <FrameTimeline
        frames={frames}
        currentFrameIndex={visibleFrameIndex}
        isPlaying={isPlaying}
        isPreviewing={isPreviewing}
        busy={isImporting}
        speed={speed}
        onSelect={selectFrame}
        onAdd={addFrame}
        onDelete={deleteFrame}
        onTogglePlay={togglePlayback}
        onSpeedChange={setSpeed}
      />
    </section>
    <PlaybookPresets disabled={isImporting || preview !== null} activePreset={activePreset} onLoad={loadPreset} />
    </div>
  );
}

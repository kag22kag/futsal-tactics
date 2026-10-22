// src/constants/pitch.ts

/**
 * Kích thước thực theo mét.
 * Sân nằm ngang: chiều dài tương ứng trục x.
 */
export const PITCH = {
  length: 40,
  width: 20,

  lineWidth: 0.08,

  centerCircleRadius: 3,
  centerMarkRadius: 0.06,

  penaltyArea: {
    arcRadius: 6,
    connectingLineLength: 3.16,
  },

  penaltyMarkDistance: 6,
  secondPenaltyMarkDistance: 10,
  penaltyMarkRadius: 0.06,

  cornerArcRadius: 0.25,

  goal: {
    innerWidth: 3,
    height: 2,
    postWidth: 0.08,
  },

  substitutionZone: {
    length: 5,
    distanceFromHalfwayLine: 5,
    markerLength: 0.8,
    markerInsideLength: 0.4,
    markerOutsideLength: 0.4,
  },
} as const;

export const PITCH_ASPECT_RATIO = PITCH.length / PITCH.width;

/**
 * Màu giao diện tùy chỉnh.
 * Dùng trực tiếp cho thuộc tính fill/stroke của Konva.
 */
export const PITCH_COLORS = {
  surface: "#166534",
  line: "#FFFFFF",
  surround: "#0F172A",
  goal: "#E2E8F0",
} as const;

/**
 * Kích thước hiển thị cơ sở, đơn vị pixel.
 * Phần sân là 1000 × 500 px, chưa tính khoảng đệm.
 */
export const BOARD_VIEW = {
  basePitchWidth: 1000,
  padding: 40,

  // Chiều sâu lưới chỉ phục vụ minh họa nhìn từ trên xuống.
  goalDepthMeters: 1,
} as const;

export const PIXELS_PER_METER = BOARD_VIEW.basePitchWidth / PITCH.length;

export const PITCH_SIZE_PX = {
  width: BOARD_VIEW.basePitchWidth,
  height: PITCH.width * PIXELS_PER_METER,
} as const;

export const STAGE_SIZE_PX = {
  width: PITCH_SIZE_PX.width + BOARD_VIEW.padding * 2,
  height: PITCH_SIZE_PX.height + BOARD_VIEW.padding * 2,
} as const;

// Các điểm mốc trong hệ tọa độ sân, đơn vị mét.
export const PITCH_LANDMARKS = {
  center: {
    x: PITCH.length / 2,
    y: PITCH.width / 2,
  },

  leftPenaltyMark: {
    x: PITCH.penaltyMarkDistance,
    y: PITCH.width / 2,
  },

  rightPenaltyMark: {
    x: PITCH.length - PITCH.penaltyMarkDistance,
    y: PITCH.width / 2,
  },

  leftSecondPenaltyMark: {
    x: PITCH.secondPenaltyMarkDistance,
    y: PITCH.width / 2,
  },

  rightSecondPenaltyMark: {
    x: PITCH.length - PITCH.secondPenaltyMarkDistance,
    y: PITCH.width / 2,
  },
} as const;

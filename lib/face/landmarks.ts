/**
 * MediaPipe Face Mesh 478-landmark index map.
 * Grouped by anatomical region for metric extraction.
 *
 * Reference: https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
 */

export const LM = {
  // ─── Contour / outline ───
  foreheadTop: 10,
  chinBottom: 152,
  leftTemple: 234,
  rightTemple: 454,

  // ─── Jaw ───
  leftJawAngle: 172,
  rightJawAngle: 397,
  leftJawMid: 136,
  rightJawMid: 365,

  // ─── Eyes – left ───
  leftEyeInner: 133,
  leftEyeOuter: 33,
  leftEyeTop: 159,
  leftEyeBottom: 145,

  // ─── Eyes – right ───
  rightEyeInner: 362,
  rightEyeOuter: 263,
  rightEyeTop: 386,
  rightEyeBottom: 374,

  // ─── Eyebrows ───
  leftBrowInner: 105,
  leftBrowOuter: 70,
  leftBrowTop: 107,
  rightBrowInner: 334,
  rightBrowOuter: 300,
  rightBrowTop: 336,

  // ─── Nose ───
  noseTip: 1,
  noseBridge: 6,
  leftNoseWing: 129,
  rightNoseWing: 358,

  // ─── Mouth ───
  mouthLeft: 61,
  mouthRight: 291,
  upperLipTop: 0,
  lowerLipBottom: 17,
} as const;

/** Euclidean distance between two landmarks (2D, ignoring z). */
export function dist2d(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Midpoint between two landmarks. */
export function mid(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

import type { FaceLandmark, FaceMetrics } from "./types";
import { LM, dist2d, mid } from "./landmarks";

/**
 * Extract scale-invariant face proportions from MediaPipe 478 landmarks.
 * All output values are ratios — no absolute pixel values.
 */
export function extractFaceMetrics(
  lms: FaceLandmark[]
): FaceMetrics | null {
  if (lms.length < 400) return null;

  const get = (i: number) => lms[i];

  const faceLength = dist2d(get(LM.foreheadTop), get(LM.chinBottom));
  if (faceLength < 0.01) return null;

  const faceWidth = dist2d(get(LM.leftTemple), get(LM.rightTemple));
  if (faceWidth < 0.01) return null;

  const jawWidth = dist2d(get(LM.leftJawAngle), get(LM.rightJawAngle));
  const chinToMouth = dist2d(get(LM.chinBottom), get(LM.lowerLipBottom));

  const eyeSpacing = dist2d(get(LM.leftEyeInner), get(LM.rightEyeInner));
  const leftEyeH = dist2d(get(LM.leftEyeTop), get(LM.leftEyeBottom));
  const rightEyeH = dist2d(get(LM.rightEyeTop), get(LM.rightEyeBottom));
  const avgEyeH = (leftEyeH + rightEyeH) / 2;

  const noseWidth = dist2d(get(LM.leftNoseWing), get(LM.rightNoseWing));
  const mouthWidth = dist2d(get(LM.mouthLeft), get(LM.mouthRight));

  const leftBrowMid = mid(get(LM.leftBrowInner), get(LM.leftBrowOuter));
  const rightBrowMid = mid(get(LM.rightBrowInner), get(LM.rightBrowOuter));
  const leftEyeMid = mid(get(LM.leftEyeTop), get(LM.leftEyeBottom));
  const rightEyeMid = mid(get(LM.rightEyeTop), get(LM.rightEyeBottom));
  const browToEyeL = dist2d(leftBrowMid, leftEyeMid);
  const browToEyeR = dist2d(rightBrowMid, rightEyeMid);
  const avgBrowEyeDist = (browToEyeL + browToEyeR) / 2;

  return {
    faceWidthRatio: faceWidth / faceLength,
    jawWidthRatio: jawWidth / faceWidth,
    chinLengthRatio: chinToMouth / faceLength,
    eyeSpacingRatio: eyeSpacing / faceWidth,
    eyeSizeRatio: avgEyeH / faceLength,
    noseWidthRatio: noseWidth / faceWidth,
    mouthWidthRatio: mouthWidth / faceWidth,
    eyebrowHeightRatio: avgBrowEyeDist / faceLength,
    faceLengthNorm: faceLength,
  };
}

/**
 * Clamp all metric ratios to sane ranges to prevent extreme deformations.
 */
export function clampFaceMetrics(m: FaceMetrics): FaceMetrics {
  const c = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return {
    faceWidthRatio: c(m.faceWidthRatio, 0.45, 0.95),
    jawWidthRatio: c(m.jawWidthRatio, 0.55, 1.0),
    chinLengthRatio: c(m.chinLengthRatio, 0.05, 0.25),
    eyeSpacingRatio: c(m.eyeSpacingRatio, 0.2, 0.5),
    eyeSizeRatio: c(m.eyeSizeRatio, 0.02, 0.12),
    noseWidthRatio: c(m.noseWidthRatio, 0.15, 0.4),
    mouthWidthRatio: c(m.mouthWidthRatio, 0.25, 0.6),
    eyebrowHeightRatio: c(m.eyebrowHeightRatio, 0.03, 0.12),
    faceLengthNorm: m.faceLengthNorm,
  };
}

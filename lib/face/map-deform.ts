import type { FaceMetrics, AvatarFaceDeformConfig } from "./types";
import { IDENTITY_DEFORM } from "./types";

/**
 * "Average" face metric baselines — balanced female face.
 * Deformations = delta from these baselines × gain.
 */
const BASELINE: FaceMetrics = {
  faceWidthRatio: 0.68,
  jawWidthRatio: 0.82,
  chinLengthRatio: 0.12,
  eyeSpacingRatio: 0.34,
  eyeSizeRatio: 0.055,
  noseWidthRatio: 0.26,
  mouthWidthRatio: 0.40,
  eyebrowHeightRatio: 0.065,
  faceLengthNorm: 0.4,
};

/**
 * Per-metric amplification.
 * Slightly aggressive for MVP visibility.
 */
const GAIN: Record<keyof Omit<FaceMetrics, "faceLengthNorm">, number> = {
  faceWidthRatio: 1.6,
  jawWidthRatio: 1.4,
  chinLengthRatio: 1.1,
  eyeSpacingRatio: 1.2,
  eyeSizeRatio: 1.3,
  noseWidthRatio: 1.2,
  mouthWidthRatio: 1.1,
  eyebrowHeightRatio: 0.8,
};

function clampScale(v: number, lo = 0.78, hi = 1.22): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Map measured face metrics → avatar deform config.
 *
 * @param strength 0-1 multiplier. 0 = identity, 1 = full deform.
 */
export function mapMetricsToAvatarDeform(
  metrics: FaceMetrics,
  strength = 1
): AvatarFaceDeformConfig {
  if (strength <= 0) return { ...IDENTITY_DEFORM };

  const s = Math.min(1, strength);

  const d = (key: keyof Omit<FaceMetrics, "faceLengthNorm">) => {
    const delta = (metrics[key] - BASELINE[key]) / (BASELINE[key] || 1);
    return delta * GAIN[key] * s;
  };

  return {
    headWidthScale: clampScale(1 + d("faceWidthRatio")),
    jawWidthScale: clampScale(1 + d("jawWidthRatio")),
    chinScaleY: clampScale(1 + d("chinLengthRatio"), 0.84, 1.16),
    eyeSpacingScale: clampScale(1 + d("eyeSpacingRatio"), 0.86, 1.14),
    eyeScale: clampScale(1 + d("eyeSizeRatio"), 0.84, 1.16),
    noseWidthScale: clampScale(1 + d("noseWidthRatio"), 0.86, 1.14),
    mouthWidthScale: clampScale(1 + d("mouthWidthRatio"), 0.86, 1.14),
    foreheadScale: clampScale(1 + d("eyebrowHeightRatio") * 0.5, 0.90, 1.10),
  };
}

/**
 * Convenience: return identity if metrics are null/undefined.
 */
export function safeMapDeform(
  metrics: FaceMetrics | null | undefined,
  strength?: number
): AvatarFaceDeformConfig {
  return metrics ? mapMetricsToAvatarDeform(metrics, strength) : { ...IDENTITY_DEFORM };
}

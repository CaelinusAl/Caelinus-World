/** Single 3D landmark point (MediaPipe Face Mesh, normalised 0-1). */
export type FaceLandmark = { x: number; y: number; z: number };

/**
 * Scale-invariant face proportions extracted from landmarks.
 * All values are ratios — they don't depend on image resolution.
 */
export type FaceMetrics = {
  faceWidthRatio: number;
  jawWidthRatio: number;
  chinLengthRatio: number;
  eyeSpacingRatio: number;
  eyeSizeRatio: number;
  noseWidthRatio: number;
  mouthWidthRatio: number;
  eyebrowHeightRatio: number;
  faceLengthNorm: number;
};

/**
 * Deformation values applied to avatar head.
 * 1.0 = no change, >1 = enlarge, <1 = shrink.
 */
export type AvatarFaceDeformConfig = {
  headWidthScale: number;
  jawWidthScale: number;
  chinScaleY: number;
  eyeSpacingScale: number;
  eyeScale: number;
  noseWidthScale: number;
  mouthWidthScale: number;
  foreheadScale: number;
};

export const IDENTITY_DEFORM: AvatarFaceDeformConfig = {
  headWidthScale: 1,
  jawWidthScale: 1,
  chinScaleY: 1,
  eyeSpacingScale: 1,
  eyeScale: 1,
  noseWidthScale: 1,
  mouthWidthScale: 1,
  foreheadScale: 1,
};

/* ═══════════════════════════════════════════
   Model Capabilities — runtime GLB inspection
   ═══════════════════════════════════════════ */

export type MorphTargetInfo = {
  meshName: string;
  targetName: string;
  index: number;
};

export type ModelCapabilities = {
  hasBones: boolean;
  boneNames: string[];
  headBoneName: string | null;
  meshes: Array<{
    name: string;
    vertexCount: number;
    hasMorphTargets: boolean;
  }>;
  morphTargets: MorphTargetInfo[];
  hasFaceMorphTargets: boolean;
  /** Which deform strategy will be used */
  strategy: "morph-targets" | "head-bone" | "vertex" | "none";
};

/* ═══════════════════════════════════════════
   Morph target mapping
   ═══════════════════════════════════════════ */

export type MorphWeightEntry = {
  targetName: string;
  meshName: string;
  index: number;
  /** Compute weight from deform config. Returns [0,1]. */
  computeWeight: (cfg: AvatarFaceDeformConfig) => number;
};

export type MorphTargetMapping = MorphWeightEntry[];

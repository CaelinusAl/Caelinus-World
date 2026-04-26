export type {
  FaceLandmark,
  FaceMetrics,
  AvatarFaceDeformConfig,
  ModelCapabilities,
  MorphTargetInfo,
  MorphWeightEntry,
  MorphTargetMapping,
} from "./types";
export { IDENTITY_DEFORM } from "./types";
export { LM, dist2d, mid } from "./landmarks";
export { extractFaceMetrics, clampFaceMetrics } from "./extract-metrics";
export { mapMetricsToAvatarDeform, safeMapDeform } from "./map-deform";
export { applyFaceDeform, clearFaceDeformBase } from "./apply-deform";
export { inspectModel } from "./model-inspector";
export {
  buildMorphTargetMapping,
  applyMorphTargetDeform,
  resetMorphTargets,
} from "./morph-targets";

/**
 * Caelinus Avatar Core — public surface.
 *
 * Tek import noktası: UI ve API route'ları buradan tip + helper alır.
 * Provider katmanı `@/lib/caelinus-ai` üzerinde — Avatar Core onu
 * re-export ediyor (transport ve provider ayrı modüller, tek
 * "facade" surface'i).
 */

/* Transport tipleri */
export type {
  AvatarSession,
  SessionStatus,
  OutfitPreset,
  AnimationPreset,
  CreateSessionResponse,
  SessionResponse,
  SelfieUploadRequest,
  SelfieUploadResponse,
  PublishResultRequest,
  PublishResultResponse,
  ApiError,
} from "./types";

/* Session store (server-only) */
export {
  createSession,
  getSession,
  patchSession,
  setStatus,
  deleteSession,
  activeSessionCount,
} from "./session-store";

/* Preset libraries */
export {
  OUTFIT_PRESETS,
  DEFAULT_OUTFIT_ID,
  getOutfit,
} from "./outfits";
export {
  ANIMATION_PRESETS,
  DEFAULT_ANIMATION_ID,
  getAnimation,
} from "./animations";

/* Provider katmanı re-export — UI tek surface'ten alır */
export type {
  AvatarMatch,
  AvatarProvider,
  AvatarStyleProfile,
  CaelinusReading,
  EnergyElement,
  GeneratedAvatar,
  ProgressUpdate,
  SelfieAnalysis,
  SelfieInput,
  StyleIdentity,
} from "@/lib/caelinus-ai";

export {
  DEFAULT_STYLE_PROFILE,
  ENERGY_LABELS,
  getActiveProvider,
  listProviders,
  saveGeneratedAvatar,
  loadGeneratedAvatar,
  clearGeneratedAvatar,
  GENERATED_AVATAR_KEY,
} from "@/lib/caelinus-ai";

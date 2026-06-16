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

/* Session store (server-only) — TYPES ONLY in the barrel.
 *
 * ÖNEMLİ: Session store `import "server-only"` zincirine bağlı
 * (session-store → session-store.supabase → supabase/admin). Bu barrel'ı
 * bir client component import ettiğinde (örn. /caelinus-avatar/create),
 * value re-export'u server-only kodu client bundle'a sürüklüyor ve
 * "'server-only' cannot be imported from a Client Component" 500'ü
 * patlıyordu. Tipler derlemede silindiği için güvenli; runtime
 * fonksiyonları ise server route'lar doğrudan
 * `@/lib/caelinus-avatar-core/session-store` üzerinden alır. */
export type { SessionStore, CreateOptions } from "./session-store";

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

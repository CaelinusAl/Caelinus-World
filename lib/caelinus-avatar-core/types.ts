/**
 * Caelinus Avatar Core — domain tipleri.
 *
 * Mimari katmanları:
 *   • UI / pages          → kullanıcı deneyimi (desktop QR + mobile capture)
 *   • Session transport   → backend session store + REST API (bu modül)
 *   • Provider layer      → AvatarProvider sözleşmesi (lib/caelinus-ai)
 *   • Generation engine   → MockProvider (bugünkü) / CaelinusAI / Avaturn / Luma (yarın)
 *
 * Bu modül "transport" katmanı için tipleri tanımlar. Provider tipleri
 * `lib/caelinus-ai`'dan re-export edilir — Avatar Core sadece selfie'yi
 * mobile'dan alıp desktop'a köprüleyen ve final avatar'ı saklayan
 * transport. Generate işini hâlâ provider yapar (client-side mock veya
 * gelecekteki server-side provider — fark etmez).
 */

import type {
  GeneratedAvatar,
  SelfieInput,
} from "@/lib/caelinus-ai";

/* ────────── Session yaşam döngüsü ────────── */

export type SessionStatus =
  /** Yeni session yaratıldı, mobile henüz bağlanmadı */
  | "pending"
  /** Mobile sayfa açıldı (QR tarandı) — UI feedback */
  | "mobile-connected"
  /** Mobile selfie yüklüyor */
  | "selfie-uploading"
  /** Selfie backend'e ulaştı — desktop generate'e geçebilir */
  | "selfie-received"
  /** Desktop generate ediyor (provider çalışıyor) */
  | "generating"
  /** Final avatar yayınlandı */
  | "ready"
  /** Hata */
  | "error"
  /** TTL doldu */
  | "expired";

/**
 * Avatar Session — desktop ↔ mobile köprüsü.
 *
 * Backend bu tipin tamamını saklar; desktop polling ile bunu çeker,
 * mobile selfie'yi içine yazar. Desktop generate sonucu da içine
 * yazılır (client-side veya server-side fark etmez).
 */
export type AvatarSession = {
  /** Stable session id — 12 karakter base32 (URL-safe). */
  id: string;
  status: SessionStatus;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp — bu vakitten sonra 410 Gone. */
  expiresAt: string;

  /** Mobile sayfasının URL'i — QR'ın içine giren string. */
  mobileUrl: string;

  /** Mobile'dan gelen selfie (status >= "selfie-received"). */
  selfie?: SelfieInput;

  /** Final üretilen avatar (status === "ready"). */
  avatar?: GeneratedAvatar;

  /** Hata mesajı (status === "error"). */
  errorMessage?: string;

  /** Desktop'tan publish eden client'ın id'si — telemetri için. */
  publisherId?: string;
};

/* ────────── Outfit + Animation preset kütüphanesi ────────── */

export type OutfitPreset = {
  id: string;
  label: string;
  /** Caelinus dilinde tek satırlık tanım. */
  tagline: string;
  /** GLB URL — opsiyonel; yoksa renk/material override yapılır. */
  glbUrl?: string;
  /** Material accent — sahne ışığı bu renge kayar. */
  accent: string;
  /** Hangi mesh parçaları gizlenmeli (outfit binding'e geçer). */
  hiddenMeshParts?: string[];
  /** Frekans etiketi — UI'da gösterilir. */
  frequency?: string;
};

export type AnimationPreset = {
  id: string;
  label: string;
  tagline: string;
  /** GLB URL — Mixamo-uyumlu retarget animasyonu. */
  glbUrl: string | null;
  /** Otomatik açılır mı (default). */
  autoplay?: boolean;
};

/* ────────── API kontratları ────────── */

export type CreateSessionResponse = {
  session: AvatarSession;
};

export type SessionResponse = {
  session: AvatarSession;
};

export type SelfieUploadRequest = {
  /** data:image/...;base64,... */
  dataUrl: string;
  source?: "upload" | "webcam";
  width?: number;
  height?: number;
};

export type SelfieUploadResponse = {
  session: AvatarSession;
};

export type PublishResultRequest = {
  avatar: GeneratedAvatar;
  publisherId?: string;
};

export type PublishResultResponse = {
  session: AvatarSession;
};

export type ApiError = {
  error: string;
  code?: string;
};

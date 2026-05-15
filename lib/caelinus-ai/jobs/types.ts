/**
 * Caelinus AI Studio — Job tipleri.
 *
 * Caelinus AI'ın "AI Avatar Studio" backend'i için temel sözleşme.
 * Browser tarafındaki `AvatarProvider`'dan farklı: bu tip server-side
 * ve persisted (Supabase / in-memory). Bir job'ın yaşam döngüsü:
 *
 *   queued → preparing → analyzing-selfie → matching-archetype
 *         → generating-variants → ready  (matches sunmaya hazır)
 *         ↓ (kullanıcı match seçince)
 *         → rigging → rendering → polishing → finalized
 *
 * Provider tarafı (`caelinusStudioProvider`) bu job'ı yaratır, SSE'den
 * progress dinler, `matches` event'i geldiğinde UI'a kart grid sunar,
 * kullanıcı seçince `/finalize` endpoint'ini çağırıp final avatar'ı alır.
 */

import type {
  AvatarMatch,
  AvatarStyleProfile,
  GeneratedAvatar,
  SelfieAnalysis,
  SelfieInput,
} from "../types";

/** Job'ın yaşam döngüsü durumu. */
export type JobStatus =
  /** Job kuyruğa alındı, henüz worker pickup yapmadı. */
  | "queued"
  /** Worker job'ı aldı, hazırlık fazında (~1sn). */
  | "preparing"
  /** Selfie analizi (MediaPipe / SDXL pipeline). */
  | "analyzing-selfie"
  /** Style profile + analiz → arketip skoru. */
  | "matching-archetype"
  /** 6 varyant mesh + reading üretimi. */
  | "generating-variants"
  /** Match grid kullanıcıya sunulmaya hazır, kullanıcı seçim bekliyor. */
  | "matches-ready"
  /** Kullanıcı bir match seçti — finalize başladı. */
  | "rigging"
  /** Mesh + texture + saç compose ediliyor. */
  | "rendering"
  /** Son rötuş — texture polish, occlusion, exporter. */
  | "polishing"
  /** Final GeneratedAvatar hazır, R2'da. */
  | "finalized"
  /** Kullanıcı veya operator tarafından iptal. */
  | "cancelled"
  /** Pipeline başarısız. `error` alanına bak. */
  | "failed";

/** Aktif olarak çalışıyor mu (ne kuyrukta ne de bitti)? */
export const ACTIVE_JOB_STATUSES: ReadonlySet<JobStatus> = new Set<JobStatus>([
  "preparing",
  "analyzing-selfie",
  "matching-archetype",
  "generating-variants",
  "rigging",
  "rendering",
  "polishing",
]);

/** Terminal durumlar — bir daha state değişmez. */
export const TERMINAL_JOB_STATUSES: ReadonlySet<JobStatus> = new Set<JobStatus>([
  "finalized",
  "cancelled",
  "failed",
]);

/** Match seçiminden önce job'un "ürettiği" durum. */
export const PRE_FINALIZE_STATUSES: ReadonlySet<JobStatus> = new Set<JobStatus>([
  "queued",
  "preparing",
  "analyzing-selfie",
  "matching-archetype",
  "generating-variants",
  "matches-ready",
]);

/* ────────── Job giriş/çıkış payload'ları ────────── */

export type JobInput = {
  /** Selfie referansı — base64 dataUrl, R2 url, veya selfieId. */
  selfie?: SelfieInput;
  /** Selfie blob'unu separate yüklemişse — id. */
  selfieId?: string;
  /** Kullanıcının estetik kararları. */
  style: AvatarStyleProfile;
  /** Provider'a hint — "kalite vs hız" tercihi. */
  quality?: "fast" | "balanced" | "high";
  /** İdempotency — aynı selfie+style hash'i için cache hit. */
  inputHash?: string;
};

/**
 * Job çıktısı — match grid (matches-ready'den sonra) + finalize sonrası
 * GeneratedAvatar. İki ayrı alan, birbirini ezmez.
 */
export type JobOutput = {
  analysis?: SelfieAnalysis;
  matches?: AvatarMatch[];
  /** Kullanıcının seçtiği match'in id'si. */
  selectedMatchId?: string;
  /** Finalize tamamlanınca dolar. */
  avatar?: GeneratedAvatar;
};

/* ────────── Server-side job kaydı ────────── */

export type JobRecord = {
  /** Stable job id — UUID v4 prefix'li ("caij_..."). */
  id: string;
  /** Provider id ("studio", "caelinus-ai-studio-v1"…). */
  providerId: string;
  /** Provider versiyonu — schema migration için. */
  providerVersion: string;
  /** Sahibi — auth varsa Supabase user.id, anon ise null. */
  userId: string | null;
  status: JobStatus;
  /** 0-100, frontend progress bar için. */
  progress: number;
  /** Şiirsel mesaj — kullanıcıya gösterilen. */
  message: string;
  input: JobInput;
  output: JobOutput;
  /** İşlem hata aldıysa kullanıcı dostu mesaj + dev-side detay. */
  error?: { code: string; message: string; cause?: string };
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** Rate limit / abuse guard — IP hash. Logging için. */
  clientHash?: string;
};

/* ────────── SSE event'leri ────────── */

/** Progress mesajı — `caelinusStudioProvider` SSE'den okur. */
export type JobProgressEvent = {
  type: "progress";
  jobId: string;
  status: JobStatus;
  progress: number;
  message: string;
  /** Server-relative timestamp — debounce için. */
  emittedAt: string;
};

/** Match grid hazır olunca emit edilir. */
export type JobMatchesEvent = {
  type: "matches";
  jobId: string;
  matches: AvatarMatch[];
};

/** Finalize tamamlanınca emit edilir. */
export type JobFinalizedEvent = {
  type: "finalized";
  jobId: string;
  avatar: GeneratedAvatar;
};

/** İptal / hata. */
export type JobErrorEvent = {
  type: "error";
  jobId: string;
  code: string;
  message: string;
};

export type JobCancelledEvent = {
  type: "cancelled";
  jobId: string;
};

/** SSE üzerinden taşınan tüm event'lerin birleşim tipi. */
export type JobEvent =
  | JobProgressEvent
  | JobMatchesEvent
  | JobFinalizedEvent
  | JobErrorEvent
  | JobCancelledEvent;

/* ────────── Faz → mesaj sözlüğü (Türkçe poetic) ────────── */

// Re-export from shared single-source-of-truth module — mock provider
// + studio runner + UI step component aynı dosyadan okur. Mesajları
// `lib/caelinus-ai/phase-messages.ts` içinde düzenle; her iki path'de
// (mock + studio) UI parity garantili.
export { JOB_PHASE_MESSAGES, JOB_PHASE_PROGRESS } from "../phase-messages";

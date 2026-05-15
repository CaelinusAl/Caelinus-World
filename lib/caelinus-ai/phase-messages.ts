/**
 * Caelinus AI — Faz mesaj + progress sözlüğü (SINGLE SOURCE OF TRUTH).
 *
 * Mock provider, studio job runner ve UI step'i bu modülden okur. Mesajları
 * burada düzenle → her iki path'de (browser-side mock + RunPod-backed
 * studio) UI parity garantili. Kullanıcı `mock` ile `studio` arasındaki
 * farkı asla göremez.
 *
 * Tarih: S2 (Sprint 2 — Selfie illusion lock-in).
 *
 * Yapı:
 *   • PROVIDER_PHASES — mockProvider + UI'ın gördüğü `ProgressUpdate.phase`
 *     enum'u. (8 phase: preparing → ready)
 *   • JOB_STATUSES — server-side `JobStatus` enum'u. (12 status —
 *     queued / matches-ready / cancelled / failed gibi PROVIDER'da
 *     karşılığı olmayanlar dahil)
 *   • PHASE_MESSAGES — provider phase için Türkçe poetic mesaj
 *   • PHASE_PROGRESS — provider phase için 0-100 default progress
 *   • JOB_PHASE_MESSAGES — server status için (PHASE_MESSAGES'i extend eder)
 *   • JOB_PHASE_PROGRESS — server status için
 *
 * Mock'un emit ettiği progress eğrisi ile JOB_PHASE_PROGRESS değerleri
 * birebir aynı; bu sayede UI progress bar mock vs studio'da farklı
 * görünmüyor.
 */

/* ────────── Provider tarafı (mock + UI ortak) ────────── */

export type ProviderPhase =
  | "preparing"
  | "analyzing-selfie"
  | "matching-archetype"
  | "generating-variants"
  | "rigging"
  | "rendering"
  | "polishing"
  | "ready";

/** Provider phase → poetic Türkçe mesaj. */
export const PHASE_MESSAGES: Record<ProviderPhase, string> = {
  preparing: "Caelinus ışık çemberi açılıyor…",
  "analyzing-selfie": "Yüzünden bir frekans okuyoruz…",
  "matching-archetype": "Arketipini eşleştiriyoruz…",
  "generating-variants": "Altı farklı sen oluşuyor…",
  rigging: "Bedenini hizalıyoruz, kemikleri ışıkla bağlanıyor…",
  rendering: "Kozmik atölyede dokunuluyor…",
  polishing: "Son rötuş — saç, ten, dudak…",
  ready: "Caelinus bedenin hazır.",
};

/**
 * Provider phase → 0-100 progress. Mock provider bu değerleri
 * `emit()` çağrılarında kullanır; studio runner aynı değerleri
 * `JOB_PHASE_PROGRESS` üzerinden status → progress map'inde tutar.
 *
 * Eğri kasıtlı: hızlı bir "preparing" kıvılcımı (8%) → analiz
 * fazı uzunca (24% → 48%) → variant build görsel olarak doyuran
 * bir sıçrama (80%) → ready (100). Kullanıcı her aşamada "bir
 * şey oluyor" hissi alır.
 */
export const PHASE_PROGRESS: Record<ProviderPhase, number> = {
  preparing: 8,
  "analyzing-selfie": 24,
  "matching-archetype": 48,
  "generating-variants": 80,
  rigging: 25,
  rendering: 60,
  polishing: 90,
  ready: 100,
};

/* ────────── Server-side (job runner + Supabase persist) ────────── */

export type JobPhase =
  | "queued"
  | ProviderPhase
  | "matches-ready"
  | "finalized"
  | "cancelled"
  | "failed";

/**
 * Server-side full job status sözlüğü. ProviderPhase'in tüm girişlerini
 * extend eder + queued/matches-ready/finalized/cancelled/failed.
 *
 * `finalized` mesajı `ready` ile aynı string — UI seviyesinde fark yok.
 */
export const JOB_PHASE_MESSAGES: Record<JobPhase, string> = {
  queued: "Caelinus seni kuyruğa alıyor…",
  ...PHASE_MESSAGES,
  "matches-ready": "Caelinus altı eşleşme buldu — seç.",
  finalized: PHASE_MESSAGES.ready,
  cancelled: "İşlem iptal edildi.",
  failed: "Caelinus seni yeniden okumalı — bir daha dene.",
};

export const JOB_PHASE_PROGRESS: Record<JobPhase, number> = {
  queued: 2,
  ...PHASE_PROGRESS,
  "matches-ready": 100,
  finalized: 100,
  cancelled: 0,
  failed: 0,
};

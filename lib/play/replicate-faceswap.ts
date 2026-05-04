/**
 * Caelinus Avatar Studio — Replicate face swap config.
 *
 * Faz 4d: Easel AI (fal.ai) sürekli 500 Internal Server Error
 * döndü → Replicate'in kanıtlanmış face swap modeline geçtik.
 *
 *   • Model: `cdingram/face-swap`
 *   • 1.9M+ production runs (Replicate explore stats)
 *   • InsightFace tabanlı, A100, ~10s
 *   • $0.014/run (Easel'in $0.05'inden ucuz)
 *   • Stabil API, tested by thousands of indie projects
 *
 * Schema (cdingram/face-swap):
 *   • Input:
 *     - `swap_image` — kullanıcı selfie (source face)
 *     - `input_image` — Caelinus canvas (target)
 *   • Output: tek bir URI string (final swapped image URL)
 *
 * Diğer iyi adaylar (gerekirse failover):
 *   • `lucataco/faceswap`
 *   • `xiankgx/face-swap`
 *   • `arabyai-replicate/roop_face_swap`
 *
 * Hepsi InsightFace tabanlı, schema benzer. cdingram en çok run'a
 * sahip olduğu için default.
 */

/**
 * cdingram/face-swap version SHA. Replicate predictions API `version`
 * alanını ister. Bu hash, modelin spesifik bir snapshot'ı; modelin
 * sahibi yeni bir version push'larsa eski hash hâlâ çalışır
 * (deterministic, reproducible).
 *
 * Verified at https://replicate.com/cdingram/face-swap (2026-05).
 */
export const REPLICATE_FACESWAP_VERSION =
  "d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111";

/**
 * Polling deadline (ms). cdingram tipik 8-15s, +A100 cold start
 * 10-30s. 50s deadline route maxDuration=60s ile uyumlu (10s buffer).
 */
export const REPLICATE_FACESWAP_DEADLINE_MS = 50_000;

/** Polling interval (ms). 1.5s — A100 hızlı, çok sık polling
 *  gerekmez. */
export const REPLICATE_FACESWAP_POLL_MS = 1500;

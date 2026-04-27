/**
 * Play studio — custom brief sanitisation + cache-key fingerprinting.
 *
 * The brief is the single line of free text a signed-in user can add
 * to the studio render request ("wearing a silver headpiece, soft
 * rain"). Two responsibilities live here:
 *
 *   1. `sanitizeBrief(raw)` — strips newlines / control chars,
 *      collapses whitespace, trims, hard-caps the length. The output
 *      is what ends up in the AI prompt and (hashed) in the cache key.
 *
 *   2. `briefHash(text)` — produces a short, stable hex digest that we
 *      append to the `play_renders.cache_key` so each unique brief is
 *      its own cache row. Different brief → different render → its own
 *      `likes_count` and gallery entry.
 *
 * Sanitization is deliberately mild: we don't censor here, we just
 * normalise. Content moderation is `lib/play/moderation.ts`'s job and
 * runs on the sanitised string.
 */

/** Hard length cap. The prompt builder appends this to the SDXL
 *  preamble so we keep it short enough to not crowd out the style
 *  tokens. 200 chars ≈ 30–40 words, plenty for a one-line brief. */
export const BRIEF_MAX_LENGTH = 200;

/**
 * Normalise raw user input into the canonical brief string we'll use
 * everywhere downstream. Returns `""` for empty / whitespace-only
 * input so callers can early-exit with a simple truthy check.
 *
 * Steps:
 *   • Strip control characters (newlines, tabs, U+0000 etc.) — they
 *     break SDXL prompts in subtle ways and can confuse our cache_key.
 *   • Collapse internal whitespace runs to a single space.
 *   • Trim outer whitespace.
 *   • Truncate to BRIEF_MAX_LENGTH characters (hard cap, not a slice
 *     point — we don't try to break on word boundaries because that
 *     adds complexity for negligible UX gain on a 200-char field).
 */
export function sanitizeBrief(raw: unknown): string {
  if (typeof raw !== "string") return "";
  // Strip C0 control chars (newlines/tabs/etc.) and the U+007F DEL.
  const stripped = raw.replace(/[\u0000-\u001F\u007F]+/g, " ");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  return collapsed.slice(0, BRIEF_MAX_LENGTH);
}

/**
 * 8-hex-char digest of a sanitised brief. Used as a suffix on
 * `play_renders.cache_key` so two users with the same triple but
 * different briefs each get their own cache row + gallery entry.
 *
 * FNV-1a is plenty here — collisions only matter if two different
 * brief strings happen to hash to the same value AND they share the
 * same triple, in which case the second user gets the first user's
 * render. The 32-bit space gives us ~65k cache rows before the
 * birthday-collision odds reach 1%, far above any realistic per-triple
 * brief volume.
 */
export function briefHash(brief: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < brief.length; i++) {
    h ^= brief.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

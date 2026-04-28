/**
 * Play studio — pre-configured "showcase" presets.
 *
 * A preset is a (archetype, zodiac, scene) triple plus presentation
 * copy. The page-level URL handler reads `?preset=<id>` once on mount
 * and seeds the store, so a single shareable link can drop a viewer
 * straight into a known-good combination — no menu hunting required.
 *
 * Use cases:
 *   • Investor demo: `/play?preset=wow` lands on Caelinus' signature
 *     look the moment the page hydrates. Pair with a pre-warmed cache
 *     row (`npm run play:warm:openai -- --only=cosmic,leo,resort`) and
 *     the image returns in <100 ms instead of the typical 10–25 s.
 *   • Press kits / social posts: stable URL → consistent screenshot.
 *   • QA: deterministic combination for visual regression checks.
 *
 * Adding a preset:
 *   1. Pick a triple from `data/play-assets.ts` (the runtime validates
 *      the ids — TypeScript catches typos at build time).
 *   2. Give it a slug and TR/EN copy.
 *   3. Optionally pre-warm the cache so first-click is instant.
 */

import type { ArchetypeId, SceneId, ZodiacId } from "@/data/play-assets";

export type PlayPreset = {
  /** URL slug used as `?preset=<id>`. Lowercase, no spaces. */
  id: string;
  archetype: ArchetypeId;
  zodiac: ZodiacId;
  scene: SceneId;
  label: { tr: string; en: string };
  description: { tr: string; en: string };
};

/**
 * Caelinus' signature investor-demo look.
 *
 * Why this triple:
 *   • cosmic (archetype) — magenta nebula aura, brand-defining halo
 *   • leo (zodiac)       — solar mane crown, gold-leaf cape, regal pose
 *   • resort (scene)     — luxurious mirrored interior, glass + glow
 *
 * Reads as "uzaysı altın lüks" — the strongest combo in the catalogue
 * for a first impression. Pair with a warmed cache row for a cache-hit
 * landing experience.
 */
export const PLAY_PRESETS: Record<string, PlayPreset> = {
  wow: {
    id: "wow",
    archetype: "cosmic",
    zodiac: "leo",
    scene: "resort",
    label: { tr: "Caelinus Hero Demo", en: "Caelinus Hero Demo" },
    description: {
      tr: "Cosmic Leo · Resort altın saatinde — Caelinus'un imza görünümü.",
      en: "Cosmic Leo · Resort golden hour — Caelinus' signature look.",
    },
  },
};

/** Type-safe lookup. Returns null for unknown slugs. */
export function findPreset(id: string | null | undefined): PlayPreset | null {
  if (!id) return null;
  return PLAY_PRESETS[id] ?? null;
}

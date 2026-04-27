/**
 * Play studio asset catalogue.
 *
 * The /play page is a multi-step generator: pick an archetype, a
 * zodiac (avatar), a scene; we then ask the AI render endpoint to
 * paint a portrait. This module holds the *catalogue* — labels,
 * tones, prompts, glyphs — so the UI components and the render
 * route share one source of truth.
 *
 * Real images aren't shipped yet. Each entry has a `glyph` + `tone`
 * pair so the picker tiles can render an SVG/CSS-only silhouette
 * placeholder until the AI route fills the actual canvas.
 */

import type { StageTone } from "@/app/_stage";

// ── Archetypes ────────────────────────────────────────────────
// "What kind of figure should the goddess be?" 7 silhouettes that
// represent the body / aura archetype the user wants painted.

export type ArchetypeId =
  | "light"
  | "golden"
  | "dark"
  | "cosmic"
  | "minimal"
  | "athletic"
  | "curvy";

export type Archetype = {
  id: ArchetypeId;
  label: { tr: string; en: string };
  tagline: { tr: string; en: string };
  glyph: string;
  tone: StageTone;
  /** Prompt fragment that anchors this archetype's body type / aura. */
  prompt: string;
};

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: "light",
    label: { tr: "Işık", en: "Light" },
    tagline: { tr: "Açık ten · pastel hare", en: "Pale skin · pastel halo" },
    glyph: "☼",
    tone: "magenta",
    prompt:
      "luminous figure, fair skin, pastel iridescent halo, soft daylight rim",
  },
  {
    id: "golden",
    label: { tr: "Altın", en: "Golden" },
    tagline: { tr: "Bronz ten · sıcak hâle", en: "Tan skin · warm glow" },
    glyph: "✺",
    tone: "gold",
    prompt:
      "sun-bronzed figure, warm golden skin tone, honey-coloured aura, summer-sunset rim light",
  },
  {
    id: "dark",
    label: { tr: "Karanlık", en: "Dark" },
    tagline: { tr: "Koyu ten · yıldız tozu", en: "Deep skin · stardust" },
    glyph: "✶",
    tone: "cosmic",
    prompt:
      "deep brown skin tone, stardust-flecked aura, cool moonlit rim light",
  },
  {
    id: "cosmic",
    label: { tr: "Kozmik", en: "Cosmic" },
    tagline: { tr: "Mavi-mor pırıltı", en: "Indigo shimmer" },
    glyph: "✦",
    tone: "cosmic",
    prompt:
      "celestial figure with subtle iridescent indigo skin, faint nebula on shoulders, low-key magenta rim",
  },
  {
    id: "minimal",
    label: { tr: "Minimal", en: "Minimal" },
    tagline: { tr: "Temiz çizgi · az detay", en: "Clean line · low detail" },
    glyph: "◯",
    tone: "teal",
    prompt:
      "minimal poster figure, clean silhouette, restrained palette, no ornaments, gallery-poster styling",
  },
  {
    id: "athletic",
    label: { tr: "Atletik", en: "Athletic" },
    tagline: { tr: "Tonlu kaslar · enerji", en: "Toned · energetic" },
    glyph: "✷",
    tone: "amber",
    prompt:
      "athletic toned figure, confident stance, dynamic energy, warm amber rim light",
  },
  {
    id: "curvy",
    label: { tr: "Kıvrımlı", en: "Curvy" },
    tagline: { tr: "Yumuşak hat · zarif", en: "Soft curves · graceful" },
    glyph: "❀",
    tone: "magenta",
    prompt:
      "curvy graceful figure, soft S-curve silhouette, draped fabric, magenta halo",
  },
];

// ── Zodiac avatars ───────────────────────────────────────────
// 12 sign archetypes. The poster carries a strong visual identity
// from the sign (Aries → fire, Cancer → moon, Scorpio → night).

export type ZodiacId =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type Zodiac = {
  id: ZodiacId;
  label: { tr: string; en: string };
  glyph: string;
  tone: StageTone;
  prompt: string;
};

export const ZODIACS: readonly Zodiac[] = [
  { id: "aries",       label: { tr: "Koç", en: "Aries" },         glyph: "♈", tone: "amber",   prompt: "fiery ram horns, ember-red robes, ash-warm palette" },
  { id: "taurus",      label: { tr: "Boğa", en: "Taurus" },       glyph: "♉", tone: "teal",    prompt: "earthy field crown, jade veil, mossy green-bronze palette" },
  { id: "gemini",      label: { tr: "İkizler", en: "Gemini" },    glyph: "♊", tone: "cosmic",  prompt: "twin silhouettes overlapping, mercurial silver palette, light-and-shadow split" },
  { id: "cancer",      label: { tr: "Yengeç", en: "Cancer" },     glyph: "♋", tone: "cosmic",  prompt: "moon halo, pearl-silver fabric, lunar tide palette" },
  { id: "leo",         label: { tr: "Aslan", en: "Leo" },         glyph: "♌", tone: "gold",    prompt: "solar mane crown, gold-leaf cape, regal sunset palette" },
  { id: "virgo",       label: { tr: "Başak", en: "Virgo" },       glyph: "♍", tone: "teal",    prompt: "wheat braid, ivory linen, harvest dawn palette" },
  { id: "libra",       label: { tr: "Terazi", en: "Libra" },      glyph: "♎", tone: "magenta", prompt: "balance scales motif, rose-gold drape, twilight palette" },
  { id: "scorpio",     label: { tr: "Akrep", en: "Scorpio" },     glyph: "♏", tone: "magenta", prompt: "obsidian veil, deep magenta-violet, oracle night palette" },
  { id: "sagittarius", label: { tr: "Yay", en: "Sagittarius" },   glyph: "♐", tone: "amber",   prompt: "arrow circlet, amber-and-bronze, traveller-at-sunset palette" },
  { id: "capricorn",   label: { tr: "Oğlak", en: "Capricorn" },   glyph: "♑", tone: "cosmic",  prompt: "stone horns, slate palette, mountain-dusk light" },
  { id: "aquarius",    label: { tr: "Kova", en: "Aquarius" },     glyph: "♒", tone: "cosmic",  prompt: "current-of-stars veil, electric blue, polar dawn palette" },
  { id: "pisces",      label: { tr: "Balık", en: "Pisces" },      glyph: "♓", tone: "teal",    prompt: "seafoam veil, dream tide, soft underwater palette" },
];

// ── Scenes ───────────────────────────────────────────────────
// "Where to?" — 4 cinematic backgrounds. The Beach/Coffee/Night/
// Resort split mirrors the mockup's bottom rail.

export type SceneId = "beach" | "coffee" | "night" | "resort";

export type Scene = {
  id: SceneId;
  label: { tr: string; en: string };
  glyph: string;
  tone: StageTone;
  prompt: string;
};

export const SCENES: readonly Scene[] = [
  {
    id: "beach",
    label: { tr: "Sahil", en: "Beach" },
    glyph: "≈",
    tone: "amber",
    prompt: "warm beach at golden hour, soft surf, sand catching the sunset",
  },
  {
    id: "coffee",
    label: { tr: "Kahve", en: "Coffee" },
    glyph: "☕",
    tone: "gold",
    prompt: "intimate cafe corner, low warm lighting, steam rising from a cup",
  },
  {
    id: "night",
    label: { tr: "Gece", en: "Night" },
    glyph: "☾",
    tone: "magenta",
    prompt: "starry rooftop at midnight, distant city lights, cool moon shadow",
  },
  {
    id: "resort",
    label: { tr: "Resort", en: "Resort" },
    glyph: "✺",
    tone: "teal",
    prompt: "infinity-pool resort terrace, twilight palms, calm reflective water",
  },
];

// ── Lookup helpers ────────────────────────────────────────────

export function findArchetype(id: ArchetypeId | null | undefined) {
  return id ? ARCHETYPES.find((a) => a.id === id) ?? null : null;
}
export function findZodiac(id: ZodiacId | null | undefined) {
  return id ? ZODIACS.find((z) => z.id === id) ?? null : null;
}
export function findScene(id: SceneId | null | undefined) {
  return id ? SCENES.find((s) => s.id === id) ?? null : null;
}

/**
 * Cache key — same triple (+ variant + brief) → same render. The render
 * route uses this to look up an existing image in Supabase Storage /
 * `play_renders`.
 *
 * Suffix order (omitted when default):
 *   `<archetype>-<zodiac>-<scene>[-v<N>][-b<8charHex>]`
 *
 * • `variant === 1` and an empty `briefHash` produce the original
 *   `<archetype>-<zodiac>-<scene>` key — back-compat with anything
 *   cached before F2a / F2b.
 * • Variants always render before the brief suffix so re-rolling a
 *   custom brief stays grouped under the same brief hash.
 * • `briefHash` is the 8-hex output of `lib/play/brief.ts`. Pass `""`
 *   (or omit) when there's no user brief — that's the gallery-friendly
 *   public render.
 */
export function lookCacheKey(
  archetype: ArchetypeId,
  zodiac: ZodiacId,
  scene: SceneId,
  variant: number = 1,
  briefHash: string = "",
): string {
  let key = `${archetype}-${zodiac}-${scene}`;
  const v = Math.max(1, Math.floor(variant));
  if (v !== 1) key += `-v${v}`;
  if (briefHash) key += `-b${briefHash}`;
  return key;
}

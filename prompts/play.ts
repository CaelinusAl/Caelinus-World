/**
 * Play studio prompt templates.
 *
 * Used by `app/api/play/render/route.ts` to assemble a single prompt
 * (and matching negative prompt) from the user's archetype × zodiac
 * × scene triple. Kept in its own module so the route handler stays
 * tidy and prompts are easy to iterate on without touching network
 * code.
 *
 * The template targets stable-diffusion-xl-style models (Replicate's
 * SDXL endpoints are the default), but the structure is generic
 * enough to hand off to OpenAI gpt-image-1 with minimal shaping.
 *
 * F2d — Prompt engineering refresh:
 *   • House style augmented with explicit quality + composition tags.
 *   • Per-zodiac mood/palette enrichment (lighting + atmosphere).
 *   • Negative prompt extended for SDXL-typical AI artefacts
 *     (extra eyes, asymmetric face, jpeg compression, cropped frame).
 */

import {
  findArchetype,
  findScene,
  findZodiac,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";

export type PromptInput = {
  archetype: ArchetypeId;
  zodiac: ZodiacId;
  scene: SceneId;
  /** F2a — non-canonical variant index. Same triple, different seed.
   *  Defaults to 1 (the canonical render). */
  variant?: number;
  /** F2b — sanitised user brief. When present, appended to the prompt
   *  as a "personal brief: …" clause and folded into the seed so two
   *  briefs on the same triple don't collide visually. The caller is
   *  responsible for sanitisation + moderation; this module only
   *  re-asserts the length cap as a defensive trim. */
  brief?: string;
  /** F2c — Stylist Caelinus AI outfit overlay. When present, the
   *  fragment is appended as a "wearing: …" clause so the figure is
   *  rendered with the selected garment / accessory. Caller resolves
   *  the product id → fragment via `findOutfit()` from
   *  `data/play-outfits.ts`; this module only consumes the resolved
   *  string + id (id feeds the seed for cache uniqueness). */
  outfit?: { id: string; prompt: string } | null;
};

export type PromptOutput = {
  prompt: string;
  negativePrompt: string;
  /** Deterministic seed derived from the triple — same triple+variant
   *  maps to the same seed so retries return visually similar outputs. */
  seed: number;
};

/**
 * House style tokens. The signature look is a **luxury collectible
 * figurine portrait** — porcelain BJD craftsmanship, premium 3D CG,
 * museum-grade collectible character art. The render must read as
 * an *obviously CG figurine*, never as a photograph of a real
 * person.
 *
 * IMPORTANT — gpt-image-1 prints any readable proper noun (brand,
 * series name, headline phrase) directly into the image as visible
 * text. Keep this list free of:
 *   • Brand / software names (Daz, NVIDIA, ZBrush, Octane, …)
 *   • Series / line names (e.g. "moon temple collectible line")
 *   • Title-cased multi-word phrases the model could read as a logo.
 * Use generic descriptive tokens only.
 */
const STYLE_BASE = [
  // Quality boosters — generic, safe to use across providers.
  "(masterpiece:1.2)",
  "(best quality:1.2)",
  "ultra-detailed",
  "8k resolution",
  "sharp focus",
  // Luxury collectible figurine pipeline — generic descriptors only.
  "luxury collectible figurine portrait",
  "ball-jointed bjd doll, hand-crafted porcelain figurine",
  "polished 3d digital sculpt, hi-poly cg character",
  "premium cinematic 3d render, photoreal cg fidelity",
  "glossy porcelain skin shader with soft subsurface scattering",
  "smooth resin doll surface, subtle pearlescent sheen",
  "museum-grade collectible art statue, quarter-scale figurine",
  "obviously rendered cg character, not a photograph of a real person",
  // Composition / art direction — palette + framing only.
  "cinematic poster portrait of a goddess archetype",
  "rule-of-thirds composition with generous headroom",
  "magazine-cover framing, three-quarter to full body",
  "soft warm rim light, magenta-and-cosmic nebula palette",
  "studio hdri lighting with crisp specular highlights",
  "subtle iridescent halo, delicate iridescent skin sheen",
  "macro toy-photography aesthetic, tabletop dramatic light",
].join(", ");

/**
 * Negative prompt — what we tell SDXL to *avoid*. Ordered by impact:
 *   1. Anatomy failures (most common SDXL failure mode).
 *   2. Composition failures (out-of-frame, cropped subjects).
 *   3. Quality/encoding failures (jpeg artefacts, lowres).
 *   4. Style failures (text/logo/watermark contamination).
 *   5. Safety guardrails (nsfw + minor protection).
 */
const NEGATIVE_BASE = [
  // Anatomy
  "extra fingers", "missing fingers", "fused fingers",
  "extra limbs", "missing limbs",
  "extra arms", "extra legs", "extra hands",
  "deformed", "disfigured", "mutilated", "mangled",
  "bad anatomy", "long neck", "double face",
  "asymmetric face", "asymmetric eyes",
  "extra eyes", "deformed iris", "cross-eyed",
  "ugly hands", "malformed hands",
  // Composition
  "out of frame", "cropped", "cut off",
  "tiny subject", "off-centre subject",
  // Quality / encoding
  "lowres", "low quality", "worst quality",
  "blurry", "out of focus",
  "jpeg artifacts", "compression artifacts",
  "noisy", "grainy",
  // Style contamination — we want a Daz3D / BJD figurine render, NOT
  // a photograph of a real person. gpt-image-1 strongly defaults to
  // photographic output, so the photo-family ban here has to be loud
  // and broad. We also lock out 2D-painterly tones and the low-poly /
  // clay failure mode of weak CG.
  "watermark", "text", "letters", "signature", "logo",
  "frame border", "passe-partout",
  "oil painting", "watercolor", "ink illustration",
  "flat 2D illustration", "anime line art", "manga shading",
  // Hard ban on the entire photographic family — this is the one
  // thing keeping us out of MetaHuman-photo limbo.
  "photograph", "raw photograph", "real photograph",
  "DSLR photo", "candid photograph", "snapshot",
  "documentary photo", "paparazzi shot", "street photography",
  "fashion editorial photograph", "wedding photograph",
  "cinematic film still", "live-action movie still",
  "real woman portrait", "real human photograph",
  // Weak-CG failure modes.
  "low-poly", "blocky polygons", "untextured mesh", "clay render",
  // Safety
  "child", "infant", "underage", "teenager",
  "nsfw", "explicit", "nudity",
].join(", ");

/**
 * Per-zodiac mood enrichment. The catalogue (`data/play-assets.ts`)
 * keeps the visual identity terse (4–6 words). For the AI we layer on
 * additional palette + atmosphere cues so the output reads as that
 * zodiac at a glance. Adjusting these is the cheapest way to tune
 * gallery quality — no DB or UI changes needed.
 */
const ZODIAC_MOOD: Record<ZodiacId, string> = {
  aries:
    "warm ember and crimson tones, glowing solar fire motifs, " +
    "ash-warm dramatic side light, faint heat shimmer",
  taurus:
    "lush jade and bronze tones, soft earthen textures, " +
    "honeyed harvest light, gentle wind through grass",
  gemini:
    "duality of warm and cool, mercurial silver-blue palette, " +
    "split-light composition, mirror motif, dreamy double exposure",
  cancer:
    "lunar pearl and silver tones, soft tide reflections, " +
    "moonlight rim, hushed cool ambient glow",
  leo:
    "regal sun-gold and amber tones, mane-like crown of light, " +
    "warm golden-hour rim, theatrical spotlight",
  virgo:
    "ivory and harvest-gold tones, woven wheat motifs, " +
    "soft dawn light, refined editorial restraint",
  libra:
    "rose-gold and twilight-pink tones, balanced symmetric composition, " +
    "soft diffused light, romantic dusk atmosphere",
  scorpio:
    "deep magenta and obsidian tones, smoky velvet textures, " +
    "low-key oracle lighting, mysterious shadowed gaze",
  sagittarius:
    "amber and bronze tones, traveller-at-sunset palette, " +
    "warm long shadows, distant horizon glow",
  capricorn:
    "slate and graphite tones with cool stone-grey palette, " +
    "mountain-dusk light, austere composed atmosphere",
  aquarius:
    "electric blue and silver tones, current-of-stars veil motif, " +
    "polar dawn light, futuristic luminous accents",
  pisces:
    "seafoam and soft teal tones, dream-tide textures, " +
    "underwater diffused light, gentle reflective shimmer",
};

/**
 * Stable hash → 32-bit non-negative integer. Used as the model seed.
 * Cheap FNV-1a; not cryptographic, but deterministic across runs.
 */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Defensive cap mirroring lib/play/brief.ts so the prompt builder
 *  can be called from tests without going through the API route. */
const PROMPT_BRIEF_CAP = 200;

/** Defensive cap for outfit fragments — Stylist Caelinus AI is the
 *  only producer today (curated copy in `data/play-outfits.ts`), but
 *  trimming here keeps a future "free-form outfit" extension from
 *  ever blowing the prompt budget. */
const PROMPT_OUTFIT_CAP = 240;

export function buildPlayPrompt(input: PromptInput): PromptOutput {
  const archetype = findArchetype(input.archetype);
  const zodiac = findZodiac(input.zodiac);
  const scene = findScene(input.scene);
  const variant = Math.max(1, Math.floor(input.variant ?? 1));
  const brief = (input.brief ?? "").trim().slice(0, PROMPT_BRIEF_CAP);
  const outfitFragment = (input.outfit?.prompt ?? "")
    .trim()
    .slice(0, PROMPT_OUTFIT_CAP);
  const outfitId = (input.outfit?.id ?? "").trim();

  if (!archetype || !zodiac || !scene) {
    throw new Error(
      `[play prompt] unknown id — ` +
        `archetype=${input.archetype} zodiac=${input.zodiac} scene=${input.scene}`,
    );
  }

  const moodSuffix = ZODIAC_MOOD[zodiac.id] ?? "";

  const prompt = [
    STYLE_BASE,
    `figure: ${archetype.prompt}`,
    `archetype: ${zodiac.label.en} (${zodiac.id}) — ${zodiac.prompt}`,
    moodSuffix ? `mood: ${moodSuffix}` : null,
    // Outfit lands BEFORE the scene clause so the figure description
    // and the garment description are still adjacent — gpt-image-1
    // tends to bind clothing tightly to whichever clause is closest
    // to the figure description in the prompt.
    outfitFragment ? `outfit: ${outfitFragment}` : null,
    `scene: ${scene.prompt}`,
    // Brief lives last so SDXL sees the user's note as an over-ride
    // applied on top of the canonical mood. The wrapping clause keeps
    // it out of negative-prompt territory.
    brief ? `personal brief: ${brief}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  // Seed embeds variant + brief + outfit so v1/v2/v3, brief-vs-no-brief
  // and outfit-vs-no-outfit all produce visibly distinct outputs.
  // v1 with no brief and no outfit keeps the original deterministic
  // seed (back-compat with renders cached before F2a / F2b / F2c).
  const seedParts: string[] = [input.archetype, input.zodiac, input.scene];
  if (variant !== 1) seedParts.push(`v${variant}`);
  if (brief) seedParts.push(`b:${brief}`);
  if (outfitId) seedParts.push(`o:${outfitId}`);
  const seed = fnv1a(seedParts.join(":"));

  return {
    prompt,
    negativePrompt: NEGATIVE_BASE,
    seed,
  };
}

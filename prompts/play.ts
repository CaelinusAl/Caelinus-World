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
};

export type PromptOutput = {
  prompt: string;
  negativePrompt: string;
  /** Deterministic seed derived from the triple — same triple maps to
   *  the same seed so retries return visually similar outputs. */
  seed: number;
};

const STYLE_BASE =
  // Caelinus house style — cinematic poster, warm-cool nebula light,
  // editorial composition. Aiming for "moon-temple poster" vibe.
  [
    "cinematic poster portrait of a goddess archetype",
    "centred composition, full body or three-quarter framing",
    "soft warm rim light, magenta-and-cosmic nebula palette",
    "subtle iridescent halo, delicate iridescent skin sheen",
    "rich shadows, painterly brushwork, fashion-editorial styling",
    "high detail face and hands, anatomically correct",
    "ultra-sharp focus on subject, gentle bokeh background",
    "art-direction: caelinus moon temple, cinematic, magazine cover",
  ].join(", ");

const NEGATIVE_BASE =
  [
    "extra fingers", "extra limbs", "deformed", "disfigured",
    "lowres", "blurry", "watermark", "text", "logo",
    "bad anatomy", "long neck", "fused fingers", "double face",
    "child", "infant", "underage",
    "nsfw", "explicit", "nudity",
  ].join(", ");

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

export function buildPlayPrompt(input: PromptInput): PromptOutput {
  const archetype = findArchetype(input.archetype);
  const zodiac = findZodiac(input.zodiac);
  const scene = findScene(input.scene);

  if (!archetype || !zodiac || !scene) {
    throw new Error(
      `[play prompt] unknown id — ` +
        `archetype=${input.archetype} zodiac=${input.zodiac} scene=${input.scene}`,
    );
  }

  const prompt = [
    STYLE_BASE,
    `figure: ${archetype.prompt}`,
    `archetype: ${zodiac.label.en} (${zodiac.id}) — ${zodiac.prompt}`,
    `scene: ${scene.prompt}`,
    "shot on 85mm, shallow depth of field, soft volumetric haze",
  ].join(". ");

  const seed = fnv1a(`${input.archetype}:${input.zodiac}:${input.scene}`);

  return {
    prompt,
    negativePrompt: NEGATIVE_BASE,
    seed,
  };
}

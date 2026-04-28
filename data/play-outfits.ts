/**
 * Play studio outfit catalogue — Stylist Caelinus AI.
 *
 * Bridges `data/products.ts` (the live commerce catalogue) and
 * `prompts/play.ts` (the AI prompt builder). Each entry pairs a real
 * shop product with a tight AI prompt fragment ("wearing a regal
 * sun-gold bikini …") that the render route folds into the figure
 * description.
 *
 * Why a separate file:
 *   • The shop catalogue is allowed to grow (sizes, stock, copy) —
 *     this list stays small and curated; only outfits we've vetted
 *     for AI rendering live here.
 *   • Prompt fragments need their own editing loop (different from
 *     marketing copy in products.ts), so isolating them keeps
 *     iteration cheap.
 *
 * Cache impact: an outfit selection adds an `-o<id>` suffix to the
 * cache key (see `lookCacheKey`), so two users picking the same look
 * with the same outfit hit the same Storage row — same Capricorn
 * Resort + Stone Siren bikini = one render, served instantly.
 */

import { products } from "@/data/products";
import type { ZodiacId } from "@/data/play-assets";

export type PlayOutfitCategory = "bikini" | "pareo" | "jewelry" | "bag" | "heels";

/**
 * FASHN VTON body-region category. Tells the FASHN model which slot
 * of the silhouette the garment occupies, which it uses to choose
 * the right segmentation mask + try-on path.
 *
 *   • "tops"        — shirts / bras / bikini tops only
 *   • "bottoms"     — shorts / skirts / bikini bottoms only
 *   • "one-pieces"  — dresses, jumpsuits, bodysuits, *bikini sets
 *                     treated as a single garment*, pareos worn as a
 *                     wrap dress
 *   • "auto"        — let FASHN inspect the garment photo and pick
 *
 * `null` means the outfit isn't a transferable garment (jewelry, bags,
 * heels) — those still go through the OpenAI image-edit path because
 * FASHN is garment-only and won't render an accessory.
 */
export type PlayOutfitVtonCategory =
  | "tops"
  | "bottoms"
  | "one-pieces"
  | "auto"
  | null;

export type PlayOutfit = {
  /** Mirrors the product id from `data/products.ts` so cache keys
   *  + buy links stay aligned with the shop catalogue. */
  id: string;
  name: string;
  category: PlayOutfitCategory;
  /** Display copy from the shop (already includes currency). */
  price: string;
  /** Optional zodiac affinity — used to surface the matching outfit
   *  first when the avatar's zodiac lines up. */
  zodiac?: ZodiacId;
  /** 8-15 word fragment injected into the figure prompt. Should
   *  describe silhouette, palette, materials and signature detail —
   *  but never include brand/series proper nouns (gpt-image-1 will
   *  print readable proper nouns into the canvas as visible text). */
  prompt: string;
  /** Public path to the real shop photo. Used as a *visual reference*
   *  when the OpenAI image-edit pipeline is engaged: the goddess gets
   *  the actual garment from this image painted onto her, instead of
   *  the AI's own interpretation of the prompt fragment. Mirrors the
   *  `image` column from `data/products.ts`. */
  imageUrl: string;
  /** FASHN body region. Set for garments (bikini, pareo) so the route
   *  can prefer FASHN VTON for pixel-perfect transfer. `null` for
   *  accessories — those stay on the OpenAI image-edit path. */
  vtonCategory: PlayOutfitVtonCategory;
  /** Click target for the "Hemen Al" CTA. Routes into the live shop
   *  with the product highlighted. */
  buyHref: string;
};

/** ────────────────────────────────────────────────────────────────
 *  Prompt fragments. Keep each line short, vivid and brand-name-free.
 *  Heavy on silhouette + palette + material so the AI commits to the
 *  garment instead of ghosting it.
 *  ──────────────────────────────────────────────────────────────── */
const OUTFIT_PROMPTS: Record<string, string> = {
  // ─── 12 zodiac bikinis ───
  b1:  "wearing a luxury triangular bikini in ember-red with sun-fire embroidery and ash-gold side bands",
  b2:  "wearing a luxury bikini in jade and bronze tones, earthen woven texture, mossy green palette",
  b3:  "wearing a twin-tone mercurial silver-blue bikini with split-light tie details and dual ribbon hardware",
  b4:  "wearing a pearl-silver bikini with lunar tide drape and moonlit halo trim",
  b5:  "wearing a regal sun-gold bikini with mane-like crown straps and golden-hour shimmer",
  b6:  "wearing an ivory pearl-coded bikini with refined editorial geometry and harvest-gold accents",
  b7:  "wearing a rose-gold bikini with twilight-pink balance details and venus drape",
  b8:  "wearing an obsidian black bikini with deep magenta velvet trim and oracle-night sheen",
  b9:  "wearing an amber-and-bronze bikini with golden-arrow hardware and traveller-at-sunset palette",
  b10: "wearing a slate stone-toned bikini with sculpted siren cups and rose-gold side-tie hardware",
  b11: "wearing an electric blue bikini with star-current shimmer veil and polar-dawn metallic accents",
  b12: "wearing a seafoam teal bikini with dream-tide drape and gentle reflective shimmer",
  // ─── 3 pareos (silk wraps) ───
  pr1: "draped in a flowing golden nebula silk pareo with iridescent shimmer dancing in the wind",
  pr2: "wrapped in a gaia silk pareo with earthen mossy palette and woven hand-craft texture",
  pr3: "draped in a moonlight silk pareo flowing like tide with soft pearl-silver shimmer",
  // ─── 4 jewellery (layer atop any base) ───
  j1:  "wearing a delicate frequency pendant on the chest with subtle iridescent gemstone",
  j2:  "wearing an ornate zodiac chain across the collarbone with twelve constellation links",
  j3:  "wearing a moon-shaped silver ring with subtle pearl reflection on the index finger",
  j4:  "wearing a crystal ear cuff that catches light with a faint prismatic shimmer",
  // ─── 3 bags (held in hand or on shoulder) ───
  bg1: "carrying a small cosmos clutch bag with starlit lacquer finish and minimalist hardware",
  bg2: "shouldering an eclipse tote bag in dark slate leather with rose-gold edge piping",
  bg3: "holding a stardust mini bag in pearlescent finish with delicate chain strap",
  // ─── 3 heels (visible only when full-body framing) ───
  h1:  "wearing venus stiletto heels with translucent crystal straps and sculpted silver platform",
  h2:  "wearing celestial mule heels in soft ivory with woven harvest-gold leather details",
  h3:  "wearing aurora sandals with gradient pastel straps echoing northern-lights palette",
};

/** Build the outfit list from the live products catalogue so adding
 *  a new product (with its prompt above) automatically surfaces in
 *  the stylist panel — no second registry to update. */
const SHOP_PRODUCTS = products as ReadonlyArray<{
  id: string;
  name: string;
  category: string;
  price: string;
  zodiac?: ZodiacId;
  image: string;
}>;

/**
 * Map a shop category to a FASHN VTON body region. Keep this map in
 * sync with the FASHN endpoint's `category` enum.
 *
 *   • bikini → "one-pieces" — bikini sets are two separate garments
 *     in real life, but FASHN's VTON model handles them best as a
 *     single one-piece transfer (treating top + bottom as a coherent
 *     outfit). "tops" alone leaves the figurine pant-less; "bottoms"
 *     alone leaves her in a default top. "one-pieces" gives us the
 *     full coordinated set in one render.
 *   • pareo  → "one-pieces" — silk wrap effectively functions as a
 *     wrap dress for the model.
 *   • jewelry / bag / heels → null — FASHN doesn't model accessories,
 *     so we leave them on the OpenAI image-edit fallback path.
 */
function vtonCategoryFor(
  shopCategory: PlayOutfitCategory,
): PlayOutfitVtonCategory {
  switch (shopCategory) {
    case "bikini":
      return "one-pieces";
    case "pareo":
      return "one-pieces";
    case "jewelry":
    case "bag":
    case "heels":
    default:
      return null;
  }
}

export const PLAY_OUTFITS: readonly PlayOutfit[] = SHOP_PRODUCTS
  .filter((p) => Boolean(OUTFIT_PROMPTS[p.id]))
  .map((p) => {
    const category = p.category as PlayOutfitCategory;
    return {
      id: p.id,
      name: p.name,
      category,
      price: p.price,
      zodiac: p.zodiac,
      prompt: OUTFIT_PROMPTS[p.id]!,
      imageUrl: p.image,
      vtonCategory: vtonCategoryFor(category),
      buyHref: `/universe/shop?product=${p.id}`,
    };
  });

export function findOutfit(id: string | null | undefined): PlayOutfit | null {
  if (!id) return null;
  return PLAY_OUTFITS.find((o) => o.id === id) ?? null;
}

/**
 * Curated 4-tile carousel for the stylist panel. Strategy:
 *   • Slot 1 — zodiac-matched bikini if one exists ("Aslan → Solar Queen")
 *   • Slot 2 — first pareo (always available across all zodiacs)
 *   • Slot 3 — first jewellery piece
 *   • Slot 4 — bag or heels for accessory rotation
 *
 * Falls back to the first four entries when the zodiac doesn't match
 * a bikini (defensive — the catalogue covers all 12 signs).
 */
export function curatedForZodiac(
  zodiac: ZodiacId | null | undefined,
): readonly PlayOutfit[] {
  const fallback = PLAY_OUTFITS.slice(0, 4);
  if (!zodiac) return fallback;

  const signatureBikini = PLAY_OUTFITS.find(
    (o) => o.zodiac === zodiac && o.category === "bikini",
  );
  const pareo = PLAY_OUTFITS.find((o) => o.category === "pareo");
  const jewel = PLAY_OUTFITS.find((o) => o.category === "jewelry");
  const bag = PLAY_OUTFITS.find((o) => o.category === "bag");

  const slots = [signatureBikini, pareo, jewel, bag].filter(
    (x): x is PlayOutfit => Boolean(x),
  );

  // Pad up to four with anything unique we haven't already shown.
  const seen = new Set(slots.map((o) => o.id));
  for (const o of PLAY_OUTFITS) {
    if (slots.length >= 4) break;
    if (seen.has(o.id)) continue;
    slots.push(o);
    seen.add(o.id);
  }
  return slots.slice(0, 4);
}

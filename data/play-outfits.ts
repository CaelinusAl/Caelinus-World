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
  /** FASHN body region. Set for garments routed through the live VTON
   *  pipeline; `null` means the outfit is either an accessory or it
   *  hasn't been pre-warmed yet (see `comingSoon`). */
  vtonCategory: PlayOutfitVtonCategory;
  /** Phase-1 scope flag. When `true`, the stylist panel paints a
   *  "Çok yakında" badge over the tile and disables the click-to-
   *  render action — the catalogue stays visible to the user (and
   *  the investor) but we don't spend FASHN credit until the warm-up
   *  pipeline catches up. Bikinis are launch-ready; pareos +
   *  accessories ride on this flag for now. */
  comingSoon: boolean;
  /**
   * Phase-1 cost-control: pre-rendered shop hero shot for the bikini
   * worn on a real model. When set, clicking the tile *swaps the
   * canvas image directly to this URL* instead of firing the live
   * render pipeline (no AI call, no FASHN credit, no Supabase round-
   * trip — just an instant <img src> swap).
   *
   * Why we ship pre-rendered shop photos for the gallery:
   *   • The shop already commissioned 12 designer-quality lookbook
   *     images at /public/play/shop/{zodiac}-look.jpg — they're more
   *     polished than anything the AI produces today.
   *   • $0 marginal cost per click. Investor demo, viral-share-worthy
   *     gallery and "kiyafet değiştir oyunu" use cases all fit here.
   *   • Bare avatar still goes through gpt-image-1 so the user gets
   *     their *own* curated CG figurine when no outfit is on; only
   *     the outfit-on view jumps to the pre-rendered shop frame.
   *
   * `null` means there's no pre-made image — the panel still works
   * if `comingSoon` is `true` (tile is locked) or, in the future,
   * we wire the outfit through the live FASHN VTON path.
   */
  previewImage: string | null;
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
 * Map a shop category to a FASHN VTON body region.
 *
 * Phase-1 scope decision (2026-04-29): only bikinis go through FASHN.
 * Pareos, jewelry, bags and heels stay UI-visible but render-disabled
 * so we can showcase the catalogue without spending FASHN credit on
 * them yet. Their `vtonCategory` is therefore `null` and the stylist
 * panel paints a "Çok yakında" badge over them (see `comingSoon`).
 *
 *   • bikini → "one-pieces" — FASHN handles a two-piece bikini best
 *     when treated as a single one-piece transfer (top + bottom in
 *     one shot). "tops"/"bottoms" alone leaves the figurine half-
 *     dressed.
 *   • everything else → null
 */
function vtonCategoryFor(
  shopCategory: PlayOutfitCategory,
): PlayOutfitVtonCategory {
  switch (shopCategory) {
    case "bikini":
      return "one-pieces";
    case "pareo":
    case "jewelry":
    case "bag":
    case "heels":
    default:
      return null;
  }
}

/**
 * Resolve the *FASHN reference image* for a bikini. The shop hero
 * shots under `/play/shop/*-look.jpg` are model-on photos at low
 * resolution (~125–235 KB), which are too noisy for FASHN — the
 * model picks up on the photo's lighting + pose and blends them in.
 *
 * Under `/public/play/bikinis/{zodiac}.png` we keep *isolated*
 * 2 MB+ flat-lay-style renders of each bikini — perfect FASHN
 * references because there's no human model competing with the
 * goddess in image #1. We swap the model-on shop image for the
 * isolated bikini whenever a zodiac mapping exists; otherwise fall
 * back to the shop hero so nothing breaks.
 *
 * NOTE — this only matters when the live FASHN pipeline is engaged
 * (premium tier / future). In Phase-1 we ship pre-rendered shop
 * frames via `previewImage` and bypass FASHN entirely, so this
 * helper is currently dormant but kept ready.
 */
function bikiniReferenceImage(
  productImage: string,
  zodiac: ZodiacId | undefined,
): string {
  if (!zodiac) return productImage;
  return `/play/bikinis/${zodiac}.png`;
}

/**
 * Phase-1 outfit preview image — the lookbook frame the canvas swaps
 * to instantly when the user clicks a tile. Today, only bikinis have
 * pre-made shop hero shots that survive a full-frame swap (real model
 * wearing the suit at studio quality), so we light those up. Pareos
 * and accessories return `null` and the tile stays locked until the
 * live FASHN pipeline ships for them.
 */
function bikiniPreviewImage(
  zodiac: ZodiacId | undefined,
): string | null {
  if (!zodiac) return null;
  return `/play/shop/${zodiac}-look.jpg`;
}

/** Shop categories that should still appear in the stylist panel
 *  but are *not yet* wired to a live render path. The UI gates them
 *  with a "Çok yakında" badge; clicking is a no-op. Bumping a
 *  category off this set is the trigger for the next FASHN warm-up
 *  pass. */
const COMING_SOON_CATEGORIES: ReadonlySet<PlayOutfitCategory> = new Set([
  "pareo",
  "jewelry",
  "bag",
  "heels",
]);

export const PLAY_OUTFITS: readonly PlayOutfit[] = SHOP_PRODUCTS
  .filter((p) => Boolean(OUTFIT_PROMPTS[p.id]))
  .map((p) => {
    const category = p.category as PlayOutfitCategory;
    const isBikini = category === "bikini";
    return {
      id: p.id,
      name: p.name,
      category,
      price: p.price,
      zodiac: p.zodiac,
      prompt: OUTFIT_PROMPTS[p.id]!,
      imageUrl: isBikini ? bikiniReferenceImage(p.image, p.zodiac) : p.image,
      vtonCategory: vtonCategoryFor(category),
      comingSoon: COMING_SOON_CATEGORIES.has(category),
      previewImage: isBikini ? bikiniPreviewImage(p.zodiac) : null,
      buyHref: `/universe/shop?product=${p.id}`,
    };
  });

export function findOutfit(id: string | null | undefined): PlayOutfit | null {
  if (!id) return null;
  return PLAY_OUTFITS.find((o) => o.id === id) ?? null;
}

/**
 * Resolve the signature bikini outfit for a zodiac sign. Used by the
 * Phase-1 auto-preview flow on `/play`: as soon as the user taps a
 * zodiac glyph, we drop her into the matching designer-curated shop
 * frame from `/public/play/shop/` — no archetype, no scene, no AI
 * round-trip required. Each zodiac has exactly one signature bikini,
 * but we still defensively return `null` if the catalogue ever drifts.
 */
export function findSignatureBikini(
  zodiac: ZodiacId | null | undefined,
): PlayOutfit | null {
  if (!zodiac) return null;
  return (
    PLAY_OUTFITS.find(
      (o) => o.zodiac === zodiac && o.category === "bikini",
    ) ?? null
  );
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

/**
 * Rule-based avatar → size & product fit (no ML).
 * Tuning: adjust BODY_CATEGORY_SCORE and size float weights only.
 */

import type { AvatarConfig, BodyType, BustSize } from "@/types/avatar";
import type { ProductExtended, ProductSize, ShopCategory } from "@/types/play";

export type RecommendationTag = "best_fit" | "highlight";

export type AvatarProductRecommendation = {
  recommendedSize: ProductSize;
  fitScore: number;
  tags: RecommendationTag[];
  /** Short debug / tooltip copy */
  rationale: string;
};

/**
 * İki bedenli koleksiyon (XS-S, M-L). computeSizeFloat 0–4 ölçeğinde döner;
 * her bedeni o ölçekte temsilî bir noktaya bağlarız ki "en yakın beden" ve
 * fit skoru tutarlı kalsın (eşik ~2: altı XS-S, üstü M-L).
 */
const SIZE_REP: Record<ProductSize, number> = {
  "XS-S": 1,
  "M-L": 3,
};

function sizeToIndex(s: ProductSize): number {
  return SIZE_REP[s] ?? 2;
}

/** Continuous 0–4 (XS…XL) from body metrics */
export function computeSizeFloat(cfg: AvatarConfig): number {
  const bustBase: Record<BustSize, number> = {
    s: 0.85,
    m: 2,
    l: 3.15,
    xl: 3.75,
  };

  let v = bustBase[cfg.bustSize];
  v += (cfg.hipRatio - 1) * 2.15;
  v += ((cfg.height - 168) / 26) * 0.5;
  v += ((cfg.weight - 58) / 21) * 0.42;

  const bodyBump: Record<BodyType, number> = {
    petite: -0.95,
    balanced: 0,
    curvy: 1.15,
    runway: 0.4,
  };
  v += bodyBump[cfg.bodyType];

  return Math.max(0, Math.min(4, v));
}

function nearestSize(floatV: number, sizes: ProductSize[]): ProductSize {
  const uniq = [...new Set(sizes)];
  let best = uniq[0];
  let bestD = Infinity;
  for (const s of uniq) {
    const d = Math.abs(sizeToIndex(s) - floatV);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/** Pick nearest size that has stock; fallback to ideal */
export function recommendSizeForProduct(
  cfg: AvatarConfig,
  product: ProductExtended
): ProductSize {
  const floatV = computeSizeFloat(cfg);
  const ideal = nearestSize(floatV, product.sizes);
  if ((product.stock[ideal] ?? 0) > 0) return ideal;

  const ranked = [...product.sizes].sort(
    (a, b) =>
      Math.abs(sizeToIndex(a) - floatV) - Math.abs(sizeToIndex(b) - floatV)
  );
  const inStock = ranked.find((s) => (product.stock[s] ?? 0) > 0);
  return inStock ?? ideal;
}

const BODY_CATEGORY_SCORE: Record<
  BodyType,
  Partial<Record<Exclude<ShopCategory, "all">, number>>
> = {
  petite: { bikini: 14, pareo: 11, bag: 7, heels: 17, jewelry: 9 },
  balanced: { bikini: 18, pareo: 18, bag: 12, heels: 12, jewelry: 12 },
  curvy: { bikini: 23, pareo: 21, bag: 9, heels: 7, jewelry: 14 },
  runway: { bikini: 15, pareo: 13, bag: 14, heels: 22, jewelry: 11 },
};

function archetypeFrequencyBonus(
  archetype: string,
  product: ProductExtended
): number {
  const f = product.frequency ?? "";
  if (archetype === "cosmic" && f.includes("852")) return 6;
  if (archetype === "golden" && (f.includes("741") || f.includes("639")))
    return 5;
  if (archetype === "athletic" && product.category === "bikini") return 5;
  if (archetype === "curvy" && product.category === "pareo") return 5;
  if (archetype === "minimal" && product.category === "jewelry") return 4;
  return 0;
}

export function computeFitScore(
  cfg: AvatarConfig,
  product: ProductExtended,
  recommendedSize: ProductSize
): number {
  let score = 48;
  const cat = product.category as Exclude<ShopCategory, "all">;
  score += BODY_CATEGORY_SCORE[cfg.bodyType][cat] ?? 10;
  score += archetypeFrequencyBonus(cfg.archetype, product);

  const floatV = computeSizeFloat(cfg);
  const idealIdx = sizeToIndex(nearestSize(floatV, product.sizes));
  const chosenIdx = sizeToIndex(recommendedSize);
  score += Math.max(0, 14 - Math.abs(idealIdx - chosenIdx) * 5);

  const st = product.stock[recommendedSize] ?? 0;
  if (st > 8) score += 7;
  else if (st > 0) score += 3;
  else score -= 12;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildRationale(cfg: AvatarConfig, size: ProductSize): string {
  return `${cfg.bodyType} · gogus ${cfg.bustSize.toUpperCase()} · kalca orani ${cfg.hipRatio.toFixed(2)} → oneri ${size}`;
}

function assignTags(rankIndex: number, total: number): RecommendationTag[] {
  if (total <= 0) return [];
  const bestCut = Math.max(1, Math.ceil(total * 0.18));
  const hiCut = Math.max(bestCut + 1, Math.ceil(total * 0.45));
  const tags: RecommendationTag[] = [];
  if (rankIndex < bestCut) tags.push("best_fit");
  if (rankIndex >= bestCut && rankIndex < hiCut) tags.push("highlight");
  return tags;
}

/**
 * Full map productId → recommendation for a product list (e.g. current category).
 */
export function buildRecommendationIndex(
  cfg: AvatarConfig,
  products: ProductExtended[]
): Map<string, AvatarProductRecommendation> {
  const rows = products.map((product) => {
    const recommendedSize = recommendSizeForProduct(cfg, product);
    const fitScore = computeFitScore(cfg, product, recommendedSize);
    return {
      product,
      recommendedSize,
      fitScore,
      rationale: buildRationale(cfg, recommendedSize),
    };
  });

  rows.sort((a, b) => b.fitScore - a.fitScore);
  const n = rows.length;
  const map = new Map<string, AvatarProductRecommendation>();

  rows.forEach((row, idx) => {
    map.set(row.product.id, {
      recommendedSize: row.recommendedSize,
      fitScore: row.fitScore,
      tags: assignTags(idx, n),
      rationale: row.rationale,
    });
  });

  return map;
}

export function getTopRecommendedProducts(
  cfg: AvatarConfig,
  products: ProductExtended[],
  limit = 6
): ProductExtended[] {
  const rows = products.map((product) => {
    const recommendedSize = recommendSizeForProduct(cfg, product);
    const fitScore = computeFitScore(cfg, product, recommendedSize);
    return { product, fitScore };
  });
  rows.sort((a, b) => b.fitScore - a.fitScore);
  return rows.slice(0, limit).map((r) => r.product);
}

/** API / diagnostics: full list with scores */
export function buildRecommendationPayload(cfg: AvatarConfig, products: ProductExtended[]) {
  const index = buildRecommendationIndex(cfg, products);
  const items = products.map((p) => {
    const rec = index.get(p.id)!;
    return {
      productId: p.id,
      recommendedSize: rec.recommendedSize,
      fitScore: rec.fitScore,
      tags: rec.tags,
      rationale: rec.rationale,
    };
  });
  items.sort((a, b) => b.fitScore - a.fitScore);
  return {
    avatarSummary: {
      bodyType: cfg.bodyType,
      bustSize: cfg.bustSize,
      hipRatio: cfg.hipRatio,
      sizeFloat: computeSizeFloat(cfg),
    },
    items,
  };
}

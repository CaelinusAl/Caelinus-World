/**
 * Caelinus AI — Try-on Variants.
 *
 * Cloth simulation YOK ama "denediğini hissettir" istiyoruz.
 * Bu modül her bir Caelinus mesh varyantını (`selin*.glb`) bir ürünün
 * "üzerine giyilmiş hâli" gibi sunar.
 *
 * Mantık:
 *   • Kullanıcı try-on sayfasında bir ürün seçer
 *   • Ürünün id'sinden + (varsa) zodiac'ından deterministic bir
 *     hash hesaplanır
 *   • Hash variant listesinin uzunluğuna göre modulo'lanır → her ürün
 *     için tutarlı bir variant seçilir (aynı ürün hep aynı görünür)
 *   • Scene avatar.glbUrl'ünü bu variant'a override eder
 *
 * Sonuç: kullanıcı her ürünü tıkladığında bedeninin görünümü gerçekten
 * değişir — Caelinus o ürünün enerjisinde başka bir "sen"i gösterir.
 *
 * URL encoding: dosya isimlerinde boşluk olabilir (`selin (1).glb`).
 * Tarayıcı için `encodeURI` ile space → %20.
 */

import type { Product } from "@/types/play";

/**
 * /public/models altındaki Caelinus selin varyantları. Sıra önemli
 * (deterministic hash bu sıraya göre map yapar). Yeni dosya eklenirse
 * SONUNA eklenmeli — yoksa mevcut ürün-variant eşlemeleri kayar.
 */
const RAW_VARIANTS = [
  "/models/selin.glb",
  "/models/selin (1).glb",
  "/models/selin(2).glb",
  "/models/selin(3).glb",
  "/models/selin (3).glb",
  "/models/selin(4).glb",
  "/models/selin (5).glb",
  "/models/selin (6).glb",
  "/models/selin (7).glb",
] as const;

/** URL-encoded variant listesi — Three.js GLTFLoader buradan alır. */
export const TRYON_VARIANTS: string[] = RAW_VARIANTS.map((u) => encodeURI(u));

/** Variant sayısı — UI'da "1/8 deneniyor" göstergesi gibi şeyler için. */
export const TRYON_VARIANT_COUNT = TRYON_VARIANTS.length;

/* ─────────────────────────────────────────────────────────
   Hash + mapping
   ───────────────────────────────────────────────────────── */

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Ürün için deterministic variant URL'i. Ürün id'si + zodiac (varsa)
 * tek bir tohum yapar — aynı ürün her zaman aynı varyantta görünür.
 */
export function getVariantForProduct(p: Product): string {
  const seed = `${p.id}|${p.zodiac ?? p.category}`;
  const idx = hashString(seed) % TRYON_VARIANTS.length;
  return TRYON_VARIANTS[idx];
}

/** Variant index — kullanıcıya "X. siluet" gibi gösterilebilir. */
export function getVariantIndexForProduct(p: Product): number {
  const seed = `${p.id}|${p.zodiac ?? p.category}`;
  return hashString(seed) % TRYON_VARIANTS.length;
}

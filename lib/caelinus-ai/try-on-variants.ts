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
 * Sadeleştirme (2026-06): eski 9 "selin*.glb" silüet varyantı kaldırıldı.
 * Avatarlar yapımda (2026): kalan tüm bedenler de hatalı oldukları için
 * kaldırıldı, liste şu an BOŞ. Try-on yüzeyi (TryOnSection) zaten
 * AVATARS_IN_PRODUCTION ile placeholder'a düştüğünden buradaki URL'ler
 * render'a ulaşmaz; API geriye dönük uyumluluk için korunur ve boş listede
 * güvenle "" döner.
 */

import type { Product } from "@/types/play";

/**
 * Try-on beden varyantları — şu an BOŞ (avatarlar yapımda).
 */
const RAW_VARIANTS: readonly string[] = [];

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
  if (TRYON_VARIANTS.length === 0) return "";
  const seed = `${p.id}|${p.zodiac ?? p.category}`;
  const idx = hashString(seed) % TRYON_VARIANTS.length;
  return TRYON_VARIANTS[idx];
}

/** Variant index — kullanıcıya "X. siluet" gibi gösterilebilir. */
export function getVariantIndexForProduct(p: Product): number {
  if (TRYON_VARIANTS.length === 0) return 0;
  const seed = `${p.id}|${p.zodiac ?? p.category}`;
  return hashString(seed) % TRYON_VARIANTS.length;
}

/**
 * prefers-reduced-motion yardımcıları.
 *
 * Anime.js animasyonları erişilebilirlik için bu bayrağı dinler:
 * kullanıcı "hareketi azalt" derse animasyonları çalıştırmaz, içeriği
 * doğrudan son hâlinde gösterir.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

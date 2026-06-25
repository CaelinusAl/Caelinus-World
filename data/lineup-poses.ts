/**
 * SHOP LINEUP — burç → seçili manken pozu (şeffaf cutout).
 *
 * Her bikini için tek bir "tam boy ayakta" poz seçilir; shop girişindeki
 * yan-yana figür dizisi (BikiniLineup) bunları kullanır.
 *
 * Dosyalar: public/products/<burç>/<dosya>  (arka planı kaldırılmış PNG).
 * Pozlar scripts/pick-lineup-poses.py ile alfa-bbox boy/en oranına göre
 * otomatik seçildi; istenirse buradan elle değiştirilebilir.
 */
export const LINEUP_POSES: Record<string, string> = {
  aries: "IMG_9121-trim.webp",
  taurus: "IMG_8924-trim.webp",
  gemini: "IMG_8922-trim.webp",
  cancer: "IMG_8926-trim.webp",
  leo: "IMG_8951-trim.webp",
  virgo: "IMG_9077-trim.webp",
  libra: "IMG_8914-trim.webp",
  scorpio: "IMG_9137-trim.webp",
  sagittarius: "IMG_8928-trim.webp",
  capricorn: "IMG_8930-trim.webp",
  aquarius: "IMG_8916-trim.webp",
  pisces: "IMG_8943-trim.webp",
};

/** Lineup figürü için tam public path döndürür. */
export function lineupPoseSrc(zodiac?: string | null): string | null {
  if (!zodiac) return null;
  const file = LINEUP_POSES[zodiac];
  return file ? `/products/${zodiac}/${file}` : null;
}

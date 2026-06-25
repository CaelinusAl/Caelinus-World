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
  aries: "IMG_9121-cutout.png",
  taurus: "IMG_8924-cutout.png",
  gemini: "IMG_8922-cutout.png",
  cancer: "IMG_8926-cutout.png",
  leo: "IMG_8951-cutout.png",
  virgo: "IMG_9077-cutout.png",
  libra: "IMG_8914-cutout.png",
  scorpio: "IMG_9137-cutout.png",
  sagittarius: "IMG_8928-cutout.png",
  capricorn: "IMG_8930-cutout.png",
  aquarius: "IMG_8916-cutout.png",
  pisces: "IMG_8943-cutout.png",
};

/** Lineup figürü için tam public path döndürür. */
export function lineupPoseSrc(zodiac?: string | null): string | null {
  if (!zodiac) return null;
  const file = LINEUP_POSES[zodiac];
  return file ? `/products/${zodiac}/${file}` : null;
}

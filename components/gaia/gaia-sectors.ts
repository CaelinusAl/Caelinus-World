/**
 * Gaia'nın Bahçesi — 360° sektörler (ilk aşama).
 *
 * Kullanıcı bahçenin ortasında durur; sürükledikçe dünya 360° döner ve her
 * yönde bir sektör belirir: sebze bahçeleri, meyve bahçeleri, şifalı bitkiler
 * ve dükkanlar. Her sektör bir totem (işaret taşı) ile tıklanabilir → o
 * dünyaya "gir" (journey-dalışı).
 */

export type SectorKind = "veg" | "fruit" | "herb" | "shop";

export type GaiaSector = {
  id: string;
  label: string;
  kind: SectorKind;
  /** İmza rengi (totem ışığı + journey veil). */
  color: string;
  blurb: string;
  href: string;
  glyph: string;
};

/** Bahçenin yarıçapı — sektörler bu mesafede kullanıcıyı çevreler. */
export const GARDEN_RADIUS = 9;

export const GAIA_SECTORS: GaiaSector[] = [
  {
    id: "veg",
    label: "Sebze Bahçeleri",
    kind: "veg",
    color: "#86d46a",
    blurb: "Toprakla konuşan satırlar — mevsiminde, gölgesinde, sabırla.",
    href: "/universe/gaia?sektor=sebze",
    glyph: "❀",
  },
  {
    id: "fruit",
    label: "Meyve Bahçeleri",
    kind: "fruit",
    color: "#f6a85a",
    blurb: "Güneşi içine çeken ağaçlar — incir, kiraz, nar, mandalina.",
    href: "/universe/gaia?sektor=meyve",
    glyph: "◍",
  },
  {
    id: "herb",
    label: "Şifalı Bitkiler",
    kind: "herb",
    color: "#c79bff",
    blurb: "Frekansıyla iyileştiren otlar — lavanta, adaçayı, biberiye.",
    href: "/universe/gaia?sektor=sifa",
    glyph: "✿",
  },
  {
    id: "shop",
    label: "Dükkanlar",
    kind: "shop",
    color: "#f5d486",
    blurb: "Üreticinin tezgâhı — kooperatifler, köyler, aile çiftlikleri.",
    href: "/universe/gaia?sektor=pazar",
    glyph: "◈",
  },
];

/** Sektör merkezinin XZ konumu (kullanıcı merkezde, dışarı bakar). */
export function sectorAngle(index: number): number {
  return (index / GAIA_SECTORS.length) * Math.PI * 2;
}

export function sectorPosition(index: number): [number, number, number] {
  const a = sectorAngle(index);
  return [Math.sin(a) * GARDEN_RADIUS, 0, -Math.cos(a) * GARDEN_RADIUS];
}

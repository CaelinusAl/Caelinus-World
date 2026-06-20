/**
 * Caelinus Salonu — eserler (portallar).
 *
 * Showroom'da bir halka üzerine dizilen "eserler". Her eser bir dünyaya
 * açılan portal: tıkla → kamera ona süzülür → "bu dünyaya gir" ile
 * journey-dalışı yapılır. Renk, journey veil rengiyle aynı (dünya imzası).
 */

export type Exhibit = {
  id: string;
  label: string;
  tagline: string;
  href: string;
  /** Dünya imza rengi (journey veil + pedestal ışığı). */
  color: string;
  /** Pedestal üstünde yüzen glif. */
  glyph: string;
};

/** Halka yarıçapı (metre). Kamera halkanın içinde, dışarı bakar. */
export const RING_RADIUS = 5;

export const EXHIBITS: Exhibit[] = [
  {
    id: "gaia",
    label: "Gaia",
    tagline: "Toprak Ana'nın canlı bahçesi",
    href: "/universe/gaia",
    color: "#79e6a0",
    glyph: "✦",
  },
  {
    id: "shop",
    label: "Atölye Vitrini",
    tagline: "Frekansını giy",
    href: "/universe/shop",
    color: "#f5d486",
    glyph: "◐",
  },
  {
    id: "atelier",
    label: "Atelier",
    tagline: "Bilinçli yaratıcılar",
    href: "/atelier",
    color: "#ff7ad9",
    glyph: "⌖",
  },
  {
    id: "cosmos",
    label: "Cosmos",
    tagline: "Frekansına uyanan evren",
    href: "/cosmos",
    color: "#7fe3ff",
    glyph: "◌",
  },
  {
    id: "network",
    label: "Frekans Ağı",
    tagline: "Ruhların buluştuğu alan",
    href: "/network",
    color: "#7aa2ff",
    glyph: "∞",
  },
];

/** Eserin halka üzerindeki dünya-konumu (XZ düzlemi). */
export function exhibitPosition(index: number): [number, number, number] {
  const angle = (index / EXHIBITS.length) * Math.PI * 2;
  return [Math.sin(angle) * RING_RADIUS, 0, -Math.cos(angle) * RING_RADIUS];
}

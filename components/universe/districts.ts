/**
 * Caelinus Evreni — Bölge (gezegen) tanımları.
 *
 * Routing ve mimari KORUNUR: id/href değişmez. Her bölge artık kendi kimliğine
 * sahip bir gök cismi (palet · atmosfer · halka · bulut · yörünge).
 */

export type District = {
  id: string;
  label: string;
  sub: string;
  href: string;
  /** Yörünge açısı (rad) — kardinal yerleşimden türetildi. */
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  planetRadius: number;
  /** Yüzey paleti: derin · ana · vurgu. */
  deep: string;
  base: string;
  hi: string;
  /** Atmosfer / glow rengi. */
  atmosphere: string;
  /** Bölge ambient ışık rengi. */
  light: string;
  /** Çip / etiket vurgu rengi (HUD). */
  accent: string;
  hasRings: boolean;
  hasClouds: boolean;
  /** Prosedürel yüzey çeşitlemesi. */
  seed: number;
  surfaceScale: number;
};

export const DISTRICTS: District[] = [
  {
    id: "sanri",
    label: "SANRI",
    sub: "Ruhun Işığı",
    href: "/universe/sanctum",
    angle: 0, // +Z
    orbitRadius: 23,
    orbitSpeed: 0.012,
    planetRadius: 3.0,
    deep: "#2a2150",
    base: "#6f5ad6",
    hi: "#d7c6ff",
    atmosphere: "#a98bff",
    light: "#8c6dff",
    accent: "#c3b0ff",
    hasRings: false,
    hasClouds: true,
    seed: 11.3,
    surfaceScale: 2.0,
  },
  {
    id: "gaia",
    label: "GAIA",
    sub: "Yaşamın Bilgeliği",
    href: "/universe/gaia",
    angle: -Math.PI / 2, // -X
    orbitRadius: 30,
    orbitSpeed: 0.008,
    planetRadius: 3.6,
    deep: "#0c2a1e",
    base: "#1f7a4d",
    hi: "#8fe6a8",
    atmosphere: "#5fd99a",
    light: "#3fcf86",
    accent: "#74e3a0",
    hasRings: false,
    hasClouds: true,
    seed: 4.7,
    surfaceScale: 2.4,
  },
  {
    id: "bazaar",
    label: "BAZAAR",
    sub: "İlhamın Pazarı",
    href: "/universe/shop",
    angle: Math.PI, // -Z
    orbitRadius: 26,
    orbitSpeed: 0.01,
    planetRadius: 3.3,
    deep: "#3a2606",
    base: "#c98a1e",
    hi: "#ffe6a0",
    atmosphere: "#ffcf6e",
    light: "#ffb347",
    accent: "#ffd98f",
    hasRings: true,
    hasClouds: false,
    seed: 8.1,
    surfaceScale: 2.2,
  },
  {
    id: "atelier",
    label: "ATELİER",
    sub: "Yaratımın Ruhu",
    href: "/atelier",
    angle: Math.PI / 2, // +X
    orbitRadius: 34,
    orbitSpeed: 0.0065,
    planetRadius: 3.2,
    deep: "#2a2118",
    base: "#9c8366",
    hi: "#e8d8c0",
    atmosphere: "#d8c4a8",
    light: "#cbb08a",
    accent: "#e0cdb0",
    hasRings: true,
    hasClouds: false,
    seed: 15.9,
    surfaceScale: 2.6,
  },
];

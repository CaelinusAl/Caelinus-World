/**
 * CAELINUS · Dünya Kaydı (Bible §5 → kod aynası)
 *
 * Altı dünyanın kimliği: isim, duygu, imza renk, sembol, kanonik rota.
 * WorldShell ve gelecekteki navigasyon bu kayıttan beslenir. Bir dünyanın
 * kimliği değişirse önce Bible güncellenir, sonra burası (governance §9).
 *
 * NOT: Bu kimlik katmanıdır; WebGL sahne eşlemesi ayrı dosyadadır
 * (lib/world/config.ts → sceneForPath).
 */
import type { IconName } from "@/components/icons";

export type WorldKey = "sanri" | "avatar" | "atelier" | "bazaar" | "gaia" | "play";

export type Bilingual = { tr: string; en: string };

export type WorldDef = {
  key: WorldKey;
  /** Görünen ad (ribbon mark) */
  name: Bilingual;
  /** Tek kelimelik duygu (Bible §5) */
  emotion: Bilingual;
  /** İmza aksan rengi (hex) — JourneyProvider veil + ambient bunu kullanır */
  accent: string;
  /** Ambient glow için rgba */
  glow: string;
  /** İkon ailesinden sembol */
  symbol: IconName;
  /** Kanonik rota (URL'ler P1'de korunur) */
  route: string;
};

export const WORLDS: Record<WorldKey, WorldDef> = {
  sanri: {
    key: "sanri",
    name: { tr: "SANRI", en: "SANRI" },
    emotion: { tr: "Ay ışığı · gizem · sessizlik", en: "Moonlight · mystery · silence" },
    accent: "#c9d4e6",
    glow: "rgba(201, 212, 230, 0.16)",
    symbol: "mirror",
    route: "/universe/sanctum",
  },
  avatar: {
    key: "avatar",
    name: { tr: "Avatar Studio", en: "Avatar Studio" },
    emotion: { tr: "Dönüşüm", en: "Transformation" },
    accent: "#b69cff",
    glow: "rgba(182, 156, 255, 0.16)",
    symbol: "flame",
    route: "/avatar",
  },
  atelier: {
    key: "atelier",
    name: { tr: "Atelier", en: "Atelier" },
    emotion: { tr: "Yaratım", en: "Creation" },
    accent: "#d4b78a",
    glow: "rgba(212, 183, 138, 0.16)",
    symbol: "wing",
    route: "/atelier",
  },
  bazaar: {
    key: "bazaar",
    name: { tr: "Bazaar", en: "Bazaar" },
    emotion: { tr: "Lüks · güzellik · arzu", en: "Luxury · beauty · desire" },
    accent: "#ffe9b8",
    glow: "rgba(255, 233, 184, 0.14)",
    symbol: "star",
    route: "/universe/shop",
  },
  gaia: {
    key: "gaia",
    name: { tr: "Gaia", en: "Gaia" },
    emotion: { tr: "Köklülük", en: "Rootedness" },
    accent: "#79e6a0",
    glow: "rgba(121, 230, 160, 0.14)",
    symbol: "sacred-circle",
    route: "/universe/gaia",
  },
  play: {
    key: "play",
    name: { tr: "Play", en: "Play" },
    emotion: { tr: "Merak", en: "Wonder" },
    accent: "#7aa2ff",
    glow: "rgba(122, 162, 255, 0.16)",
    symbol: "portal",
    route: "/play",
  },
};

export function getWorld(key: WorldKey): WorldDef {
  return WORLDS[key];
}

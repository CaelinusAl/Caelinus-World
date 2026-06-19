/**
 * CAELINUS · Dünya Kaydı (Bible §5 → kod aynası)
 *
 * Altı dünyanın kimliği: isim, duygu, imza renk, sembol, kanonik rota.
 * WorldShell ve gelecekteki navigasyon bu kayıttan beslenir.
 *
 * TEK DOĞRU KAYNAK: District Engine kayıt defteri (lib/district/registry.ts).
 * District'le örtüşen dünyalar (sanri, gaia, bazaar→fashion, avatar) kimliklerini
 * doğrudan registry'den türetir → renk/isim/duygu DRIFT'i imkânsız. Yalnızca
 * district olmayan dünyalar (atelier, play) burada yerel olarak tanımlıdır.
 *
 * NOT: Bu kimlik katmanıdır; WebGL sahne eşlemesi ayrı dosyadadır
 * (lib/world/config.ts → sceneForPath).
 */
import type { IconName } from "@/components/icons";
import { DISTRICTS } from "@/lib/district/registry";
import type { District, DistrictKey } from "@/lib/district/types";

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

/** Bir district kaydını dünya kimliğine dönüştürür (tek doğru kaynak köprüsü). */
function fromDistrict(worldKey: WorldKey, districtKey: DistrictKey): WorldDef {
  const d: District = DISTRICTS[districtKey];
  return {
    key: worldKey,
    name: d.name,
    emotion: d.emotion,
    accent: d.hero.accent,
    glow: d.hero.glow,
    symbol: d.hero.symbol,
    route: d.route,
  };
}

export const WORLDS: Record<WorldKey, WorldDef> = {
  // ── District Engine ile örtüşen dünyalar — kimlik registry'den türetilir ──
  sanri: fromDistrict("sanri", "sanri"),
  gaia: fromDistrict("gaia", "gaia"),
  bazaar: fromDistrict("bazaar", "fashion"),
  avatar: fromDistrict("avatar", "avatar"),

  // ── District olmayan yerel dünyalar ──
  atelier: {
    key: "atelier",
    name: { tr: "Atelier", en: "Atelier" },
    emotion: { tr: "Yaratım", en: "Creation" },
    accent: "#d4b78a",
    glow: "rgba(212, 183, 138, 0.16)",
    symbol: "wing",
    route: "/atelier",
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

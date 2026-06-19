/**
 * CAELINUS — Avatar Doğuş · District Frekans Tablosu (saf veri)
 *
 * Kaynak: CAELINUS_GODDESS_ARCHETYPES_BIBLE.md → "District Frekans Tablosu".
 * Avatar Bible Bölüm 4 ile uyumlu. Bu tablo, doğuş akışında kullanıcının
 * tanrıçasını "nerede doğsun?" seçimini ve portre kompozisyonunun ışık/ortam
 * tonunu besler. Şimdilik yalnızca SEÇİM + GÖRSEL ETKİ düzeyinde (DB yok).
 *
 * District Engine registry'sinde sadece 4 district var (sanri/gaia/fashion/
 * avatar). Doğuş deneyimi 8 frekansı gerektirir (Source, Mirror, Atelier,
 * Sanctuary, Temple dahil); bu yüzden görsel frekanslar burada — saf veri
 * olarak — tanımlıdır. Mimari değil, deneyim katmanıdır.
 *
 * NOT: Saf veri. server-only modül import ETMEZ.
 */

export type AvatarDistrictId =
  | "source"
  | "mirror"
  | "gaia"
  | "bazaar"
  | "atelier"
  | "sanri"
  | "sanctuary"
  | "temple";

export type DistrictRichness = "low" | "medium" | "high";

export interface AvatarDistrict {
  id: AvatarDistrictId;
  /** Görünen ad (TR). */
  name: string;
  /** Tek kelime frekans — kartta öne çıkar. */
  word: string;
  /** Kısa frekans cümlesi. */
  tagline: string;
  /** Ana vurgu rengi (registry accent'leriyle uyumlu). */
  accent: string;
  /** Yumuşak hale (rgba). */
  glow: string;
  /** Blender/atmosfer ortam anahtarı (registry blender.env ile uyumlu). */
  env: string;
  /** Işık eğilimi — pipeline/kompozisyon için. */
  lightBias: string;
  /** Sade ↔ görkemli ekseni. */
  richness: DistrictRichness;
  /** Portre kompozisyonu için ortam tint'i (rgba overlay). */
  tint: string;
  /** Portre kompozisyonu için vinyet yoğunluğu (rgba). */
  vignette: string;
}

export const AVATAR_DISTRICTS: Record<AvatarDistrictId, AvatarDistrict> = {
  source: {
    id: "source",
    name: "Source",
    word: "Saf Köken",
    tagline: "Arınmış doğuş — beyaz-altın, minimal, ilk an.",
    accent: "#f4ead0",
    glow: "rgba(244, 234, 208, 0.20)",
    env: "cosmic-birth",
    lightBias: "Arınmış, yumuşak yüksek ışık",
    richness: "low",
    tint: "rgba(244, 234, 208, 0.16)",
    vignette: "rgba(20, 16, 30, 0.45)",
  },
  mirror: {
    id: "mirror",
    name: "Mirror",
    word: "Yansıma",
    tagline: "Kendiyle yüzleşme — simetri, cam, çift ışık.",
    accent: "#cfd8e6",
    glow: "rgba(207, 216, 230, 0.18)",
    env: "mirror-gate",
    lightBias: "Çift / simetrik, soğuk parıltı",
    richness: "medium",
    tint: "rgba(207, 216, 230, 0.16)",
    vignette: "rgba(16, 18, 28, 0.5)",
  },
  gaia: {
    id: "gaia",
    name: "Gaia",
    word: "Köklülük",
    tagline: "Organik katman — yeşil-altın, yaprak, köklenme.",
    accent: "#79e6a0",
    glow: "rgba(121, 230, 160, 0.16)",
    env: "living-garden",
    lightBias: "Sıcak yaprak ışığı (dappled)",
    richness: "medium",
    tint: "rgba(121, 230, 160, 0.14)",
    vignette: "rgba(14, 24, 18, 0.5)",
  },
  bazaar: {
    id: "bazaar",
    name: "Bazaar",
    word: "Lüks",
    tagline: "Maksimum görkem — zengin kumaş, mücevher, sıcak altın.",
    accent: "#ffe9b8",
    glow: "rgba(255, 233, 184, 0.18)",
    env: "mirror-gate",
    lightBias: "Zengin sıcak glow",
    richness: "high",
    tint: "rgba(255, 233, 184, 0.18)",
    vignette: "rgba(28, 20, 12, 0.5)",
  },
  atelier: {
    id: "atelier",
    name: "Atelier",
    word: "Zanaat",
    tagline: "Couture detay — dikiş/drape vurgusu, net stüdyo ışığı.",
    accent: "#d8c39a",
    glow: "rgba(216, 195, 154, 0.16)",
    env: "studio",
    lightBias: "Net stüdyo ışığı",
    richness: "medium",
    tint: "rgba(216, 195, 154, 0.14)",
    vignette: "rgba(22, 20, 16, 0.46)",
  },
  sanri: {
    id: "sanri",
    name: "Sanri",
    word: "Bilinç",
    tagline: "Ay ışığı, gizem — mor-gümüş, semboller bulanıklaşır.",
    accent: "#c9d4e6",
    glow: "rgba(201, 212, 230, 0.18)",
    env: "moonlit-temple",
    lightBias: "Ay ışığı, düşük anahtar (low-key)",
    richness: "low",
    tint: "rgba(201, 212, 230, 0.16)",
    vignette: "rgba(12, 14, 26, 0.56)",
  },
  sanctuary: {
    id: "sanctuary",
    name: "Sanctuary",
    word: "Şifa",
    tagline: "Yumuşak koruyucu ışık — pastel-altın, sakin hale.",
    accent: "#f3d9c9",
    glow: "rgba(243, 217, 201, 0.18)",
    env: "sanctuary",
    lightBias: "Yumuşak koruyucu ışık",
    richness: "medium",
    tint: "rgba(243, 217, 201, 0.16)",
    vignette: "rgba(24, 18, 18, 0.42)",
  },
  temple: {
    id: "temple",
    name: "Temple of Silence",
    word: "Sessizlik",
    tagline: "Neredeyse monokrom — en sade silüet, derin durağan ışık.",
    accent: "#b9b9c2",
    glow: "rgba(185, 185, 194, 0.14)",
    env: "temple-void",
    lightBias: "Derin durağan, minimal",
    richness: "low",
    tint: "rgba(185, 185, 194, 0.12)",
    vignette: "rgba(10, 10, 14, 0.62)",
  },
};

/** Doğuş akışındaki gösterim sırası (Source varsayılan / ilk). */
export const AVATAR_DISTRICT_ORDER: AvatarDistrictId[] = [
  "source",
  "mirror",
  "gaia",
  "bazaar",
  "atelier",
  "sanri",
  "sanctuary",
  "temple",
];

export const AVATAR_DISTRICT_LIST: AvatarDistrict[] =
  AVATAR_DISTRICT_ORDER.map((id) => AVATAR_DISTRICTS[id]);

export function getAvatarDistrict(id: AvatarDistrictId): AvatarDistrict {
  return AVATAR_DISTRICTS[id];
}

/** Varsayılan district — saf doğuş. */
export const DEFAULT_AVATAR_DISTRICT: AvatarDistrictId = "source";

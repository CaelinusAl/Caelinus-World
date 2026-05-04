/**
 * Caelinus Parametric Avatar Builder — şema + sabitler.
 *
 * Vizyon: Selfie zorunluluğunu kaldırıyoruz. Kullanıcı saçını,
 * gözünü, tenini, dudağını seçerek kendi Caelinus tanrıçasını
 * yaratıyor. Sıfır AI maliyeti, anlık preview, oyun hissi.
 *
 * Bu modül `data` katmanı — burada UI yok, render yok. Sadece:
 *   • Tüm seçeneklerin listesi (swatch palette'leri)
 *   • `BuilderTraits` tipi ve `DEFAULT_TRAITS`
 *   • Trait → DNA serialize/deserialize (cache key + share URL için)
 *   • Trait → AI prompt fragment (Tanrıça Modu upgrade'i için)
 *
 * Tüm renkler `as const` — typescript exhaustiveness check için.
 *
 * ParametricAvatar bileşeni bu trait'leri SVG katmanlarına
 * çeviriyor; AvatarBuilder UI bu listeleri swatch/chip olarak
 * dökerek seçim sunuyor.
 */

import type { ZodiacId } from "@/data/play-assets";

/* ── Ten ─────────────────────────────────────────────────── */

export type SkinToneId =
  | "porcelain"
  | "ivory"
  | "honey"
  | "olive"
  | "bronze"
  | "umber"
  | "ebony";

export type Swatch = {
  readonly id: string;
  readonly label: { tr: string; en: string };
  /** Ana renk (CSS hex) */
  readonly color: string;
  /** İkincil ton — gölge, gradient ya da iris detayı için */
  readonly shade?: string;
  /** Vurgu — highlight, parıltı */
  readonly highlight?: string;
};

export const SKIN_TONES: readonly (Swatch & { id: SkinToneId })[] = [
  { id: "porcelain", label: { tr: "Porselen", en: "Porcelain" }, color: "#f5dfd0", shade: "#d8b9a8", highlight: "#fff5ec" },
  { id: "ivory",     label: { tr: "Fildişi",  en: "Ivory"     }, color: "#ecc8a8", shade: "#c9a487", highlight: "#fce5cf" },
  { id: "honey",     label: { tr: "Bal",      en: "Honey"     }, color: "#d4a276", shade: "#a87a55", highlight: "#f0c599" },
  { id: "olive",     label: { tr: "Zeytin",   en: "Olive"     }, color: "#b88762", shade: "#8a6044", highlight: "#d8a984" },
  { id: "bronze",    label: { tr: "Bronz",    en: "Bronze"    }, color: "#9a6644", shade: "#704a30", highlight: "#bb8662" },
  { id: "umber",     label: { tr: "Kestane",  en: "Umber"     }, color: "#6f4327", shade: "#4d2d1a", highlight: "#8e5938" },
  { id: "ebony",     label: { tr: "Abanoz",   en: "Ebony"     }, color: "#3f2818", shade: "#26160c", highlight: "#5e3c26" },
] as const;

/* ── Beden silueti ──────────────────────────────────────── */

export type BodyShapeId = "willow" | "hourglass" | "moon";

export type BodyShape = {
  readonly id: BodyShapeId;
  readonly label: { tr: string; en: string };
  readonly hint: { tr: string; en: string };
  /** SVG path width modifier — omuz, bel, kalça oranı */
  readonly shoulders: number;
  readonly waist: number;
  readonly hips: number;
};

export const BODY_SHAPES: readonly BodyShape[] = [
  {
    id: "willow",
    label: { tr: "Söğüt", en: "Willow" },
    hint: { tr: "Zarif, uzun siluet", en: "Slender, elongated" },
    shoulders: 0.84, waist: 0.66, hips: 0.86,
  },
  {
    id: "hourglass",
    label: { tr: "Kum Saati", en: "Hourglass" },
    hint: { tr: "Belirgin bel, dengeli", en: "Defined waist, balanced" },
    shoulders: 0.94, waist: 0.62, hips: 0.96,
  },
  {
    id: "moon",
    label: { tr: "Ay", en: "Moon" },
    hint: { tr: "Yumuşak, dolgun", en: "Soft, full" },
    shoulders: 0.96, waist: 0.86, hips: 1.04,
  },
] as const;

/* ── Saç ─────────────────────────────────────────────────── */

export type HairLengthId = "short" | "medium" | "long";
export type HairTextureId = "straight" | "wavy" | "curly";
export type HairColorId =
  | "raven"
  | "espresso"
  | "chestnut"
  | "honey-blonde"
  | "platinum"
  | "copper"
  | "auburn"
  // ── kozmik palet — manifestoya özel
  | "starlight"
  | "nebula-violet"
  | "aurora-teal"
  | "cosmic-rose"
  | "moonlit-silver";

export const HAIR_LENGTHS: readonly { id: HairLengthId; label: { tr: string; en: string } }[] = [
  { id: "short",  label: { tr: "Kısa",  en: "Short"  } },
  { id: "medium", label: { tr: "Orta",  en: "Medium" } },
  { id: "long",   label: { tr: "Uzun",  en: "Long"   } },
] as const;

export const HAIR_TEXTURES: readonly { id: HairTextureId; label: { tr: string; en: string } }[] = [
  { id: "straight", label: { tr: "Düz",      en: "Straight" } },
  { id: "wavy",     label: { tr: "Dalgalı",  en: "Wavy"     } },
  { id: "curly",    label: { tr: "Kıvırcık", en: "Curly"    } },
] as const;

export const HAIR_COLORS: readonly (Swatch & { id: HairColorId; cosmic?: boolean })[] = [
  { id: "raven",         label: { tr: "Kuzgun",       en: "Raven"        }, color: "#1a1410", shade: "#000000", highlight: "#3a2820" },
  { id: "espresso",      label: { tr: "Espresso",     en: "Espresso"     }, color: "#3a2418", shade: "#1f1108", highlight: "#5a3a26" },
  { id: "chestnut",      label: { tr: "Kestane",      en: "Chestnut"     }, color: "#6b3e22", shade: "#4a2814", highlight: "#8c5736" },
  { id: "honey-blonde",  label: { tr: "Bal Sarısı",   en: "Honey Blonde" }, color: "#c79451", shade: "#9a6f37", highlight: "#e6b977" },
  { id: "platinum",      label: { tr: "Platin",       en: "Platinum"     }, color: "#e8d8b8", shade: "#bca988", highlight: "#fff4dc" },
  { id: "copper",        label: { tr: "Bakır",        en: "Copper"       }, color: "#b35a2c", shade: "#8a3f1a", highlight: "#d97a44" },
  { id: "auburn",        label: { tr: "Kızıl",        en: "Auburn"       }, color: "#7a2818", shade: "#52160a", highlight: "#a8442e" },
  { id: "starlight",     label: { tr: "Yıldız Tülü",  en: "Starlight"    }, color: "#f0eaff", shade: "#bba8d8", highlight: "#ffffff", cosmic: true },
  { id: "nebula-violet", label: { tr: "Nebula Moru",  en: "Nebula Violet"}, color: "#7b3a8a", shade: "#4a1d5a", highlight: "#b06bc4", cosmic: true },
  { id: "aurora-teal",   label: { tr: "Aurora",       en: "Aurora Teal"  }, color: "#2c8c8a", shade: "#155656", highlight: "#5cc8c4", cosmic: true },
  { id: "cosmic-rose",   label: { tr: "Kozmik Gül",   en: "Cosmic Rose"  }, color: "#c1547a", shade: "#82294f", highlight: "#e88aab", cosmic: true },
  { id: "moonlit-silver",label: { tr: "Ay Gümüşü",    en: "Moonlit Silver"}, color: "#bcc4d4", shade: "#7a8294", highlight: "#e4ebf6", cosmic: true },
] as const;

/* ── Göz ─────────────────────────────────────────────────── */

export type EyeColorId =
  | "obsidian"
  | "espresso-eye"
  | "amber"
  | "hazel"
  | "moss"
  | "ocean"
  | "sky"
  // kozmik
  | "nebula-eye"
  | "aurora-eye"
  | "starfire"
  | "moonstone";

export const EYE_COLORS: readonly (Swatch & { id: EyeColorId; cosmic?: boolean })[] = [
  { id: "obsidian",     label: { tr: "Obsidyen",   en: "Obsidian"  }, color: "#1a1410", shade: "#000000", highlight: "#3a2820" },
  { id: "espresso-eye", label: { tr: "Kahve",      en: "Brown"     }, color: "#5a3520", shade: "#3a1f10", highlight: "#7a5238" },
  { id: "amber",        label: { tr: "Kehribar",   en: "Amber"     }, color: "#b07028", shade: "#7a4814", highlight: "#d8954a" },
  { id: "hazel",        label: { tr: "Ela",        en: "Hazel"     }, color: "#8a6a38", shade: "#5a4220", highlight: "#b8945c" },
  { id: "moss",         label: { tr: "Yosun",      en: "Moss Green"}, color: "#4a6a3a", shade: "#2a4222", highlight: "#7a9a5a" },
  { id: "ocean",        label: { tr: "Okyanus",    en: "Ocean Blue"}, color: "#2a5a7a", shade: "#143a52", highlight: "#5a8aaa" },
  { id: "sky",          label: { tr: "Gökyüzü",    en: "Sky Blue"  }, color: "#7aaad4", shade: "#4a7aa4", highlight: "#b0d4f0" },
  { id: "nebula-eye",   label: { tr: "Nebula",     en: "Nebula"    }, color: "#7a3aaa", shade: "#4a1a7a", highlight: "#b07adc", cosmic: true },
  { id: "aurora-eye",   label: { tr: "Aurora",     en: "Aurora"    }, color: "#2cb09a", shade: "#147060", highlight: "#7adcc8", cosmic: true },
  { id: "starfire",     label: { tr: "Yıldız Ateşi",en: "Starfire" }, color: "#d4863a", shade: "#a05420", highlight: "#fcb878", cosmic: true },
  { id: "moonstone",    label: { tr: "Ay Taşı",    en: "Moonstone" }, color: "#c8d0e0", shade: "#7a8294", highlight: "#f0f5ff", cosmic: true },
] as const;

/* ── Dudak ───────────────────────────────────────────────── */

export type LipColorId =
  | "naked-satin"
  | "soft-rose"
  | "berry"
  | "classic-red"
  | "burgundy"
  | "cosmic-plum"
  | "midnight";

export const LIP_COLORS: readonly (Swatch & { id: LipColorId; cosmic?: boolean })[] = [
  { id: "naked-satin",  label: { tr: "Saten Naked", en: "Nude Satin" }, color: "#c98876", shade: "#a06856", highlight: "#e2a89a" },
  { id: "soft-rose",    label: { tr: "Yumuşak Gül", en: "Soft Rose"  }, color: "#cc7a85", shade: "#9a525e", highlight: "#e8a0aa" },
  { id: "berry",        label: { tr: "Frenk",       en: "Berry"      }, color: "#a83a5a", shade: "#751a3a", highlight: "#cc6080" },
  { id: "classic-red",  label: { tr: "Klasik Kırmızı", en: "Classic Red" }, color: "#b8232c", shade: "#811218", highlight: "#dc4a52" },
  { id: "burgundy",     label: { tr: "Burgonya",    en: "Burgundy"   }, color: "#5a1a28", shade: "#380c18", highlight: "#7a2a3c" },
  { id: "cosmic-plum",  label: { tr: "Kozmik Erik", en: "Cosmic Plum"}, color: "#5a2a78", shade: "#380c52", highlight: "#7a4a98", cosmic: true },
  { id: "midnight",     label: { tr: "Gece Yarısı", en: "Midnight"   }, color: "#1a1224", shade: "#000000", highlight: "#3a2a48", cosmic: true },
] as const;

/* ── Alın glifi ──────────────────────────────────────────── */

export type GlyphMode = "none" | "zodiac" | "frequency";

/** Solfeggio bandları — alın glifi olarak gösterilebilir. */
export const FREQUENCY_GLYPHS = [
  { id: "396", label: "396 Hz", mood: { tr: "Suçluluğu çöz", en: "Release guilt" }, color: "#d44a4a" },
  { id: "417", label: "417 Hz", mood: { tr: "Değişimi başlat", en: "Begin change" }, color: "#d4884a" },
  { id: "528", label: "528 Hz", mood: { tr: "Şifa", en: "Healing" }, color: "#bcd44a" },
  { id: "639", label: "639 Hz", mood: { tr: "İlişkiler", en: "Relations" }, color: "#4ad48a" },
  { id: "741", label: "741 Hz", mood: { tr: "Hakikat", en: "Truth" }, color: "#4abcd4" },
  { id: "852", label: "852 Hz", mood: { tr: "Sezgi", en: "Intuition" }, color: "#7a4ad4" },
  { id: "963", label: "963 Hz", mood: { tr: "Bilinç", en: "Consciousness" }, color: "#c44ad4" },
] as const;

export type FrequencyId = (typeof FREQUENCY_GLYPHS)[number]["id"];

export const ZODIAC_GLYPH_CHARS: Record<ZodiacId, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

/* ── Trait paketi ────────────────────────────────────────── */

export type BuilderTraits = {
  skin: SkinToneId;
  body: BodyShapeId;
  hairLength: HairLengthId;
  hairTexture: HairTextureId;
  hairColor: HairColorId;
  eye: EyeColorId;
  lip: LipColorId;
  /** Burç — aura/glif renk seçer, opsiyonel */
  zodiac: ZodiacId | null;
  /** Alın glifi modu */
  glyph: GlyphMode;
  /** Glyph mode === "frequency" iken hangi Hz */
  frequency: FrequencyId;
};

export const DEFAULT_TRAITS: BuilderTraits = {
  skin: "honey",
  body: "hourglass",
  hairLength: "long",
  hairTexture: "wavy",
  hairColor: "espresso",
  eye: "amber",
  lip: "soft-rose",
  zodiac: null,
  glyph: "none",
  frequency: "528",
};

/* ── Lookup yardımcıları ────────────────────────────────── */

export const findSkin = (id: SkinToneId) =>
  SKIN_TONES.find((s) => s.id === id) ?? SKIN_TONES[2];
export const findBody = (id: BodyShapeId) =>
  BODY_SHAPES.find((b) => b.id === id) ?? BODY_SHAPES[1];
export const findHairColor = (id: HairColorId) =>
  HAIR_COLORS.find((h) => h.id === id) ?? HAIR_COLORS[1];
export const findEye = (id: EyeColorId) =>
  EYE_COLORS.find((e) => e.id === id) ?? EYE_COLORS[2];
export const findLip = (id: LipColorId) =>
  LIP_COLORS.find((l) => l.id === id) ?? LIP_COLORS[1];
export const findFrequency = (id: FrequencyId) =>
  FREQUENCY_GLYPHS.find((f) => f.id === id) ?? FREQUENCY_GLYPHS[2];

/* ── DNA serialize ───────────────────────────────────────── */

/**
 * Trait paketini kompakt bir DNA string'ine çevir — cache key,
 * share URL ve Tanrıça Modu trait-hash için kullanılır.
 *
 * Format: `<skin>|<body>|<hl><ht><hc>|<eye>|<lip>|<zod|->|<glyph>:<freq>`
 *
 * Ör: `honey|hourglass|lwe|amber|soft-rose|virgo|frequency:528`
 */
export function serializeTraits(t: BuilderTraits): string {
  const hl = t.hairLength[0]; // s|m|l
  const ht = t.hairTexture[0]; // s|w|c
  return [
    t.skin,
    t.body,
    `${hl}${ht}${t.hairColor}`,
    t.eye,
    t.lip,
    t.zodiac ?? "-",
    `${t.glyph}:${t.frequency}`,
  ].join("|");
}

/* ── AI Tanrıça Modu için prompt fragment ───────────────── */

/**
 * Trait paketinden text-to-image prompt fragment'i. Faz 2'de
 * "Tanrıça Modu" upgrade butonu basıldığında bu string
 * `/api/play/render` path'ine `params:{...}` yerine `prompt:`
 * olarak gider — gpt-image-1 / fal text-to-image bu fragment
 * üzerinden photoreal portre üretir.
 *
 * Promptun deterministik olması önemli — aynı trait kombinasyonu
 * aynı prompt = aynı cache hit.
 */
export function traitsToPrompt(t: BuilderTraits, lang: "tr" | "en" = "en"): string {
  const skin = findSkin(t.skin).label.en.toLowerCase();
  const body = findBody(t.body).label.en.toLowerCase();
  const hairColor = findHairColor(t.hairColor).label.en.toLowerCase();
  const eye = findEye(t.eye).label.en.toLowerCase();
  const lip = findLip(t.lip).label.en.toLowerCase();
  const zodiac = t.zodiac ? `${t.zodiac} zodiac aura` : "celestial aura";
  const freq =
    t.glyph === "frequency" ? `, glowing ${t.frequency}Hz solfeggio glyph on forehead` : "";
  const zglyph =
    t.glyph === "zodiac" && t.zodiac
      ? `, faint ${t.zodiac} constellation mark on forehead`
      : "";

  // Lang sadece debug; gerçek prompt her zaman İngilizce — image
  // model'leri Türkçe prompt'a daha az tutarlı.
  void lang;

  return [
    `Caelinus goddess portrait`,
    `${body} silhouette body`,
    `${skin} skin tone`,
    `${t.hairLength} ${t.hairTexture} ${hairColor} hair`,
    `${eye} eyes`,
    `${lip} lips`,
    zodiac,
    `wearing matte black bodysuit`,
    freq,
    zglyph,
    `painterly cinematic`,
    `soft nebula background`,
    `single figure, frontal portrait, no text, no logo`,
  ]
    .filter(Boolean)
    .join(", ");
}

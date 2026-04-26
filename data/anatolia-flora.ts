/**
 * CAELINUS — Anatolia Flora
 *
 * Editorial source for the manifesto-style hero on /universe/gaia/plants.
 * Numbers reflect the Turkey Plants Database (TÜBİVES) reference figures:
 *   - ~10,000+ vascular plant species
 *   - ~3,000+ endemic to Turkey
 *   - 3 phytogeographic regions converging on a single land:
 *       Euro-Siberian · Irano-Turanian · Mediterranean
 */

export type FloraStat = {
  number: string;
  label: { tr: string; en: string };
  whisper: { tr: string; en: string };
};

export const FLORA_STATS: FloraStat[] = [
  {
    number: "10.000+",
    label: { tr: "Bitki Türü", en: "Plant species" },
    whisper: {
      tr: "Anadolu, dünyanın en zengin bitki coğrafyalarından biridir.",
      en: "Anatolia is one of Earth's richest botanical geographies.",
    },
  },
  {
    number: "3.000+",
    label: { tr: "Endemik", en: "Endemic" },
    whisper: {
      tr: "Bunlar yalnızca burada nefes alır — başka hiçbir yerde değil.",
      en: "These breathe only here — nowhere else on Earth.",
    },
  },
  {
    number: "3",
    label: { tr: "Bitki Bölgesi", en: "Phytogeographic regions" },
    whisper: {
      tr: "Üç ekosistem tek bir toprakta kesişir.",
      en: "Three ecosystems converge on a single land.",
    },
  },
];

export type Phytogeography = {
  id: "euro-siberian" | "irano-turanian" | "mediterranean";
  symbol: string;
  name: { tr: string; en: string };
  zone: { tr: string; en: string };
  signature: { tr: string; en: string };
  /** Plant groups carried by this phytogeographic region. */
  groupIds: FloraGroup["id"][];
};

export const PHYTOGEOGRAPHIES: Phytogeography[] = [
  {
    id: "euro-siberian",
    symbol: "❅",
    name: { tr: "Avrupa-Sibirya", en: "Euro-Siberian" },
    zone: { tr: "Karadeniz", en: "Black Sea" },
    signature: {
      tr: "Yağmurun yazdığı yeşil hafıza — orman, çay, ısırgan.",
      en: "The green memory the rain writes — forest, tea, nettle.",
    },
    // Humid mountain forests, tea & hazelnut belt, woodland herbs.
    groupIds: ["trees", "agriculture", "medicinal"],
  },
  {
    id: "irano-turanian",
    symbol: "✦",
    name: { tr: "İran-Turan", en: "Irano-Turanian" },
    zone: { tr: "İç ve Doğu Anadolu", en: "Central & Eastern Anatolia" },
    signature: {
      tr: "Mineral toprak, kuru rüzgâr — geven, çörekotu, kekik.",
      en: "Mineral soil, dry wind — milkvetch, nigella, thyme.",
    },
    // Steppe, endemics, dry-farming grains, aromatic dry herbs, scattered conifers.
    groupIds: ["steppe", "endemics", "agriculture", "medicinal", "trees"],
  },
  {
    id: "mediterranean",
    symbol: "◐",
    name: { tr: "Akdeniz", en: "Mediterranean" },
    zone: { tr: "Ege ve Akdeniz kıyıları", en: "Aegean & Mediterranean coasts" },
    signature: {
      tr: "Tuz rüzgârı, uzun güneş — zeytin, defne, lavanta.",
      en: "Salt wind, long suns — olive, bay, lavender.",
    },
    // Olive belt, vineyards & cotton, lavender / rosemary aromatics.
    groupIds: ["trees", "medicinal", "agriculture", "endemics"],
  },
];

export type FloraGroup = {
  id: "trees" | "endemics" | "agriculture" | "medicinal" | "steppe";
  symbol: string;
  name: { tr: string; en: string };
  kicker: { tr: string; en: string };
  examples: string[];
  whisper: { tr: string; en: string };
};

export const FLORA_GROUPS: FloraGroup[] = [
  {
    id: "trees",
    symbol: "▲",
    name: { tr: "Ağaçlar", en: "Trees" },
    kicker: { tr: "Sabırlı bilgeler", en: "Patient sages" },
    examples: ["Meşe", "Çam", "Zeytin", "Kayın", "Sedir", "Ladin", "Göknar"],
    whisper: {
      tr: "Yıllarla konuşurlar; ölçüleri yıldır, soluklarıdır.",
      en: "They speak in years; their measure is the season.",
    },
  },
  {
    id: "endemics",
    symbol: "✦",
    name: { tr: "Yabani Çiçekler & Endemikler", en: "Wildflowers & Endemics" },
    kicker: { tr: "Sadece burada", en: "Only here" },
    examples: ["Anadolu orkidesi", "Ters lale", "Kardelen", "Yabani lale", "Safran"],
    whisper: {
      tr: "Başka topraklarda doğmazlar — Anadolu'nun gizli imzasıdırlar.",
      en: "They are born of no other soil — Anatolia's hidden signature.",
    },
  },
  {
    id: "agriculture",
    symbol: "◉",
    name: { tr: "Tarım Bitkileri", en: "Crops" },
    kicker: { tr: "İnsanın hafızası", en: "The human memory" },
    examples: ["Buğday", "Arpa", "Mısır", "Pamuk", "Fındık", "Üzüm", "Zeytin", "Çay"],
    whisper: {
      tr: "Buğdayın doğduğu topraktasın — Bereketli Hilal'in eşiği.",
      en: "You stand on the soil where wheat was born — the gate of the Fertile Crescent.",
    },
  },
  {
    id: "medicinal",
    symbol: "✧",
    name: { tr: "Tıbbi & Aromatik", en: "Medicinal & Aromatic" },
    kicker: { tr: "Konuşan şifa", en: "Healing that speaks" },
    examples: ["Kekik", "Adaçayı", "Lavanta", "Biberiye", "Nane", "Rezene", "Kantaron"],
    whisper: {
      tr: "Bahçenin asıl sesi — Caelinus burada başlar.",
      en: "The true voice of the garden — Caelinus begins here.",
    },
  },
  {
    id: "steppe",
    symbol: "△",
    name: { tr: "Step Bitkileri", en: "Steppe" },
    kicker: { tr: "Kurağın direnci", en: "The resilience of dryness" },
    examples: ["Geven", "Yabani diken", "Çalı türleri"],
    whisper: {
      tr: "Az suya, çok güneşe alışkın — kuru bilgeliğin sözcüleri.",
      en: "Used to little water, much sun — speakers of dry wisdom.",
    },
  },
];

export const FLORA_PULL_QUOTE: { tr: string; en: string } = {
  tr: "Toprak hafızadır. Bitki, ifadedir.\nHer bitki, toprağın başka bir hatırlama biçimidir.",
  en: "Soil is memory. The plant is its expression.\nEach plant is another way the soil remembers.",
};

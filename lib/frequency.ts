/**
 * CAELINUS — Frequency Engine
 *
 * Pure, dependency-free functions that map a person's date of birth +
 * intent to a complete cosmic profile: zodiac, element, Solfeggio
 * frequency, archetype, recommended plant and recommended product.
 *
 * Every function is deterministic — same input, same profile.
 * Used by the /onboarding ritual and by the personalization layer
 * across the universe.
 */

export const ZODIACS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type Zodiac = (typeof ZODIACS)[number];

export type Element = "fire" | "earth" | "air" | "water";

export type Modality = "cardinal" | "fixed" | "mutable";

/** The seven Solfeggio frequencies used in Caelinus. */
export const SOLFEGGIO = [396, 417, 528, 639, 741, 852, 963] as const;
export type SolfeggioHz = (typeof SOLFEGGIO)[number];

/** Birth-date ranges for each tropical zodiac sign. */
const ZODIAC_RANGES: { sign: Zodiac; from: [number, number]; to: [number, number] }[] = [
  { sign: "capricorn",   from: [12, 22], to: [1, 19] },
  { sign: "aquarius",    from: [1, 20],  to: [2, 18] },
  { sign: "pisces",      from: [2, 19],  to: [3, 20] },
  { sign: "aries",       from: [3, 21],  to: [4, 19] },
  { sign: "taurus",      from: [4, 20],  to: [5, 20] },
  { sign: "gemini",      from: [5, 21],  to: [6, 20] },
  { sign: "cancer",      from: [6, 21],  to: [7, 22] },
  { sign: "leo",         from: [7, 23],  to: [8, 22] },
  { sign: "virgo",       from: [8, 23],  to: [9, 22] },
  { sign: "libra",       from: [9, 23],  to: [10, 22] },
  { sign: "scorpio",     from: [10, 23], to: [11, 21] },
  { sign: "sagittarius", from: [11, 22], to: [12, 21] },
];

/** Map zodiac → element. */
const ZODIAC_ELEMENT: Record<Zodiac, Element> = {
  aries: "fire",       leo: "fire",         sagittarius: "fire",
  taurus: "earth",     virgo: "earth",      capricorn: "earth",
  gemini: "air",       libra: "air",        aquarius: "air",
  cancer: "water",     scorpio: "water",    pisces: "water",
};

const ZODIAC_MODALITY: Record<Zodiac, Modality> = {
  aries: "cardinal",   cancer: "cardinal",  libra: "cardinal",   capricorn: "cardinal",
  taurus: "fixed",     leo: "fixed",        scorpio: "fixed",    aquarius: "fixed",
  gemini: "mutable",   virgo: "mutable",    sagittarius: "mutable", pisces: "mutable",
};

/**
 * Aligned with Caelinus product mapping (data/products.ts) so that the
 * shop personalization stays consistent with the onboarding result.
 */
const ZODIAC_FREQUENCY: Record<Zodiac, SolfeggioHz> = {
  aries: 396,
  taurus: 417,
  gemini: 528,
  cancer: 639,
  leo: 741,
  virgo: 528,
  libra: 639,
  scorpio: 852,
  sagittarius: 741,
  capricorn: 963,
  aquarius: 963,
  pisces: 852,
};

/** Poetic short label for each Solfeggio Hz. */
export const FREQUENCY_LABELS: Record<SolfeggioHz, { tr: string; en: string }> = {
  396: { tr: "Suçluluğu salar",      en: "Releases guilt" },
  417: { tr: "Değişimi başlatır",    en: "Initiates change" },
  528: { tr: "Hücreleri şifalandırır", en: "Heals the cells" },
  639: { tr: "İlişkileri iyileştirir", en: "Mends relationships" },
  741: { tr: "Hakikati uyandırır",   en: "Awakens truth" },
  852: { tr: "Sezgiyi açar",         en: "Opens intuition" },
  963: { tr: "Bilinci genişletir",    en: "Expands consciousness" },
};

/** A short archetypal name shown on the reveal screen. */
export const ZODIAC_ARCHETYPE: Record<Zodiac, { tr: string; en: string }> = {
  aries:       { tr: "Ateş Müzesi",        en: "Fire Muse" },
  taurus:      { tr: "Toprak Tüllü",       en: "Earth Veil" },
  gemini:      { tr: "İkiz Işık",          en: "Twin Light" },
  cancer:      { tr: "Ay Tüllü",           en: "Moon Veil" },
  leo:         { tr: "Güneş Kraliçesi",    en: "Solar Queen" },
  virgo:       { tr: "İnci Şifresi",       en: "Pearl Code" },
  libra:       { tr: "Venüs Dengesi",      en: "Venus Balance" },
  scorpio:     { tr: "Gece Kahini",        en: "Night Oracle" },
  sagittarius: { tr: "Altın Ok",           en: "Golden Arrow" },
  capricorn:   { tr: "Taş Sireni",         en: "Stone Siren" },
  aquarius:    { tr: "Yıldız Akıntısı",    en: "Star Current" },
  pisces:      { tr: "Rüya Dalgası",       en: "Dream Tide" },
};

export const ELEMENT_TONE: Record<Element, { color: string; glow: string; label: { tr: string; en: string } }> = {
  fire:  { color: "#ff8a5c", glow: "rgba(255, 138, 92, 0.45)",  label: { tr: "Ateş",  en: "Fire"  } },
  earth: { color: "#c8a25e", glow: "rgba(200, 162, 94, 0.40)",  label: { tr: "Toprak", en: "Earth" } },
  air:   { color: "#a08aff", glow: "rgba(160, 138, 255, 0.40)", label: { tr: "Hava",  en: "Air"   } },
  water: { color: "#6ec3ff", glow: "rgba(110, 195, 255, 0.40)", label: { tr: "Su",    en: "Water" } },
};

/* ─────────────────────────────────────────────
   INTENT — what called the seeker today
   ───────────────────────────────────────────── */

export const INTENTS = ["calm", "power", "love", "clarity"] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_TUNING: Record<Intent, {
  hzShift: SolfeggioHz | null;
  label: { tr: string; en: string };
  whisper: { tr: string; en: string };
  symbol: string;
  color: string;
}> = {
  calm: {
    hzShift: 396,
    label:   { tr: "Sükûnet", en: "Calm" },
    whisper: { tr: "Sinirler yumuşar, içeri dönüş başlar.", en: "Nerves soften, the inward return begins." },
    symbol: "◯",
    color: "#6ec3ff",
  },
  power: {
    hzShift: 528,
    label:   { tr: "Güç",     en: "Power" },
    whisper: { tr: "Hücreler tetiktedir, ateş ayağa kalkar.", en: "The cells awaken, fire rises." },
    symbol: "△",
    color: "#ff8a5c",
  },
  love: {
    hzShift: 639,
    label:   { tr: "Sevgi",   en: "Love" },
    whisper: { tr: "Kalp aralanır, bağlar onarır.", en: "The heart opens, bonds mend." },
    symbol: "♡",
    color: "#ff8ad9",
  },
  clarity: {
    hzShift: 852,
    label:   { tr: "Berraklık", en: "Clarity" },
    whisper: { tr: "Sezgi keskinleşir, perde aralanır.", en: "Intuition sharpens, the veil parts." },
    symbol: "✦",
    color: "#a08aff",
  },
};

/* ─────────────────────────────────────────────
   RECOMMENDATIONS — Plants & Products by frequency
   ───────────────────────────────────────────── */

type PlantPick = {
  id: string;
  name: { tr: string; en: string };
  region: string;
  hz: SolfeggioHz | number;
  image: string;
  whisper: { tr: string; en: string };
};

const PLANT_LIBRARY: PlantPick[] = [
  {
    id: "lavanta",
    name: { tr: "Lavanta", en: "Lavender" },
    region: "İzmir / Isparta",
    hz: 396,
    image: "/universe/plants/lavanta.png",
    whisper: { tr: "Toprağın mor nefesi.", en: "The violet breath of the earth." },
  },
  {
    id: "biberiye",
    name: { tr: "Biberiye", en: "Rosemary" },
    region: "İzmir / Antalya",
    hz: 417,
    image: "/universe/plants/biberiye.png",
    whisper: { tr: "Rüzgârı hafızasında saklayan uyanış.", en: "An awakening that holds the wind." },
  },
  {
    id: "zeytin",
    name: { tr: "Zeytin", en: "Olive" },
    region: "Ege",
    hz: 528,
    image: "/universe/plants/zeytin.png",
    whisper: { tr: "Güneşle konuşan sabırlı bilge.", en: "The patient sage who speaks with the sun." },
  },
  {
    id: "melisa",
    name: { tr: "Melisa", en: "Lemon Balm" },
    region: "Isparta / Trabzon",
    hz: 639,
    image: "/universe/plants/melisa.png",
    whisper: { tr: "Telaşın içinden geçen huzur nehri.", en: "A river of stillness through the rush." },
  },
  {
    id: "adacayi",
    name: { tr: "Adaçayı", en: "Sage" },
    region: "İzmir / Ankara",
    hz: 741,
    image: "/universe/plants/adacayi.png",
    whisper: { tr: "Eski bilginin hafıza bitkisi.", en: "The plant of ancient memory." },
  },
  {
    id: "yasemin",
    name: { tr: "Yasemin", en: "Jasmine" },
    region: "Akdeniz / Ege",
    hz: 852,
    image: "/universe/plants/yasemin.png",
    whisper: { tr: "Yıldızların gece kokusu.", en: "Night fragrance of the stars." },
  },
  {
    id: "gul",
    name: { tr: "Gül", en: "Rose" },
    region: "Isparta",
    hz: 963,
    image: "/universe/plants/gul.png",
    whisper: { tr: "Toprağın kalpten konuştuğu an.", en: "When the soil speaks from the heart." },
  },
];

/** A single hand-picked product id per zodiac (matches data/products.ts). */
const ZODIAC_PRODUCT: Record<Zodiac, string> = {
  aries: "b1",
  taurus: "b2",
  gemini: "b3",
  cancer: "b4",
  leo: "b5",
  virgo: "b6",
  libra: "b7",
  scorpio: "b8",
  sagittarius: "b9",
  capricorn: "b10",
  aquarius: "b11",
  pisces: "b12",
};

/* ─────────────────────────────────────────────
   PUBLIC API
   ───────────────────────────────────────────── */

/** Convert any Date | ISO string | yyyy-mm-dd to a normalized {month, day}. */
export function normalizeDate(input: Date | string): { month: number; day: number; year: number } {
  if (input instanceof Date && !isNaN(input.getTime())) {
    return { month: input.getMonth() + 1, day: input.getDate(), year: input.getFullYear() };
  }
  const s = String(input).trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  }
  const tr = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(s);
  if (tr) {
    return { day: Number(tr[1]), month: Number(tr[2]), year: Number(tr[3]) };
  }
  throw new Error(`Unparseable date: ${input}`);
}

/** Compute zodiac sign from month/day. */
export function zodiacFromDate(input: Date | string): Zodiac {
  const { month, day } = normalizeDate(input);

  for (const r of ZODIAC_RANGES) {
    const [fm, fd] = r.from;
    const [tm, td] = r.to;

    if (fm === tm) {
      if (month === fm && day >= fd && day <= td) return r.sign;
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return r.sign;
    }
  }

  // Fallback (should not reach, but safe).
  return "capricorn";
}

export function elementOf(sign: Zodiac): Element {
  return ZODIAC_ELEMENT[sign];
}

export function modalityOf(sign: Zodiac): Modality {
  return ZODIAC_MODALITY[sign];
}

export function frequencyOf(sign: Zodiac): SolfeggioHz {
  return ZODIAC_FREQUENCY[sign];
}

export function archetypeOf(sign: Zodiac, lang: "tr" | "en" = "tr"): string {
  return ZODIAC_ARCHETYPE[sign][lang];
}

/**
 * Match a Solfeggio frequency to the closest plant in the library.
 * Uses absolute distance; ties resolve to first match.
 */
export function recommendPlant(hz: number): PlantPick {
  let best = PLANT_LIBRARY[0];
  let bestDist = Math.abs(best.hz - hz);
  for (let i = 1; i < PLANT_LIBRARY.length; i++) {
    const p = PLANT_LIBRARY[i];
    const d = Math.abs(p.hz - hz);
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

/** Recommended Caelinus product id for a zodiac (matches the bikini collection). */
export function recommendProductId(sign: Zodiac): string {
  return ZODIAC_PRODUCT[sign];
}

/* ─────────────────────────────────────────────
   COMPLETE PROFILE
   ───────────────────────────────────────────── */

export type FrequencyProfile = {
  /** ISO date string yyyy-mm-dd as entered by the user. */
  dob: string;
  intent: Intent;
  zodiac: Zodiac;
  element: Element;
  modality: Modality;
  frequency: SolfeggioHz;
  archetype: { tr: string; en: string };
  plant: PlantPick;
  productId: string;
  /** Unix ms when the profile was computed. */
  createdAt: number;
};

export function computeProfile(dob: Date | string, intent: Intent): FrequencyProfile {
  const sign = zodiacFromDate(dob);
  const baseFreq = frequencyOf(sign);
  // Intent slightly biases the experience but we keep the canonical
  // zodiac frequency as the primary number on the reveal screen.
  // The intent's hzShift is used by personalization for plant/scene picks.
  const intentShift = INTENT_TUNING[intent].hzShift ?? baseFreq;
  const plantPickHz = (baseFreq + intentShift) / 2;
  const plant = recommendPlant(plantPickHz);

  return {
    dob: typeof dob === "string" ? dob : dob.toISOString().slice(0, 10),
    intent,
    zodiac: sign,
    element: elementOf(sign),
    modality: modalityOf(sign),
    frequency: baseFreq,
    archetype: ZODIAC_ARCHETYPE[sign],
    plant,
    productId: recommendProductId(sign),
    createdAt: Date.now(),
  };
}

/** Locale-aware display label for the zodiac. */
export const ZODIAC_LABEL: Record<Zodiac, { tr: string; en: string; symbol: string }> = {
  aries:       { tr: "Koç",        en: "Aries",       symbol: "♈" },
  taurus:      { tr: "Boğa",       en: "Taurus",      symbol: "♉" },
  gemini:      { tr: "İkizler",    en: "Gemini",      symbol: "♊" },
  cancer:      { tr: "Yengeç",     en: "Cancer",      symbol: "♋" },
  leo:         { tr: "Aslan",      en: "Leo",         symbol: "♌" },
  virgo:       { tr: "Başak",      en: "Virgo",       symbol: "♍" },
  libra:       { tr: "Terazi",     en: "Libra",       symbol: "♎" },
  scorpio:     { tr: "Akrep",      en: "Scorpio",     symbol: "♏" },
  sagittarius: { tr: "Yay",        en: "Sagittarius", symbol: "♐" },
  capricorn:   { tr: "Oğlak",      en: "Capricorn",   symbol: "♑" },
  aquarius:    { tr: "Kova",       en: "Aquarius",    symbol: "♒" },
  pisces:      { tr: "Balık",      en: "Pisces",      symbol: "♓" },
};

/**
 * CAELINUS — Frequency Reading Engine
 *
 * Pure, deterministic. No LLM, no network. Given a person's answers
 * to a five-question intent quiz, this module returns:
 *
 *   • their dominant Solfeggio frequency
 *   • their dominant intent (calm / power / love / clarity)
 *   • their dominant element (fire / earth / air / water)
 *   • the plant whose voice best matches their reading
 *   • the Anatolian region that grew it
 *   • a small "ritual" derived from the plant's own ritual text
 *   • a poetic 4-line whisper composed from the plant's data
 *
 * Why pure?
 * ─────────
 *   • No external dependencies → ships in the bundle, runs offline.
 *   • Works during local dev with no API keys.
 *   • Same input → same output, useful for sharing the result.
 *
 * Where the magic comes from
 * ──────────────────────────
 *   The plant data in `data/gaia.ts` already encodes
 *   `frequency`, `solfeggioMatch`, `moods`, `intent`, `region` and
 *   `ritual` for every plant. We just need a sensitive scoring
 *   function that respects all of these signals.
 */

import type { Lang } from "@/stores/lang-store";
import {
  plants as ALL_PLANTS,
  type GaiaPlant,
  type Mood,
  type RegionId,
  regions as ALL_REGIONS,
} from "@/data/gaia";
import {
  type Element,
  type Intent,
  type SolfeggioHz,
  FREQUENCY_LABELS,
  INTENT_TUNING,
  ELEMENT_TONE,
} from "@/lib/frequency";
import {
  PROVINCE_REGIONS,
  type ProvinceRegionId,
} from "@/data/provinces";

/* ─────────────────────────────────────────────
   QUESTION DEFINITIONS
   ───────────────────────────────────────────── */

/** What the answer to a question contributes to the reading vector. */
export type AnswerVector = {
  /** Weight added to a given solfeggio bucket (0..1). */
  hz?: Partial<Record<SolfeggioHz, number>>;
  /** Weight added to a given intent (0..1). */
  intent?: Partial<Record<Intent, number>>;
  /** Weight added to a given element (0..1). */
  element?: Partial<Record<Element, number>>;
  /** Weight added to a mood family (0..1). */
  mood?: Partial<Record<Mood, number>>;
  /** Weight added to one of the seven phytogeographic regions (0..1). */
  region?: Partial<Record<ProvinceRegionId, number>>;
};

export type QuizQuestion = {
  id: string;
  prompt: { tr: string; en: string };
  /** Brief italic note above the prompt (optional). */
  hint?: { tr: string; en: string };
  options: QuizOption[];
};

export type QuizOption = {
  id: string;
  label: { tr: string; en: string };
  /** Shown beneath the label as a fragment of the answer's flavour. */
  caption?: { tr: string; en: string };
  /** Symbol or character rendered in the option card's accent slot. */
  symbol: string;
  /** Tone for the option chip. */
  tone: string;
  /** Weights this answer contributes to the final reading. */
  vector: AnswerVector;
};

/**
 * The five questions are ordered from outer (mood) → inward (intent),
 * a deliberate ritual cadence:
 *   1. How are you breathing right now?
 *   2. Where is the weight in your body?
 *   3. Which season would you walk into today?
 *   4. Which element calls you?
 *   5. What do you want to invite?
 */
export const FREQUENCY_QUIZ: QuizQuestion[] = [
  /* ──────────────────────────────── 1 */
  {
    id: "breath",
    prompt: {
      tr: "Şu an içinde nasıl bir nefes var?",
      en: "What kind of breath is moving through you right now?",
    },
    hint: {
      tr: "Ölçme. Sadece dinle.",
      en: "Don't measure. Just listen.",
    },
    options: [
      {
        id: "tight",
        label: { tr: "Sıkışmış, kısa", en: "Tight, short" },
        caption: { tr: "Omuzlar yukarıda.", en: "Shoulders up high." },
        symbol: "⌇",
        tone: "#6ec3ff",
        vector: {
          intent: { calm: 1 },
          mood: { sleep: 0.6, cleansing: 0.4 },
          hz: { 396: 1, 417: 0.4 },
          element: { water: 0.5, air: 0.4 },
        },
      },
      {
        id: "scattered",
        label: { tr: "Dağınık, hızlı", en: "Scattered, fast" },
        caption: { tr: "Düşünce trafiği.", en: "Thought-traffic." },
        symbol: "✷",
        tone: "#a08aff",
        vector: {
          intent: { clarity: 1 },
          mood: { focus: 0.7, clarity: 0.5 },
          hz: { 741: 0.6, 852: 0.8 },
          element: { air: 0.8 },
        },
      },
      {
        id: "heavy",
        label: { tr: "Ağır, donuk", en: "Heavy, dull" },
        caption: { tr: "Yere yapışmış.", en: "Stuck to the ground." },
        symbol: "▬",
        tone: "#c8a25e",
        vector: {
          intent: { power: 0.6, calm: 0.4 },
          mood: { grounding: 0.8, cleansing: 0.5 },
          hz: { 396: 0.6, 417: 0.7 },
          element: { earth: 1 },
        },
      },
      {
        id: "soft",
        label: { tr: "Yumuşak, akan", en: "Soft, flowing" },
        caption: { tr: "Su gibi.", en: "Water-like." },
        symbol: "◜",
        tone: "#ff8ad9",
        vector: {
          intent: { love: 0.8, calm: 0.4 },
          mood: { heart: 0.8, joy: 0.4 },
          hz: { 528: 0.5, 639: 0.9 },
          element: { water: 0.7 },
        },
      },
      {
        id: "radiant",
        label: { tr: "Sıcak, dolu", en: "Warm, full" },
        caption: { tr: "Ateş yanıyor içeride.", en: "A fire is burning inside." },
        symbol: "❂",
        tone: "#ff8a5c",
        vector: {
          intent: { power: 1 },
          mood: { awakening: 0.8, joy: 0.6 },
          hz: { 528: 0.9, 741: 0.4 },
          element: { fire: 1 },
        },
      },
    ],
  },

  /* ──────────────────────────────── 2 */
  {
    id: "weight",
    prompt: {
      tr: "Bedeninde ağırlık nereye yerleşmiş?",
      en: "Where in your body has the weight settled?",
    },
    hint: {
      tr: "İlk hissettiğin yer doğru cevaptır.",
      en: "The first place you feel is the right answer.",
    },
    options: [
      {
        id: "head",
        label: { tr: "Başımda", en: "In my head" },
        caption: { tr: "Çok fazla düşünce.", en: "Too many thoughts." },
        symbol: "◉",
        tone: "#a08aff",
        vector: {
          mood: { clarity: 0.8, focus: 0.5 },
          hz: { 852: 0.9, 963: 0.6 },
          element: { air: 0.8 },
          region: { "marmara": 0.4, "ic-anadolu": 0.3 },
        },
      },
      {
        id: "throat",
        label: { tr: "Boğazımda", en: "In my throat" },
        caption: { tr: "Söylenmemiş bir söz.", en: "An unsaid word." },
        symbol: "◇",
        tone: "#6ec3ff",
        vector: {
          mood: { cleansing: 0.7, clarity: 0.5 },
          hz: { 741: 0.9 },
          element: { air: 0.6, water: 0.4 },
          region: { "ege": 0.3 },
        },
      },
      {
        id: "heart",
        label: { tr: "Kalbimde", en: "In my heart" },
        caption: { tr: "Bir şey kapanmış.", en: "Something has closed." },
        symbol: "♡",
        tone: "#ff8ad9",
        vector: {
          mood: { heart: 1, joy: 0.4 },
          hz: { 639: 1, 528: 0.5 },
          element: { water: 0.6, fire: 0.3 },
          region: { "akdeniz": 0.4, "ege": 0.3 },
        },
      },
      {
        id: "belly",
        label: { tr: "Karnımda", en: "In my belly" },
        caption: { tr: "Sezgim sıkışmış.", en: "My intuition feels caged." },
        symbol: "◯",
        tone: "#c8a25e",
        vector: {
          mood: { grounding: 0.6, awakening: 0.5, cleansing: 0.5 },
          hz: { 417: 0.9, 528: 0.5 },
          element: { earth: 0.7, fire: 0.3 },
          region: { "guneydogu-anadolu": 0.4, "ic-anadolu": 0.3 },
        },
      },
      {
        id: "feet",
        label: { tr: "Ayaklarımda", en: "In my feet" },
        caption: { tr: "Yere bağ kopuyor.", en: "Losing root with the ground." },
        symbol: "▽",
        tone: "#9aaa6a",
        vector: {
          mood: { grounding: 1 },
          hz: { 396: 1 },
          element: { earth: 1 },
          region: { "karadeniz": 0.5, "dogu-anadolu": 0.4 },
        },
      },
    ],
  },

  /* ──────────────────────────────── 3 */
  {
    id: "season",
    prompt: {
      tr: "Bugün hangi mevsimin içine yürürdün?",
      en: "Which season would you walk into today?",
    },
    options: [
      {
        id: "spring",
        label: { tr: "İlkbahar", en: "Spring" },
        caption: { tr: "Yeni filiz, yumuşak yağmur.", en: "New shoots, soft rain." },
        symbol: "✿",
        tone: "#9aaa6a",
        vector: {
          mood: { awakening: 1, joy: 0.5 },
          intent: { power: 0.5, love: 0.4 },
          hz: { 417: 0.8, 528: 0.6 },
          element: { water: 0.4, earth: 0.4 },
          region: { "marmara": 0.3, "karadeniz": 0.3 },
        },
      },
      {
        id: "summer",
        label: { tr: "Yaz", en: "Summer" },
        caption: { tr: "Tuz, güneş, sıcak rüzgâr.", en: "Salt, sun, warm wind." },
        symbol: "☀",
        tone: "#ff8a5c",
        vector: {
          mood: { joy: 1, awakening: 0.5 },
          intent: { power: 0.6, love: 0.5 },
          hz: { 528: 0.9, 741: 0.4 },
          element: { fire: 0.8 },
          region: { "ege": 0.5, "akdeniz": 0.5 },
        },
      },
      {
        id: "autumn",
        label: { tr: "Sonbahar", en: "Autumn" },
        caption: { tr: "Olgun, bal rengi sessizlik.", en: "Ripe, honey-coloured stillness." },
        symbol: "❦",
        tone: "#c8a25e",
        vector: {
          mood: { clarity: 0.7, grounding: 0.7, cleansing: 0.4 },
          intent: { clarity: 0.6, calm: 0.4 },
          hz: { 639: 0.5, 852: 0.7 },
          element: { earth: 0.8 },
          region: { "guneydogu-anadolu": 0.4, "ic-anadolu": 0.4 },
        },
      },
      {
        id: "winter",
        label: { tr: "Kış", en: "Winter" },
        caption: { tr: "Kar, sessizlik, içerinin sıcaklığı.", en: "Snow, silence, the warmth within." },
        symbol: "❄",
        tone: "#6ec3ff",
        vector: {
          mood: { sleep: 1, clarity: 0.5 },
          intent: { calm: 0.8, clarity: 0.4 },
          hz: { 396: 0.8, 963: 0.6 },
          element: { water: 0.5, air: 0.4 },
          region: { "dogu-anadolu": 0.6, "karadeniz": 0.3 },
        },
      },
    ],
  },

  /* ──────────────────────────────── 4 */
  {
    id: "element",
    prompt: {
      tr: "Hangi öğe seni çağırıyor?",
      en: "Which element is calling you?",
    },
    hint: {
      tr: "Düşünme — bedenin söylesin.",
      en: "Don't think — let the body answer.",
    },
    options: [
      {
        id: "fire",
        label: { tr: "Ateş", en: "Fire" },
        caption: { tr: "Cesaret, eylem, ışık.", en: "Courage, action, light." },
        symbol: "△",
        tone: "#ff8a5c",
        vector: {
          element: { fire: 1.5 },
          intent: { power: 0.8 },
          mood: { awakening: 0.6, joy: 0.5 },
          hz: { 528: 0.5, 741: 0.6 },
          region: { "akdeniz": 0.4, "guneydogu-anadolu": 0.5 },
        },
      },
      {
        id: "water",
        label: { tr: "Su", en: "Water" },
        caption: { tr: "Akış, hatırlama, şefkat.", en: "Flow, remembrance, tenderness." },
        symbol: "▽",
        tone: "#6ec3ff",
        vector: {
          element: { water: 1.5 },
          intent: { calm: 0.6, love: 0.5 },
          mood: { heart: 0.6, sleep: 0.5, cleansing: 0.5 },
          hz: { 396: 0.5, 639: 0.7 },
          region: { "karadeniz": 0.6, "marmara": 0.4 },
        },
      },
      {
        id: "earth",
        label: { tr: "Toprak", en: "Earth" },
        caption: { tr: "Sabır, kök, hafıza.", en: "Patience, root, memory." },
        symbol: "▢",
        tone: "#9aaa6a",
        vector: {
          element: { earth: 1.5 },
          intent: { calm: 0.4, power: 0.5 },
          mood: { grounding: 1 },
          hz: { 396: 0.7, 417: 0.7 },
          region: { "ic-anadolu": 0.6, "dogu-anadolu": 0.5 },
        },
      },
      {
        id: "air",
        label: { tr: "Hava", en: "Air" },
        caption: { tr: "Nefes, fikir, yükseklik.", en: "Breath, idea, altitude." },
        symbol: "◌",
        tone: "#a08aff",
        vector: {
          element: { air: 1.5 },
          intent: { clarity: 0.9 },
          mood: { focus: 0.7, clarity: 0.7 },
          hz: { 741: 0.5, 852: 0.8, 963: 0.5 },
          region: { "ege": 0.4, "marmara": 0.4 },
        },
      },
    ],
  },

  /* ──────────────────────────────── 5 */
  {
    id: "invite",
    prompt: {
      tr: "Bugün toprağın sana ne getirmesini diliyorsun?",
      en: "What do you want the soil to bring you today?",
    },
    options: [
      {
        id: "calm",
        label: { tr: "Sükûnet", en: "Stillness" },
        caption: { tr: "Sinirler yumuşasın.", en: "Let the nerves soften." },
        symbol: "◯",
        tone: "#6ec3ff",
        vector: {
          intent: { calm: 1.5 },
          mood: { sleep: 0.8, heart: 0.3 },
          hz: { 396: 1, 639: 0.4 },
          element: { water: 0.5 },
        },
      },
      {
        id: "power",
        label: { tr: "Güç", en: "Power" },
        caption: { tr: "Hücreler tetikte.", en: "Cells alive and ready." },
        symbol: "△",
        tone: "#ff8a5c",
        vector: {
          intent: { power: 1.5 },
          mood: { awakening: 0.8, focus: 0.4 },
          hz: { 528: 1, 417: 0.4 },
          element: { fire: 0.6 },
        },
      },
      {
        id: "love",
        label: { tr: "Sevgi", en: "Love" },
        caption: { tr: "Kalp aralansın.", en: "Let the heart open." },
        symbol: "♡",
        tone: "#ff8ad9",
        vector: {
          intent: { love: 1.5 },
          mood: { heart: 1, joy: 0.5 },
          hz: { 639: 1, 528: 0.5 },
          element: { water: 0.4 },
        },
      },
      {
        id: "clarity",
        label: { tr: "Berraklık", en: "Clarity" },
        caption: { tr: "Perde aralansın.", en: "Let the veil part." },
        symbol: "✦",
        tone: "#a08aff",
        vector: {
          intent: { clarity: 1.5 },
          mood: { clarity: 1, focus: 0.5 },
          hz: { 852: 1, 741: 0.5, 963: 0.4 },
          element: { air: 0.6 },
        },
      },
      {
        id: "release",
        label: { tr: "Bırakış", en: "Release" },
        caption: { tr: "Eski olan dökülsün.", en: "Let what is old fall away." },
        symbol: "✺",
        tone: "#9aaa6a",
        vector: {
          intent: { calm: 0.6, clarity: 0.5 },
          mood: { cleansing: 1, grounding: 0.5 },
          hz: { 396: 0.6, 417: 0.7, 741: 0.4 },
          element: { earth: 0.4, water: 0.4 },
        },
      },
    ],
  },
];

/* ─────────────────────────────────────────────
   PHYTOGEOGRAPHIC ↔ GAIA REGION BRIDGE
   ───────────────────────────────────────────── */

/**
 * Plants in `data/gaia.ts` are tagged with the seven coarse `RegionId`s.
 * The Atlas page uses `ProvinceRegionId` which only differs in one entry
 * (`guneydogu` ↔ `guneydogu-anadolu`). These two bridges keep the rest
 * of the engine free from the renaming dance.
 */
const PR_TO_GAIA: Record<ProvinceRegionId, RegionId> = {
  "ege":               "ege",
  "akdeniz":           "akdeniz",
  "ic-anadolu":        "ic-anadolu",
  "karadeniz":         "karadeniz",
  "guneydogu-anadolu": "guneydogu",
  "dogu-anadolu":      "dogu-anadolu",
  "marmara":           "marmara",
};
const GAIA_TO_PR: Record<RegionId, ProvinceRegionId> = {
  "ege":          "ege",
  "akdeniz":      "akdeniz",
  "ic-anadolu":   "ic-anadolu",
  "karadeniz":    "karadeniz",
  "guneydogu":    "guneydogu-anadolu",
  "dogu-anadolu": "dogu-anadolu",
  "marmara":      "marmara",
};

/* ─────────────────────────────────────────────
   READING TYPE
   ───────────────────────────────────────────── */

export type FrequencyReading = {
  /** Seed used to compute this reading (the user's answers). */
  answers: Record<string, string>;
  /** The dominant Solfeggio frequency (canonical Hz). */
  frequency: SolfeggioHz;
  /** A short bilingual label for that frequency. */
  frequencyLabel: { tr: string; en: string };
  /** Dominant intent (calm / power / love / clarity). */
  intent: Intent;
  /** Dominant element (fire / earth / air / water). */
  element: Element;
  /** Top scoring plant. */
  plant: GaiaPlant;
  /** Anatolian region where the plant grows. */
  region: {
    id: ProvinceRegionId;
    name: { tr: string; en: string };
    tone: string;
    /** Sample province plate codes for the Atlas link (max 3). */
    samplePlates: string[];
  };
  /** Three short rituals composed from the plant's data. */
  rituals: { tr: string; en: string }[];
  /** A four-line whisper composed from the plant's voice. */
  whisper: { tr: string; en: string }[];
  /** Score the engine assigned to this plant (debug-friendly). */
  score: number;
};

/* ─────────────────────────────────────────────
   ENGINE
   ───────────────────────────────────────────── */

/**
 * Take the user's answers (a map of question.id → option.id) and
 * produce a complete reading. Throws if any answer is missing.
 */
export function readFrequency(
  answers: Record<string, string>,
): FrequencyReading {
  // ── 1. accumulate vectors ────────────────────────────────────
  const hz: Record<number, number> = {};
  const intent: Record<Intent, number> = { calm: 0, power: 0, love: 0, clarity: 0 };
  const element: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const mood: Record<Mood, number> = {
    sleep: 0, focus: 0, heart: 0, cleansing: 0,
    awakening: 0, clarity: 0, grounding: 0, joy: 0,
  };
  const region: Record<ProvinceRegionId, number> = {
    ege: 0, akdeniz: 0, "ic-anadolu": 0, karadeniz: 0,
    "guneydogu-anadolu": 0, "dogu-anadolu": 0, marmara: 0,
  };

  for (const question of FREQUENCY_QUIZ) {
    const chosen = answers[question.id];
    if (!chosen) {
      throw new Error(`Missing answer for question "${question.id}"`);
    }
    const opt = question.options.find((o) => o.id === chosen);
    if (!opt) {
      throw new Error(`Unknown option "${chosen}" for question "${question.id}"`);
    }
    const v = opt.vector;
    if (v.hz) for (const [k, w] of Object.entries(v.hz)) hz[Number(k)] = (hz[Number(k)] ?? 0) + (w ?? 0);
    if (v.intent) for (const [k, w] of Object.entries(v.intent)) intent[k as Intent] += w ?? 0;
    if (v.element) for (const [k, w] of Object.entries(v.element)) element[k as Element] += w ?? 0;
    if (v.mood) for (const [k, w] of Object.entries(v.mood)) mood[k as Mood] += w ?? 0;
    if (v.region) for (const [k, w] of Object.entries(v.region))
      region[k as ProvinceRegionId] += w ?? 0;
  }

  // ── 2. resolve dominants ─────────────────────────────────────
  const dominantHz = topKey(hz) as SolfeggioHz;
  const dominantIntent = topKey(intent) as Intent;
  const dominantElement = topKey(element) as Element;
  const dominantMood = topKey(mood) as Mood;
  const dominantRegion = topKey(region) as ProvinceRegionId;

  // ── 3. score every plant ─────────────────────────────────────
  // Weights are deliberate — intent and frequency carry the most
  // weight (they're explicitly chosen), region and mood follow.
  let bestPlant: GaiaPlant = ALL_PLANTS[0];
  let bestScore = -Infinity;

  for (const plant of ALL_PLANTS) {
    let score = 0;

    // direct intent match
    if (plant.intent === dominantIntent) score += 4;

    // frequency closeness — exact bucket match is best, neighbours OK
    if (plant.solfeggioMatch === dominantHz) score += 4;
    else {
      const diff = Math.abs(plant.solfeggioMatch - dominantHz);
      score += Math.max(0, 2 - diff / 100);
    }

    // mood family match
    if (plant.moods.includes(dominantMood)) score += 2.5;
    // partial mood resonance
    score += plant.moods.reduce((s, m) => s + (mood[m] ?? 0) * 0.5, 0);

    // region resonance
    const plantRegion = plant.region;
    score += region[GAIA_TO_PR[plantRegion]] * 1.8;
    if (plantRegion === PR_TO_GAIA[dominantRegion]) score += 1.5;

    // tiny tie-breaker so the same answers always pick the same plant
    score += stableNoise(plant.id) * 0.01;

    if (score > bestScore) {
      bestScore = score;
      bestPlant = plant;
    }
  }

  // ── 4. region metadata for the Atlas link ───────────────────
  const provinceRegionId = GAIA_TO_PR[bestPlant.region];
  const provinceRegion = PROVINCE_REGIONS.find(
    (r) => r.id === provinceRegionId,
  );
  const gaiaRegion = ALL_REGIONS.find((r) => r.id === bestPlant.region);

  const samplePlates = sampleProvincePlates(provinceRegionId);

  // ── 5. compose ritual + whisper from the plant's own voice ──
  const rituals = composeRituals(bestPlant);
  const whisper = composeWhisper(bestPlant);

  return {
    answers: { ...answers },
    frequency: dominantHz,
    frequencyLabel: FREQUENCY_LABELS[dominantHz],
    intent: dominantIntent,
    element: dominantElement,
    plant: bestPlant,
    region: {
      id: provinceRegionId,
      name:
        provinceRegion?.name ??
        gaiaRegion?.name ??
        { tr: bestPlant.region, en: bestPlant.region },
      tone: provinceRegion?.tone ?? "#9aaa6a",
      samplePlates,
    },
    rituals,
    whisper,
    score: bestScore,
  };
}

/* ─────────────────────────────────────────────
   COMPOSITION HELPERS
   ───────────────────────────────────────────── */

/**
 * Produce three short rituals derived from the plant's full ritual text.
 * If the plant only has one paragraph, we split it on Turkish-aware
 * sentence punctuation; if that yields fewer than three pieces we
 * pad with a couple of canonical Caelinus rituals so the result is
 * always exactly three lines.
 */
function composeRituals(plant: GaiaPlant): { tr: string; en: string }[] {
  const splitInto3 = (s: string) =>
    s
      .split(/(?<=[.!?…])\s+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 3);

  const tr = splitInto3(plant.ritual.tr);
  const en = splitInto3(plant.ritual.en);

  // Pad if needed using neutral Caelinus invitations.
  const fillTr = [
    "Üç derin nefes al — bitkinin ismini fısılda.",
    "Avucunu kalbine koy, bir an dur.",
    "Toprağa minnetini söyle.",
  ];
  const fillEn = [
    "Take three deep breaths — whisper the plant's name.",
    "Place a palm on your heart and pause.",
    "Speak gratitude to the soil.",
  ];

  while (tr.length < 3) tr.push(fillTr[tr.length] ?? fillTr[0]);
  while (en.length < 3) en.push(fillEn[en.length] ?? fillEn[0]);

  return tr.slice(0, 3).map((line, i) => ({ tr: line, en: en[i] }));
}

/**
 * Produce a four-line whisper. The first line is the plant's poetic
 * line; the next two are derived from healing & nutrition; the
 * fourth closes with the plant's mythology.
 */
function composeWhisper(plant: GaiaPlant): { tr: string; en: string }[] {
  const sentenceTr = (s: string) =>
    s.split(/(?<=[.!?…])\s+/)[0]?.trim() ?? s.trim();
  const sentenceEn = (s: string) =>
    s.split(/(?<=[.!?…])\s+/)[0]?.trim() ?? s.trim();

  return [
    { tr: sentenceTr(plant.poetic.tr),    en: sentenceEn(plant.poetic.en) },
    { tr: sentenceTr(plant.healing.tr),   en: sentenceEn(plant.healing.en) },
    { tr: sentenceTr(plant.nutrition.tr), en: sentenceEn(plant.nutrition.en) },
    { tr: sentenceTr(plant.mythology.tr), en: sentenceEn(plant.mythology.en) },
  ];
}

/* ─────────────────────────────────────────────
   ATLAS BRIDGE — sample province plates per region
   ───────────────────────────────────────────── */

import { PROVINCES } from "@/data/provinces";

/**
 * Pick up to three province plates from the given region.
 * We prefer provinces that are "regional capitals" by population —
 * Manisa/Izmir/Aydın for Ege, Adana/Antalya for Akdeniz, etc.
 * Falls back to the first three plates in the region if no
 * preferred capital is found.
 */
function sampleProvincePlates(regionId: ProvinceRegionId): string[] {
  const REGION_FAVOURITES: Record<ProvinceRegionId, string[]> = {
    "ege":               ["35", "45", "09"],   // İzmir, Manisa, Aydın
    "akdeniz":           ["07", "01", "33"],   // Antalya, Adana, Mersin
    "ic-anadolu":        ["06", "42", "38"],   // Ankara, Konya, Kayseri
    "karadeniz":         ["61", "55", "53"],   // Trabzon, Samsun, Rize
    "guneydogu-anadolu": ["27", "63", "21"],   // Gaziantep, Şanlıurfa, Diyarbakır
    "dogu-anadolu":      ["25", "65", "75"],   // Erzurum, Van, Ardahan
    "marmara":           ["34", "16", "59"],   // İstanbul, Bursa, Tekirdağ
  };

  const favourites = REGION_FAVOURITES[regionId] ?? [];
  const inRegion = new Set(
    PROVINCES.filter((p) => p.regionId === regionId).map((p) => p.plate),
  );
  const result = favourites.filter((p) => inRegion.has(p));
  if (result.length >= 3) return result;

  // pad with any remaining provinces
  for (const p of PROVINCES) {
    if (p.regionId === regionId && !result.includes(p.plate)) {
      result.push(p.plate);
      if (result.length >= 3) break;
    }
  }
  return result;
}

/* ─────────────────────────────────────────────
   UTILITIES
   ───────────────────────────────────────────── */

/** The key with the highest weight; ties resolve to first encountered. */
function topKey<T extends string | number>(map: Record<T, number>): T {
  let best: T | null = null;
  let bestVal = -Infinity;
  for (const k of Object.keys(map) as T[]) {
    const v = map[k];
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  if (best === null) {
    throw new Error("topKey called on empty map");
  }
  return best;
}

/** Deterministic small noise from a string id (0..1). */
function stableNoise(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 1000) / 1000;
}

/* ─────────────────────────────────────────────
   POETIC HEADERS for the reading screen (i18n)
   ───────────────────────────────────────────── */

export const READING_TEXT = {
  tr: {
    eyebrow: "FREKANS OKUMASI",
    yourFreq: "Senin frekansın",
    yourPlant: "Sana fısıldayan bitki",
    yourRegion: "Topraktan gelen bölge",
    yourRitual: "Toprağın sana önerdiği ritüel",
    yourWhisper: "Bitkinin sözleri",
    listenButton: "Bitkinin sesini dinle",
    atlasButton: "Bölgeyi haritada gör",
    plantPageButton: "Bitkinin tüm hikâyesi",
    again: "Tekrar oku",
    download: "Frekans imzanı indir",
    share: "Paylaş",
    intentLabel: "Niyet",
    elementLabel: "Öğe",
  },
  en: {
    eyebrow: "FREQUENCY READING",
    yourFreq: "Your frequency",
    yourPlant: "The plant whispering to you",
    yourRegion: "The soil that grew it",
    yourRitual: "The ritual the soil suggests",
    yourWhisper: "The plant's words",
    listenButton: "Listen to the plant",
    atlasButton: "See the region on the map",
    plantPageButton: "The plant's full story",
    again: "Read again",
    download: "Download your frequency signature",
    share: "Share",
    intentLabel: "Intent",
    elementLabel: "Element",
  },
} as const satisfies Record<Lang, Record<string, string>>;

/** Locale-aware label for the Intent. */
export function intentLabel(intent: Intent, lang: Lang): string {
  return INTENT_TUNING[intent].label[lang];
}

/** Locale-aware label for the Element. */
export function elementLabel(element: Element, lang: Lang): string {
  return ELEMENT_TONE[element].label[lang];
}

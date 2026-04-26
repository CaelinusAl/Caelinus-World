/**
 * CAELINUS — Sanctum Memory Line (pure aggregations).
 *
 * Pattern reading for the personal soil journal:
 *   • daily activity dots (was there a journal entry / a ritual?)
 *   • mood distribution
 *   • Hz distribution snapped to the 7 Solfeggio bands
 *   • Anatolian region distribution (via plant.region)
 *   • top-N most-met plants
 *   • a single woven poetic summary
 *
 * No state. No IO. No external libraries.
 */

import { plants, type Mood, type RegionId } from "@/data/gaia";
import { SOLFEGGIO, type SolfeggioHz } from "@/lib/frequency";
import type {
  JournalEntry,
  RitualLog,
  SanctumDate,
  SanctumState,
} from "./types";
import { todayDate } from "./selectors";

const PLANTS_BY_ID = new Map(plants.map((p) => [p.id, p]));

/* ─── DATE WALK ────────────────────────────────────── */

function shiftDate(d: SanctumDate, deltaDays: number): SanctumDate {
  const dt = new Date(`${d}T00:00:00`);
  dt.setDate(dt.getDate() + deltaDays);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

/* ─── DAILY DOTS ───────────────────────────────────── */

export type DailyDot = {
  date: SanctumDate;
  /** N journal entries that day. */
  entries: number;
  /** N ritual logs that day. */
  rituals: number;
  /** Convenience: at least one entry. */
  hasEntry: boolean;
  /** Convenience: at least one ritual. */
  hasRitual: boolean;
};

/**
 * Returns N (windowDays) dots from oldest → newest, ending today.
 * If windowDays = 30, returns 30 entries — index 0 is N-1 days ago,
 * index N-1 is today.
 */
export function dailyDots(
  state: SanctumState,
  windowDays: number,
  endDate: SanctumDate = todayDate()
): DailyDot[] {
  const entryByDate = new Map<SanctumDate, number>();
  for (const e of state.entries) {
    entryByDate.set(e.date, (entryByDate.get(e.date) ?? 0) + 1);
  }
  const ritualByDate = new Map<SanctumDate, number>();
  for (const r of state.rituals) {
    ritualByDate.set(r.date, (ritualByDate.get(r.date) ?? 0) + 1);
  }
  const out: DailyDot[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = shiftDate(endDate, -i);
    const entries = entryByDate.get(d) ?? 0;
    const rituals = ritualByDate.get(d) ?? 0;
    out.push({
      date: d,
      entries,
      rituals,
      hasEntry: entries > 0,
      hasRitual: rituals > 0,
    });
  }
  return out;
}

/* ─── ENTRIES IN WINDOW (uses entry.date relative to window endDate) ─── */

export function entriesIn(
  entries: JournalEntry[],
  windowDays: number,
  endDate: SanctumDate = todayDate()
): JournalEntry[] {
  const start = shiftDate(endDate, -(windowDays - 1));
  return entries.filter((e) => e.date >= start && e.date <= endDate);
}

export function ritualsIn(
  rituals: RitualLog[],
  windowDays: number,
  endDate: SanctumDate = todayDate()
): RitualLog[] {
  const start = shiftDate(endDate, -(windowDays - 1));
  return rituals.filter((r) => r.date >= start && r.date <= endDate);
}

/* ─── MOOD DISTRIBUTION ────────────────────────────── */

export type MoodDistribution = Record<Mood, number>;

const ZERO_MOOD_DIST = (): MoodDistribution => ({
  sleep: 0,
  focus: 0,
  heart: 0,
  cleansing: 0,
  awakening: 0,
  clarity: 0,
  grounding: 0,
  joy: 0,
});

/** Counts how many entries tagged each mood (multi-select friendly). */
export function moodDistribution(entries: JournalEntry[]): MoodDistribution {
  const out = ZERO_MOOD_DIST();
  for (const e of entries) {
    for (const m of e.moods) {
      // m may be any string in legacy storage; ignore unknowns.
      if (m in out) out[m] += 1;
    }
  }
  return out;
}

/* ─── Hz DISTRIBUTION (Solfeggio buckets) ──────────── */

export type HzDistribution = Record<SolfeggioHz, number>;

const ZERO_HZ_DIST = (): HzDistribution =>
  ({
    396: 0,
    417: 0,
    528: 0,
    639: 0,
    741: 0,
    852: 0,
    963: 0,
  }) as HzDistribution;

/** Snap any frequency to the closest Solfeggio. */
export function snapSolfeggio(hz: number): SolfeggioHz {
  let best: SolfeggioHz = SOLFEGGIO[0];
  let bestDiff = Math.abs(hz - SOLFEGGIO[0]);
  for (const s of SOLFEGGIO) {
    const d = Math.abs(hz - s);
    if (d < bestDiff) {
      bestDiff = d;
      best = s;
    }
  }
  return best;
}

/**
 * Bucket entries by Solfeggio:
 *   • An entry contributes 1 to its snapped band based on entry.frequency
 *     when present, otherwise via plant.frequency, otherwise skipped.
 */
export function hzDistribution(entries: JournalEntry[]): HzDistribution {
  const out = ZERO_HZ_DIST();
  for (const e of entries) {
    const raw =
      typeof e.frequency === "number"
        ? e.frequency
        : (e.plantId ? PLANTS_BY_ID.get(e.plantId)?.frequency ?? null : null);
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    out[snapSolfeggio(raw)] += 1;
  }
  return out;
}

/* ─── REGION DISTRIBUTION ──────────────────────────── */

export type RegionDistribution = Record<RegionId, number>;

const ZERO_REGION_DIST = (): RegionDistribution => ({
  ege: 0,
  akdeniz: 0,
  "ic-anadolu": 0,
  karadeniz: 0,
  guneydogu: 0,
  "dogu-anadolu": 0,
  marmara: 0,
});

/** Counts how many entries reference a plant whose region is X. */
export function regionDistribution(
  entries: JournalEntry[]
): RegionDistribution {
  const out = ZERO_REGION_DIST();
  for (const e of entries) {
    if (!e.plantId) continue;
    const p = PLANTS_BY_ID.get(e.plantId);
    if (!p) continue;
    if (p.region in out) out[p.region] += 1;
  }
  return out;
}

/* ─── TOP PLANTS ───────────────────────────────────── */

/**
 * Top-N plants combining journal entries + ritual logs.
 * Returns plant ids in descending count order.
 */
export function topPlantsCombined(
  entries: JournalEntry[],
  rituals: RitualLog[],
  k = 3
): Array<{ id: string; count: number }> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (!e.plantId) continue;
    counts.set(e.plantId, (counts.get(e.plantId) ?? 0) + 1);
  }
  for (const r of rituals) {
    counts.set(r.plantId, (counts.get(r.plantId) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([id, count]) => ({ id, count }));
}

/* ─── ARGMAX HELPERS ───────────────────────────────── */

/** Highest-counted key in a record; null on all-zero. Stable order on ties. */
export function argmaxRecord<K extends string>(
  rec: Record<K, number>
): K | null {
  let best: K | null = null;
  let bestN = 0;
  (Object.keys(rec) as K[]).forEach((k) => {
    if (rec[k] > bestN) {
      best = k;
      bestN = rec[k];
    }
  });
  return best;
}

/* ─── POETIC SUMMARY ───────────────────────────────── */

export type MemoryReading = {
  windowDays: number;
  totalEntries: number;
  totalRituals: number;
  activeDays: number;
  daily: DailyDot[];
  moodDist: MoodDistribution;
  hzDist: HzDistribution;
  regionDist: RegionDistribution;
  topPlants: Array<{ id: string; count: number }>;
  dominantMood: Mood | null;
  dominantHz: SolfeggioHz | null;
  dominantRegion: RegionId | null;
};

export function buildMemoryReading(
  state: SanctumState,
  windowDays = 30,
  endDate: SanctumDate = todayDate()
): MemoryReading {
  const daily = dailyDots(state, windowDays, endDate);
  const ents = entriesIn(state.entries, windowDays, endDate);
  const rits = ritualsIn(state.rituals, windowDays, endDate);
  const moodDist = moodDistribution(ents);
  const hzDist = hzDistribution(ents);
  const regionDist = regionDistribution(ents);
  const topPlants = topPlantsCombined(ents, rits, 3);
  const activeDays = daily.filter((d) => d.hasEntry || d.hasRitual).length;

  const domMood = argmaxRecord(moodDist) as Mood | null;
  const domHzKey = argmaxRecord(hzDist) as string | null;
  const domHz = (domHzKey ? Number(domHzKey) : null) as SolfeggioHz | null;
  const domRegion = argmaxRecord(regionDist) as RegionId | null;

  return {
    windowDays,
    totalEntries: ents.length,
    totalRituals: rits.length,
    activeDays,
    daily,
    moodDist,
    hzDist,
    regionDist,
    topPlants,
    dominantMood: domMood,
    dominantHz: domHz,
    dominantRegion: domRegion,
  };
}

/* ─── REGION & MOOD POETIC LOOKUPS ─────────────────── */

const REGION_POETIC: Record<RegionId, { tr: string; en: string }> = {
  ege:            { tr: "Ege toprağında",          en: "on Aegean soil" },
  akdeniz:        { tr: "Akdeniz toprağında",      en: "on Mediterranean soil" },
  "ic-anadolu":   { tr: "İç Anadolu bozkırında",   en: "on the Central Anatolian steppe" },
  karadeniz:      { tr: "Karadeniz nemli toprağında", en: "in the moist Black Sea soil" },
  guneydogu:      { tr: "Güneydoğu güneşinde",     en: "under the Southeastern sun" },
  "dogu-anadolu": { tr: "Doğu Anadolu yaylasında", en: "on the Eastern Anatolian plateau" },
  marmara:        { tr: "Marmara'nın eşiğinde",    en: "on the threshold of Marmara" },
};

const MOOD_POETIC: Record<Mood, { tr: string; en: string }> = {
  sleep:     { tr: "uykuda",        en: "in sleep"      },
  focus:     { tr: "odakta",        en: "in focus"      },
  heart:     { tr: "kalpte",        en: "in the heart"  },
  cleansing: { tr: "arınmada",      en: "in cleansing"  },
  awakening: { tr: "uyanışta",      en: "in awakening"  },
  clarity:   { tr: "berraklıkta",   en: "in clarity"    },
  grounding: { tr: "köklenmede",    en: "in grounding"  },
  joy:       { tr: "sevinçte",      en: "in joy"        },
};

/** Look up the poetic phrase for a region (TR/EN). Null-safe. */
export function regionPoetic(region: RegionId | null, lang: "tr" | "en"): string | null {
  if (!region) return null;
  return REGION_POETIC[region][lang];
}

/** Look up the poetic phrase for a mood (TR/EN). Null-safe. */
export function moodPoetic(mood: Mood | null, lang: "tr" | "en"): string | null {
  if (!mood) return null;
  return MOOD_POETIC[mood][lang];
}

/**
 * One-line woven poetic summary, e.g.:
 *   TR  — "Son 30 gün: Akdeniz toprağında, 528 Hz'de, kalpte yaşadın."
 *   EN  — "The last 30 days: on Mediterranean soil, at 528 Hz, in the heart you lived."
 *
 * Falls back to a soft, gentle prompt when there is no data.
 */
export function poeticSummary(
  reading: MemoryReading,
  lang: "tr" | "en"
): string {
  if (reading.activeDays === 0) {
    return lang === "tr"
      ? "Son toprak hâlâ sessiz. İlk satır en değerli olandır — bir nefes al, başla."
      : "The soil is still silent. The first line is the most precious — breathe, begin.";
  }
  const parts: string[] = [];
  const region = regionPoetic(reading.dominantRegion, lang);
  const mood = moodPoetic(reading.dominantMood, lang);
  const hz = reading.dominantHz ? `${reading.dominantHz} Hz` : null;

  if (lang === "tr") {
    const head = `Son ${reading.windowDays} gün:`;
    if (region) parts.push(region);
    if (hz) parts.push(`${hz}'de`);
    if (mood) parts.push(mood);
    if (parts.length === 0) {
      return `${head} yazılı bir nefes — sayfa açılmaya devam ediyor.`;
    }
    return `${head} ${parts.join(", ")} yaşadın.`;
  }
  const head = `The last ${reading.windowDays} days:`;
  if (region) parts.push(region);
  if (hz) parts.push(`at ${hz}`);
  if (mood) parts.push(mood);
  if (parts.length === 0) {
    return `${head} a written breath — the page keeps opening.`;
  }
  return `${head} ${parts.join(", ")} you lived.`;
}

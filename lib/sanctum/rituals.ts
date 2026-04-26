/**
 * CAELINUS — Sanctum Ritual logic (pure).
 *
 * Per-plant streak, threshold detection, and mood-aware title naming.
 * Given a list of RitualLog rows, we surface:
 *
 *   • current consecutive-day streak per plant
 *   • current overall streak (any ritual, any day)
 *   • named threshold the user has crossed
 *
 * No state, no IO. The page reads from the store and feeds these
 * functions a slice of logs.
 */

import type { Mood } from "@/data/gaia";
import type { RitualLog, SanctumDate } from "./types";
import { todayDate } from "./selectors";

/* ─── Threshold ladder (universal, mood-overlaid) ─── */

/** A single rung in the ritual streak ladder. */
export type RitualThreshold = {
  /** Required consecutive days. */
  days: number;
  /** Universal label without mood overlay. */
  base: { tr: string; en: string };
};

export const RITUAL_THRESHOLDS: ReadonlyArray<RitualThreshold> = [
  { days: 3,  base: { tr: "Eşik",   en: "Threshold" } },
  { days: 7,  base: { tr: "Halka",  en: "Ring"      } },
  { days: 21, base: { tr: "Döngü",  en: "Cycle"     } },
  { days: 49, base: { tr: "Toprak", en: "Soil"      } },
];

/** A poetic adjective per Caelinus mood that overlays a threshold. */
const MOOD_TITLE: Record<Mood, { tr: string; en: string }> = {
  sleep:     { tr: "Uyku",      en: "Sleep"      },
  focus:     { tr: "Odak",      en: "Focus"      },
  heart:     { tr: "Kalp",      en: "Heart"      },
  cleansing: { tr: "Arınma",    en: "Cleansing"  },
  awakening: { tr: "Uyanış",    en: "Awakening"  },
  clarity:   { tr: "Berrak",    en: "Clear"      },
  grounding: { tr: "Köklenme",  en: "Grounding"  },
  joy:       { tr: "Sevinç",    en: "Joy"        },
};

/** Highest threshold whose `days` <= `streak`, or null. */
export function thresholdFor(streak: number): RitualThreshold | null {
  let hit: RitualThreshold | null = null;
  for (const t of RITUAL_THRESHOLDS) {
    if (streak >= t.days) hit = t;
  }
  return hit;
}

/**
 * Compose the mood-aware threshold title:
 *   base("Halka") + lead-mood("Uyku") → "Uyku Halkası" / "Sleep Ring"
 * If no mood is given, we just return the base label.
 */
export function namedThreshold(
  threshold: RitualThreshold,
  leadMood: Mood | null,
  lang: "tr" | "en"
): string {
  if (!leadMood) return threshold.base[lang];
  const mood = MOOD_TITLE[leadMood];
  if (!mood) return threshold.base[lang];
  if (lang === "tr") {
    // simple suffix logic — Halka → Halkası, Eşik → Eşiği, Döngü → Döngüsü, Toprak → Toprağı
    const suffixed: Record<string, string> = {
      Eşik: "Eşiği",
      Halka: "Halkası",
      Döngü: "Döngüsü",
      Toprak: "Toprağı",
    };
    const t = suffixed[threshold.base.tr] ?? threshold.base.tr;
    return `${mood.tr} ${t}`;
  }
  return `${mood.en} ${threshold.base.en}`;
}

/** The next threshold above the current streak, or null if topped. */
export function nextThreshold(streak: number): RitualThreshold | null {
  for (const t of RITUAL_THRESHOLDS) {
    if (streak < t.days) return t;
  }
  return null;
}

/* ─── Streak math ─────────────────────────────────── */

/** YYYY-MM-DD shifted by N days (negative = into the past). */
function shiftDate(d: SanctumDate, deltaDays: number): SanctumDate {
  const dt = new Date(`${d}T00:00:00`);
  dt.setDate(dt.getDate() + deltaDays);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Streak of consecutive days ending today (or yesterday, if today is empty)
 * for which there is at least one ritual log on the predicate.
 */
function streakOver(
  logs: RitualLog[],
  predicate: (log: RitualLog) => boolean
): number {
  if (logs.length === 0) return 0;
  const days = new Set(logs.filter(predicate).map((l) => l.date));
  if (days.size === 0) return 0;
  let cursor = todayDate();
  if (!days.has(cursor)) cursor = shiftDate(cursor, -1);
  let n = 0;
  while (days.has(cursor)) {
    n += 1;
    cursor = shiftDate(cursor, -1);
  }
  return n;
}

/** Consecutive-day streak for a single plant. */
export function streakForPlant(logs: RitualLog[], plantId: string): number {
  return streakOver(logs, (l) => l.plantId === plantId);
}

/** Consecutive-day streak across any ritual. */
export function streakAcrossAll(logs: RitualLog[]): number {
  return streakOver(logs, () => true);
}

/* ─── Aggregations for the page ───────────────────── */

/** Did the user practise plantId on `date` (defaults to today)? */
export function practisedOn(
  logs: RitualLog[],
  plantId: string,
  date: SanctumDate = todayDate()
): boolean {
  return logs.some((l) => l.plantId === plantId && l.date === date);
}

/** Total number of times the user practised plantId. */
export function totalForPlant(logs: RitualLog[], plantId: string): number {
  return logs.filter((l) => l.plantId === plantId).length;
}

/** Most-practised plant ids, sorted by total desc. */
export function topPlants(logs: RitualLog[], k = 3): string[] {
  const counts = new Map<string, number>();
  for (const l of logs) counts.set(l.plantId, (counts.get(l.plantId) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([id]) => id);
}

/** Logs the user practised today, newest first. */
export function logsForDate(
  logs: RitualLog[],
  date: SanctumDate = todayDate()
): RitualLog[] {
  return logs
    .filter((l) => l.date === date)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Logs across all dates, newest first (sort by date desc, then createdAt desc). */
export function logsNewestFirst(logs: RitualLog[]): RitualLog[] {
  return [...logs].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

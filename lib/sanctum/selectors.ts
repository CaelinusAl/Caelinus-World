/**
 * CAELINUS — Sanctum derived selectors (pure).
 *
 * No state, no IO. Given a SanctumState (or its parts), return the
 * computed signals we want to render: streaks, dominant moods, etc.
 */

import type { Mood } from "@/data/gaia";
import type {
  JournalEntry,
  MoodTrace,
  SanctumDate,
  SanctumState,
} from "./types";

/* ─── DATE HELPERS ─────────────────────────────────── */

export function dayDiff(a: SanctumDate, b: SanctumDate): number {
  const ad = new Date(`${a}T00:00:00`);
  const bd = new Date(`${b}T00:00:00`);
  return Math.round((ad.getTime() - bd.getTime()) / 86_400_000);
}

export function todayDate(): SanctumDate {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* ─── ENTRY-SCOPED SELECTORS ───────────────────────── */

/** Group entries by YYYY-MM-DD (newest day first). */
export function groupEntriesByDate(
  entries: JournalEntry[]
): Array<{ date: SanctumDate; items: JournalEntry[] }> {
  const map = new Map<SanctumDate, JournalEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }
  const days = Array.from(map.entries()).map(([date, items]) => ({
    date,
    items: [...items].sort((a, b) => b.createdAt - a.createdAt),
  }));
  days.sort((a, b) => (a.date < b.date ? 1 : -1));
  return days;
}

/** Number of unique days covered by entries within last `windowDays`. */
export function entriesInWindow(
  entries: JournalEntry[],
  windowDays: number,
  ref: SanctumDate = todayDate()
): JournalEntry[] {
  return entries.filter((e) => {
    const diff = dayDiff(ref, e.date);
    return diff >= 0 && diff < windowDays;
  });
}

/**
 * Streak of consecutive days (ending today) with at least one entry.
 * Today counts only if there's an entry; otherwise we start from yesterday.
 */
export function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((e) => e.date));
  const today = todayDate();
  let streak = 0;
  let cursor = today;
  // If no entry today, start from yesterday so a streak can still exist.
  if (!days.has(cursor)) {
    const d = new Date(`${cursor}T00:00:00`);
    d.setDate(d.getDate() - 1);
    cursor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }
  while (days.has(cursor)) {
    streak += 1;
    const d = new Date(`${cursor}T00:00:00`);
    d.setDate(d.getDate() - 1);
    cursor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return streak;
}

/**
 * Most-frequent mood across the given entries; null on tie / empty.
 * (We break ties by latest createdAt for stability.)
 */
export function dominantMood(entries: JournalEntry[]): Mood | null {
  if (entries.length === 0) return null;
  const counts = new Map<Mood, { n: number; lastAt: number }>();
  for (const e of entries) {
    for (const m of e.moods) {
      const cur = counts.get(m) ?? { n: 0, lastAt: 0 };
      cur.n += 1;
      cur.lastAt = Math.max(cur.lastAt, e.createdAt);
      counts.set(m, cur);
    }
  }
  let bestMood: Mood | null = null;
  let bestN = -1;
  let bestAt = -1;
  counts.forEach((v, k) => {
    if (v.n > bestN || (v.n === bestN && v.lastAt > bestAt)) {
      bestMood = k;
      bestN = v.n;
      bestAt = v.lastAt;
    }
  });
  return bestMood;
}

/** Most-frequent Hz; ignores nulls. Null on empty / all-null. */
export function dominantHz(entries: JournalEntry[]): number | null {
  const counts = new Map<number, number>();
  for (const e of entries) {
    if (typeof e.frequency !== "number") continue;
    counts.set(e.frequency, (counts.get(e.frequency) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let bestHz: number | null = null;
  let bestN = -1;
  counts.forEach((n, hz) => {
    if (n > bestN) {
      bestHz = hz;
      bestN = n;
    }
  });
  return bestHz;
}

/** Most-frequent plantId. */
export function dominantPlantId(entries: JournalEntry[]): string | null {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (!e.plantId) continue;
    counts.set(e.plantId, (counts.get(e.plantId) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let bestId: string | null = null;
  let bestN = -1;
  counts.forEach((n, id) => {
    if (n > bestN) {
      bestId = id;
      bestN = n;
    }
  });
  return bestId;
}

/** Build a MoodTrace summary for the last `windowDays`. */
export function buildMoodTrace(
  state: SanctumState,
  windowDays = 30
): MoodTrace {
  const window = entriesInWindow(state.entries, windowDays);
  return {
    windowDays,
    totalEntries: window.length,
    dominantMood: dominantMood(window),
    dominantHz: dominantHz(window),
    dominantPlantId: dominantPlantId(window),
    streakDays: computeStreak(state.entries),
  };
}

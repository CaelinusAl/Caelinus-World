/**
 * CAELINUS — Sanctum (Kişisel Toprak Defteri)
 *
 * Type system for the user's personal journal of their frequency
 * journey: which plant whispered today, what mood, what ritual,
 * what the soil said.
 *
 *   • All entries are local-first (localStorage). Future Supabase
 *     sync should accept the same shape.
 *   • Every text field is bilingual (the user authors in their own
 *     voice, but the schema is language-agnostic).
 *   • IDs are deterministic (timestamp + nanoid-like suffix) so we
 *     can sort/sync without UUID dependency.
 */

import type { Mood } from "@/data/gaia";

/* ─── BASIC PRIMITIVES ─────────────────────────────── */

export type SanctumId = string; // e.g. "j_1714150123456_a3k9"

/** ISO date string (YYYY-MM-DD). The day the entry belongs to. */
export type SanctumDate = string;

/** Solfeggio Hz the entry was attuned to (free-form for honesty). */
export type SanctumHz = number;

/* ─── JOURNAL ENTRY ────────────────────────────────── */

/** A single page in the personal soil journal. */
export type JournalEntry = {
  id: SanctumId;
  /** YYYY-MM-DD — the date the user assigns (not necessarily createdAt). */
  date: SanctumDate;
  /** Plant id from data/gaia.ts (or null if just a mood note). */
  plantId: string | null;
  /** Hz the user felt or chose; defaults to plant.frequency or profile.frequency. */
  frequency: SanctumHz | null;
  /** Mood tags the user picked (Caelinus 8 moods). */
  moods: Mood[];
  /** Free-form text the user wrote (their own voice). */
  body: string;
  /** Optional, very short title — the day in one line. */
  title?: string;
  /** Optional ritual reference (the slug of the plant whose ritual was practised). */
  ritualOfPlantId?: string | null;
  /** Optional dataURL image (kept small; large images go to IndexedDB later). */
  imageDataUrl?: string | null;
  /** Created timestamp (ms since epoch). */
  createdAt: number;
  /** Last updated timestamp. */
  updatedAt: number;
};

/* ─── RITUAL LOG ───────────────────────────────────── */

/**
 * A record that the user practised a plant's ritual on a given day.
 * Fed by data/gaia.ts plant.ritual fields.
 */
export type RitualLog = {
  id: SanctumId;
  date: SanctumDate;
  plantId: string;
  /** 1–5 how-deep self report (optional). */
  depth?: 1 | 2 | 3 | 4 | 5;
  /** Free-form remembrance after the ritual. */
  reflection?: string;
  createdAt: number;
};

/* ─── DERIVED PATTERNS (read-only, computed at runtime) ─── */

export type MoodTrace = {
  /** Last N days; e.g. 30. */
  windowDays: number;
  /** Total entries in the window. */
  totalEntries: number;
  /** Most-frequent mood, if any (ties broken by latest). */
  dominantMood: Mood | null;
  /** Most-frequent Hz bucket. */
  dominantHz: SanctumHz | null;
  /** Most-visited plant. */
  dominantPlantId: string | null;
  /** Streak of consecutive days with at least one entry. */
  streakDays: number;
};

/* ─── ROOT SHAPE PERSISTED IN LOCALSTORAGE ───────────────────── */

/** Schema version for forward-compatible migrations. */
export const SANCTUM_SCHEMA_VERSION = 1;

export type SanctumState = {
  version: number;
  entries: JournalEntry[];
  rituals: RitualLog[];
};

export const EMPTY_SANCTUM: SanctumState = {
  version: SANCTUM_SCHEMA_VERSION,
  entries: [],
  rituals: [],
};

/* ─── HELPERS (pure) ───────────────────────────────── */

/**
 * Make a 6-char base36 random suffix using crypto.getRandomValues
 * if available (browser), otherwise Math.random.
 */
function rand6(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const b = new Uint8Array(4);
    crypto.getRandomValues(b);
    let n = 0;
    for (let i = 0; i < 4; i++) n = n * 256 + b[i];
    return n.toString(36).slice(-6).padStart(6, "0");
  }
  return Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, "0");
}

export function newSanctumId(prefix: "j" | "r" = "j"): SanctumId {
  return `${prefix}_${Date.now()}_${rand6()}`;
}

/** Produce a YYYY-MM-DD string from a Date (local timezone). */
export function toSanctumDate(d: Date = new Date()): SanctumDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Sort newest-first by `date` then `createdAt`. Pure, returns a new array. */
export function sortNewestFirst<T extends { date: SanctumDate; createdAt: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

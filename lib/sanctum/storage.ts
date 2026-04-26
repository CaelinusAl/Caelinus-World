/**
 * CAELINUS — Sanctum local storage layer.
 *
 * Local-first persistence for the personal soil journal. Uses
 * window.localStorage so we stay consistent with profile-store
 * and lang-store (no extra dependency, no async ceremony).
 *
 * Future: a Supabase mirror can subscribe to the same shape.
 */

import {
  EMPTY_SANCTUM,
  SANCTUM_SCHEMA_VERSION,
  type SanctumState,
  type JournalEntry,
  type RitualLog,
} from "./types";

export const SANCTUM_STORAGE_KEY = "caelinus_sanctum_v1";

function isJournalEntry(x: unknown): x is JournalEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as JournalEntry;
  return (
    typeof e.id === "string" &&
    typeof e.date === "string" &&
    typeof e.body === "string" &&
    Array.isArray(e.moods) &&
    typeof e.createdAt === "number" &&
    typeof e.updatedAt === "number"
  );
}

function isRitualLog(x: unknown): x is RitualLog {
  if (!x || typeof x !== "object") return false;
  const r = x as RitualLog;
  return (
    typeof r.id === "string" &&
    typeof r.date === "string" &&
    typeof r.plantId === "string" &&
    typeof r.createdAt === "number"
  );
}

export function loadSanctum(): SanctumState {
  if (typeof window === "undefined") return EMPTY_SANCTUM;
  try {
    const raw = window.localStorage.getItem(SANCTUM_STORAGE_KEY);
    if (!raw) return EMPTY_SANCTUM;
    const parsed = JSON.parse(raw) as Partial<SanctumState>;
    if (!parsed || typeof parsed !== "object") return EMPTY_SANCTUM;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter(isJournalEntry)
      : [];
    const rituals = Array.isArray(parsed.rituals)
      ? parsed.rituals.filter(isRitualLog)
      : [];
    return {
      version: SANCTUM_SCHEMA_VERSION,
      entries,
      rituals,
    };
  } catch {
    return EMPTY_SANCTUM;
  }
}

export function saveSanctum(state: SanctumState): void {
  if (typeof window === "undefined") return;
  try {
    const safe: SanctumState = {
      version: SANCTUM_SCHEMA_VERSION,
      entries: state.entries,
      rituals: state.rituals,
    };
    window.localStorage.setItem(SANCTUM_STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // ignore quota / privacy errors
  }
}

export function clearSanctum(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SANCTUM_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Export the entire sanctum as a JSON string the user can save.
 * (Future "Bulutla yedekle" hook lives on top of this.)
 */
export function exportSanctumJson(state: SanctumState): string {
  return JSON.stringify(
    {
      app: "caelinus.sanctum",
      version: SANCTUM_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      entries: state.entries,
      rituals: state.rituals,
    },
    null,
    2
  );
}

/**
 * Import a previously exported JSON. Returns a new SanctumState
 * (caller decides how to merge / replace).
 */
export function parseSanctumImport(json: string): SanctumState | null {
  try {
    const obj = JSON.parse(json) as Partial<SanctumState> & { app?: string };
    if (!obj || typeof obj !== "object") return null;
    const entries = Array.isArray(obj.entries) ? obj.entries.filter(isJournalEntry) : [];
    const rituals = Array.isArray(obj.rituals) ? obj.rituals.filter(isRitualLog) : [];
    return {
      version: SANCTUM_SCHEMA_VERSION,
      entries,
      rituals,
    };
  } catch {
    return null;
  }
}

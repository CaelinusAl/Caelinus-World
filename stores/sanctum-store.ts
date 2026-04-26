"use client";

import { create } from "zustand";
import {
  EMPTY_SANCTUM,
  newSanctumId,
  type JournalEntry,
  type RitualLog,
  type SanctumState,
} from "@/lib/sanctum/types";
import {
  loadSanctum,
  saveSanctum,
  clearSanctum,
  parseSanctumImport,
} from "@/lib/sanctum/storage";

type SanctumActions = {
  /** Read from localStorage. Idempotent. */
  hydrate: () => void;

  /** Add a journal entry. Returns the freshly created entry. */
  addEntry: (
    input: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
  ) => JournalEntry;

  /** Update an existing entry by id; merges fields. */
  updateEntry: (
    id: string,
    patch: Partial<Omit<JournalEntry, "id" | "createdAt">>
  ) => void;

  /** Remove an entry by id. */
  removeEntry: (id: string) => void;

  /** Add a ritual log row. */
  addRitual: (
    input: Omit<RitualLog, "id" | "createdAt">
  ) => RitualLog;

  /** Remove a ritual log row. */
  removeRitual: (id: string) => void;

  /** Replace state from an imported JSON string. Returns true on success. */
  importFromJson: (json: string) => boolean;

  /** Wipe everything (with no confirmation — caller must guard). */
  resetAll: () => void;
};

type SanctumStore = SanctumState & {
  hydrated: boolean;
} & SanctumActions;

export const useSanctumStore = create<SanctumStore>((set, get) => ({
  ...EMPTY_SANCTUM,
  hydrated: false,

  hydrate: () => {
    const loaded = loadSanctum();
    set({ ...loaded, hydrated: true });
  },

  addEntry: (input) => {
    const now = Date.now();
    const entry: JournalEntry = {
      ...input,
      id: newSanctumId("j"),
      createdAt: now,
      updatedAt: now,
    };
    const next: SanctumState = {
      version: get().version,
      entries: [entry, ...get().entries],
      rituals: get().rituals,
    };
    saveSanctum(next);
    set(next);
    return entry;
  },

  updateEntry: (id, patch) => {
    const now = Date.now();
    const entries = get().entries.map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: now } : e
    );
    const next: SanctumState = {
      version: get().version,
      entries,
      rituals: get().rituals,
    };
    saveSanctum(next);
    set(next);
  },

  removeEntry: (id) => {
    const entries = get().entries.filter((e) => e.id !== id);
    const next: SanctumState = {
      version: get().version,
      entries,
      rituals: get().rituals,
    };
    saveSanctum(next);
    set(next);
  },

  addRitual: (input) => {
    const log: RitualLog = {
      ...input,
      id: newSanctumId("r"),
      createdAt: Date.now(),
    };
    const next: SanctumState = {
      version: get().version,
      entries: get().entries,
      rituals: [log, ...get().rituals],
    };
    saveSanctum(next);
    set(next);
    return log;
  },

  removeRitual: (id) => {
    const rituals = get().rituals.filter((r) => r.id !== id);
    const next: SanctumState = {
      version: get().version,
      entries: get().entries,
      rituals,
    };
    saveSanctum(next);
    set(next);
  },

  importFromJson: (json) => {
    const parsed = parseSanctumImport(json);
    if (!parsed) return false;
    saveSanctum(parsed);
    set({ ...parsed });
    return true;
  },

  resetAll: () => {
    clearSanctum();
    set({ ...EMPTY_SANCTUM });
  },
}));

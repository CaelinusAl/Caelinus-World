import { create } from "zustand";

export type Lang = "tr" | "en";

const STORAGE_KEY = "caelinus_lang_v1";

function loadFromStorage(): Lang {
  if (typeof window === "undefined") return "tr";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "tr" || raw === "en") return raw;
  } catch {
    // ignore
  }
  return "tr";
}

function saveToStorage(lang: Lang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore quota / privacy errors
  }
}

type LangState = {
  lang: Lang;
  hydrated: boolean;
  /** Read lang preference from localStorage. Safe to call multiple times. */
  hydrate: () => void;
  /** Set and persist the active language. */
  setLang: (lang: Lang) => void;
  /** Toggle between tr/en. */
  toggle: () => void;
};

export const useLangStore = create<LangState>((set, get) => ({
  lang: "tr",
  hydrated: false,

  hydrate: () => {
    set({ lang: loadFromStorage(), hydrated: true });
  },

  setLang: (lang) => {
    saveToStorage(lang);
    set({ lang, hydrated: true });
  },

  toggle: () => {
    const next: Lang = get().lang === "tr" ? "en" : "tr";
    saveToStorage(next);
    set({ lang: next, hydrated: true });
  },
}));

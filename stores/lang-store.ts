"use client";

/**
 * Caelinus lang store — client-side mirror of the resolved locale.
 *
 * F7 — locale is now derived from the subdomain (`www.caelinus.com` →
 * tr, `en.caelinus.com` → en). The store no longer "owns" the
 * preference; it just mirrors the host so React components can
 * subscribe without each one parsing `window.location.hostname`.
 *
 * Toggling the language navigates to the alternate subdomain and
 * drops a `caelinus-locale` cookie so the GeoIP middleware respects
 * the user's choice on subsequent visits.
 *
 * The `hydrate()` API stays for backward compatibility — many
 * components still call `useLangStore.hydrate()` on mount. It now
 * reads the host instead of localStorage.
 */

import { create } from "zustand";

import {
  alternateUrl,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
  localeFromHost,
} from "@/lib/i18n/locale";

export type Lang = Locale;

function detectLangFromWindow(): Lang {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return localeFromHost(window.location.hostname);
}

function setLangCookie(lang: Lang) {
  if (typeof document === "undefined") return;
  // Drop the cookie on the apex so both subdomains share it. We can't
  // know the apex statically (varies per env), so we derive it from
  // the current hostname by trimming the leading subdomain label
  // when it's `www`, `en`, or matches no leading label otherwise.
  const host = window.location.hostname;
  let cookieDomain = "";
  if (host.endsWith(".localhost") || host === "localhost") {
    // `domain=localhost` works for both bare and `*.localhost` in
    // every modern browser. Leave it unspecified for the safest path.
    cookieDomain = "";
  } else {
    // `caelinus.com` shared between `www.` and `en.`
    const parts = host.split(".");
    if (parts.length >= 2) {
      cookieDomain = `; domain=.${parts.slice(-2).join(".")}`;
    }
  }
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie =
    `${LOCALE_COOKIE}=${lang}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}` +
    `; samesite=lax${secure}${cookieDomain}`;
}

type LangState = {
  lang: Lang;
  hydrated: boolean;
  /** Read lang from the current hostname. Safe to call multiple times. */
  hydrate: () => void;
  /** Set the active language — drops the override cookie and navigates
   *  to the alternate subdomain so the rest of the page (server
   *  components, metadata, OG) re-renders in the new language. */
  setLang: (lang: Lang) => void;
  /** Toggle between tr/en. */
  toggle: () => void;
};

export const useLangStore = create<LangState>((set, get) => ({
  lang: DEFAULT_LOCALE,
  hydrated: false,

  hydrate: () => {
    set({ lang: detectLangFromWindow(), hydrated: true });
  },

  setLang: (lang) => {
    if (typeof window === "undefined") {
      set({ lang, hydrated: true });
      return;
    }
    if (get().lang === lang) {
      // No-op: already on the right host. Still drop the cookie so
      // a future GeoIP visit doesn't bounce them away.
      setLangCookie(lang);
      return;
    }
    setLangCookie(lang);
    // Navigate to the alternate subdomain, preserving path + query so
    // the user lands on the same page in the new language.
    const path = window.location.pathname + window.location.search;
    window.location.assign(alternateUrl(get().lang, path));
  },

  toggle: () => {
    const next: Lang = get().lang === "tr" ? "en" : "tr";
    get().setLang(next);
  },
}));

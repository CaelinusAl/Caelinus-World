/**
 * Caelinus i18n — server-side locale detection.
 *
 * Server components / route handlers / generateMetadata calls all live
 * on the request boundary. They can't call `window.location.hostname`
 * but they CAN read the request headers via `next/headers`. This
 * module is the single helper for both worlds:
 *
 *   const locale = await getLocale();    // → "tr" | "en"
 *   const host   = await getHost();      // → "caelinus.world" | …
 *
 * The `x-caelinus-locale` header is set by `middleware.ts` so we can
 * cheaply read the locale once it's been resolved (and any GeoIP
 * redirects have already happened). When the header is missing
 * (preview deploy, edge cases) we fall back to host parsing.
 *
 * Both helpers are async because Next 15+ made `headers()` async; the
 * compiler enforces it, and any caller of these helpers must `await`.
 */

import "server-only";

import { headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  type Locale,
  localeFromHost,
  LOCALES,
} from "./locale";

const LOCALE_HEADER = "x-caelinus-locale";

/** Resolve the active locale for the current request. Reads the
 *  middleware-injected `x-caelinus-locale` first, then falls back to
 *  parsing the `host` header. */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const fromHeader = h.get(LOCALE_HEADER);
  if (fromHeader === "tr" || fromHeader === "en") {
    return fromHeader;
  }
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return localeFromHost(host);
}

/** Resolve the active host (with port) for the current request. Used
 *  for canonical URL building when env hosts aren't configured (e.g.
 *  Vercel preview deploys). */
export async function getHost(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
}

/** True if `loc` is one of our supported locales. Useful when you've
 *  parsed an arbitrary string and want a type-narrowing guard. */
export function isLocale(loc: string | null | undefined): loc is Locale {
  return loc === "tr" || loc === "en";
}

export { DEFAULT_LOCALE, LOCALES };
export type { Locale };

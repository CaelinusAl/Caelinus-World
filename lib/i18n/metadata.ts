/**
 * Caelinus i18n — metadata helpers for `generateMetadata`.
 *
 * Centralises the SEO bits that change per locale + path:
 *   • `alternates.canonical`    — current locale absolute URL
 *   • `alternates.languages`    — `tr-TR` / `en-US` cross-references
 *   • `openGraph.locale`        — `tr_TR` / `en_US`
 *   • `openGraph.alternateLocale` — the other one
 *
 * Page authors only need:
 *
 *   export async function generateMetadata(): Promise<Metadata> {
 *     const locale = await getLocale();
 *     return {
 *       title: locale === "tr" ? "..." : "...",
 *       description: ...,
 *       ...buildLocaleMetadata(locale, "/play"),
 *     };
 *   }
 *
 * The `path` argument is the locale-independent route — same for
 * both subdomains. The helper takes care of stitching the right
 * origin onto each language entry.
 */

import type { Metadata } from "next";

import {
  absoluteUrl,
  htmlLang,
  type Locale,
  ogLocale,
} from "./locale";

/** Hreflang languages map. Google docs recommend full IETF tags
 *  (`tr-TR`, `en-US`); Next normalises them as-is into `<link rel="alternate" hreflang>`. */
export function buildLanguageAlternates(path: string): {
  [key: string]: string;
} {
  return {
    [htmlLang("tr")]: absoluteUrl("tr", path),
    [htmlLang("en")]: absoluteUrl("en", path),
    // x-default tells search engines which to fall back to when no
    // language signal is available. We point it at TR (the default
    // locale) — this is the URL bare links share.
    "x-default": absoluteUrl("tr", path),
  };
}

/**
 * Build the locale-aware bundle to spread into a page's metadata.
 *
 *   alternates.canonical   absolute URL on the current locale's host
 *   alternates.languages   hreflang map (tr / en / x-default)
 *   openGraph.url          canonical URL (Facebook expects absolute)
 *   openGraph.locale       active locale tag
 *   openGraph.alternateLocale  the other locale tag (FB convention)
 */
export function buildLocaleMetadata(
  locale: Locale,
  path: string = "/",
): Metadata {
  const canonical = absoluteUrl(locale, path);
  return {
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      url: canonical,
      locale: ogLocale(locale),
      alternateLocale: [ogLocale(locale === "tr" ? "en" : "tr")],
    },
  };
}

/**
 * Caelinus i18n — locale primitives.
 *
 * Source of truth for which language is "current" is the **request
 * host** (subdomain strategy). Reading is deliberately one-way:
 *
 *   `www.caelinus.com`      → tr  (default)
 *   `en.caelinus.com`       → en
 *   `localhost:3000`        → tr  (dev mirror)
 *   `en.localhost:3000`     → en  (dev mirror)
 *
 * The apex `caelinus.com` 308-redirects to `www.caelinus.com` at the
 * Vercel layer so we never see it inside Next.
 *
 * Modern browsers resolve `*.localhost` to 127.0.0.1 without any
 * /etc/hosts entry, so the dev experience matches production exactly.
 *
 * Setting locale (toggle) means navigating to the alternate subdomain
 * and dropping a cookie so the GeoIP redirect in middleware doesn't
 * undo the user's choice. See `stores/lang-store.ts` and `proxy.ts`.
 *
 * The `NEXT_PUBLIC_SITE_HOST_TR` / `NEXT_PUBLIC_SITE_HOST_EN` env vars
 * are only consulted in production. In dev we always use localhost so
 * a developer can clone-and-go without configuring DNS.
 */

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Default fallback when host can't be parsed (e.g. preview domain). */
export const DEFAULT_LOCALE: Locale = "tr";

/** Cookie name remembering the user's manual locale override. When set
 *  the GeoIP middleware skips the redirect and respects the choice.
 *  Long-lived (1 year) — switching back is one click. */
export const LOCALE_COOKIE = "caelinus-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Derive locale from a Host header / window.location.hostname. Any
 *  host whose first label is `en` (e.g. `en.caelinus.world`,
 *  `en.localhost`) is EN; everything else is TR. We don't require an
 *  exact match against the env hosts so Vercel preview URLs and
 *  custom domains work without configuration. */
export function localeFromHost(host: string | null | undefined): Locale {
  if (!host) return DEFAULT_LOCALE;
  const cleanHost = host.split(":")[0].toLowerCase();
  return cleanHost.startsWith("en.") ? "en" : "tr";
}

/* ── Origin / URL builders ─────────────────────────────────── */

type HostPair = { tr: string; en: string };

function isDevEnv(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Production hosts come from env; dev mirrors them on localhost. The
 *  port is included in the dev pair so absolute URLs are clickable. */
function hosts(): HostPair {
  if (isDevEnv()) {
    const port = process.env.PORT ?? "3000";
    return { tr: `localhost:${port}`, en: `en.localhost:${port}` };
  }
  // Production fallback hizalandı: caelinus.ai apex (TR) ve en.caelinus.ai
  // (EN). Vercel env'de `NEXT_PUBLIC_SITE_HOST_TR=caelinus.ai` ayarlanmadığı
  // sürece bu default kullanılır — yatırımcı paylaşımları, OG image'ler ve
  // sitemap URL'leri caelinus.ai üzerinden gider.
  const tr = (process.env.NEXT_PUBLIC_SITE_HOST_TR ?? "caelinus.ai").toLowerCase();
  const trRoot = tr.startsWith("www.") ? tr.slice(4) : tr;
  const en = (process.env.NEXT_PUBLIC_SITE_HOST_EN ?? `en.${trRoot}`).toLowerCase();
  return { tr, en };
}

function protocolFor(host: string): "http" | "https" {
  // localhost is http; everything else https. This keeps dev simple
  // without certificates and matches Vercel's prod TLS termination.
  if (host.startsWith("localhost") || host.includes(".localhost")) return "http";
  return "https";
}

/** Absolute origin (`https://en.caelinus.world`) for a given locale. */
export function siteOrigin(locale: Locale): string {
  const host = hosts()[locale];
  return `${protocolFor(host)}://${host}`;
}

/** Build an absolute URL (origin + path) for a given locale. Path
 *  may be relative (`/play`) or absolute. Returns origin + normalised
 *  path with no trailing slash duplication. */
export function absoluteUrl(locale: Locale, path: string = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin(locale)}${p}`;
}

/** Return the alternate locale's URL for the current path. Used in
 *  language toggles and `hreflang` alternates. */
export function alternateUrl(currentLocale: Locale, path: string = "/"): string {
  const other: Locale = currentLocale === "tr" ? "en" : "tr";
  return absoluteUrl(other, path);
}

/**
 * Compute the host (with port) we should redirect the visitor to when
 * we want them on `target` locale. Used by middleware for GeoIP and
 * by the language toggle when we don't already have an absolute URL.
 *
 * Production path: env hosts are the source of truth. The TR host can
 * carry a `www.` prefix (the apex `caelinus.com` 308s to it on
 * Vercel) without breaking the EN derivation, because EN is read
 * straight from `NEXT_PUBLIC_SITE_HOST_EN`.
 *
 * Dev / preview path: string manipulation (`*.localhost`, prefix `en.`).
 *
 * Returns `null` when there's nothing meaningful to redirect to (e.g.
 * already on the target host, or the host doesn't fit any known
 * pattern — better to render the wrong locale than 5xx).
 */
export function alternateHost(
  currentHost: string,
  target: Locale,
): string | null {
  const cleanHost = currentHost.split(":")[0].toLowerCase();
  const portPart = currentHost.includes(":")
    ? `:${currentHost.split(":")[1]}`
    : "";

  if (cleanHost === "localhost") {
    return target === "en" ? `en.localhost${portPart}` : null;
  }
  if (cleanHost === "en.localhost") {
    return target === "tr" ? `localhost${portPart}` : null;
  }

  // Production: env hosts are authoritative. We compare without the
  // port because env hosts don't carry one in prod.
  const envTR = process.env.NEXT_PUBLIC_SITE_HOST_TR?.toLowerCase();
  const envEN = process.env.NEXT_PUBLIC_SITE_HOST_EN?.toLowerCase();
  if (envTR && envEN) {
    if (target === "tr") return cleanHost === envTR ? null : envTR;
    if (target === "en") return cleanHost === envEN ? null : envEN;
  }

  // Preview / unknown host fallback — pure string manipulation.
  if (cleanHost.startsWith("en.")) {
    return target === "tr" ? `${cleanHost.slice(3)}${portPart}` : null;
  }
  return target === "en" ? `en.${cleanHost}${portPart}` : null;
}

/** Helper for `<html lang>` and `og:locale` — full IETF/POSIX-style
 *  language tags, since most consumers expect the regional variant. */
export function htmlLang(locale: Locale): string {
  return locale === "tr" ? "tr-TR" : "en-US";
}

/** OG locale uses underscores (Facebook spec). */
export function ogLocale(locale: Locale): string {
  return locale === "tr" ? "tr_TR" : "en_US";
}

/* ── Detection helpers (used by middleware) ───────────────── */

/** Crude bot UA matcher. Bots get the canonical content for whichever
 *  subdomain they hit (no GeoIP redirect) so search engines index
 *  both languages independently. The list isn't exhaustive — it's a
 *  cheap heuristic; missed bots simply see the same redirect logic
 *  as a human, which still yields valid (just not perfectly localised)
 *  indexing. */
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|pinterest|telegram|skype|discord/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return BOT_UA.test(ua);
}

/** Map a country code (ISO 3166-1 alpha-2) to the locale we'd want
 *  to default-redirect them to. TR → tr; everything else → en. */
export function localeFromCountry(country: string | null | undefined): Locale {
  if (!country) return "en";
  return country.toUpperCase() === "TR" ? "tr" : "en";
}

/**
 * Caelinus middleware — locale resolution + GeoIP redirect.
 *
 * Three jobs, in order:
 *
 *   1. Resolve the active locale from the request host (subdomain
 *      strategy: `caelinus.world` → tr, `en.caelinus.world` → en).
 *
 *   2. Inject `x-caelinus-locale` into the request headers so server
 *      components / generateMetadata / route handlers can call
 *      `getLocale()` cheaply (`lib/i18n/server.ts`).
 *
 *   3. For first-time visitors with no manual override cookie, look at
 *      `x-vercel-ip-country` (Vercel edge geolocation) and redirect TR
 *      visitors to `caelinus.world` and everyone else to
 *      `en.caelinus.world`. Bots always see the canonical content for
 *      whichever subdomain they hit so search engines can index both
 *      independently.
 *
 * The cookie (`caelinus-locale`) overrides GeoIP: once the user
 * manually toggles language we never bounce them again, even if their
 * IP says otherwise. Cookie is set by the toggle action in
 * `stores/lang-store.ts`.
 *
 * NOTE: this file lives at the project root (next.js convention).
 * Edits here require a dev server restart.
 */

import { NextResponse, type NextRequest } from "next/server";

import {
  alternateHost,
  isBotUserAgent,
  LOCALE_COOKIE,
  type Locale,
  localeFromCountry,
  localeFromHost,
} from "@/lib/i18n/locale";

const LOCALE_HEADER = "x-caelinus-locale";

/** Pathnames the middleware should never touch. We let static assets
 *  and Next's own RSC machinery short-circuit straight through. */
function isStaticOrInternal(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  // Files with extensions in the public folder (images, fonts, etc.).
  // The matcher already filters most of these but keep a defensive
  // guard so e.g. /og/foo.png doesn't get redirect-bounced.
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Always resolve the locale up-front so we can inject the header
  // even on paths we end up short-circuiting.
  const currentLocale = localeFromHost(host);

  // Bypass logic + header injection for static / API paths.
  if (isStaticOrInternal(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, currentLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Bots see the canonical content for whichever subdomain they hit.
  // No GeoIP, no cookie reading — just inject the header and move on.
  if (isBotUserAgent(request.headers.get("user-agent"))) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, currentLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Manual override wins over GeoIP. If the user previously toggled,
  // we respect their choice forever (well, 1 year — see LOCALE_COOKIE).
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const userPreference: Locale | null =
    cookieLocale === "tr" || cookieLocale === "en" ? cookieLocale : null;

  // Where the user *should* be, based on their preference or GeoIP.
  const country = request.headers.get("x-vercel-ip-country");
  const intendedLocale: Locale =
    userPreference ?? localeFromCountry(country);

  // Already on the right subdomain? Inject header + continue.
  if (intendedLocale === currentLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, currentLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Need to redirect to the alternate subdomain. Compute the target
  // host; if we can't (preview URL etc.) just stay put and inject the
  // header — better to render the wrong language than to 5xx.
  const targetHost = alternateHost(host, intendedLocale);
  if (!targetHost) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, currentLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const protocol = host.startsWith("localhost") || host.includes(".localhost")
    ? "http"
    : "https";
  const targetUrl = new URL(`${protocol}://${targetHost}${pathname}${search}`);
  // 307 keeps method + body for forms; the GeoIP redirect should be
  // user-action-preserving in case someone deep-links a POST.
  return NextResponse.redirect(targetUrl, 307);
}

export const config = {
  // Run on every route except static assets and Next internals. The
  // negative lookahead is the canonical Next pattern. See:
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};

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
 *      visitors to `www.caelinus.com` and everyone else to
 *      `en.caelinus.com`. The redirect only fires when both signals
 *      are real:
 *        • `x-vercel-ip-country` is present (we're at Vercel edge)
 *        • current host matches an env-configured locale host (custom
 *          domain is actually live)
 *      Otherwise we leave the visitor on whatever host they chose —
 *      keeps localhost dev and Vercel preview URLs bounce-free, and
 *      avoids redirecting to a domain that doesn't resolve yet during
 *      the DNS cutover. Bots always see the canonical content for
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
  // Bots and static traffic always see the host-derived locale —
  // cookies are a human-only signal.
  if (isStaticOrInternal(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, currentLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

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

  // Effective locale = cookie override ?? host-derived. This is what
  // the server should *render*. In multi-host mode the cookie usually
  // matches the host (because we redirect mismatches below), so this
  // collapses to currentLocale. In single-host mode (Vercel preview
  // URL, dev localhost without an en.* mirror) the cookie is the only
  // way to switch language, so it must drive SSR.
  const effectiveLocale: Locale = userPreference ?? currentLocale;

  // Two preconditions before we'll consider auto-redirecting:
  //
  //   1. We're actually behind Vercel edge (i.e. `x-vercel-ip-country`
  //      is present). Without it we have no real GeoIP signal and
  //      we'd be guessing — better to leave the visitor on the host
  //      they explicitly chose. This also means localhost dev is
  //      bounce-free: developers see whatever subdomain they typed.
  //
  //   2. The current host matches one of the env-configured locale
  //      hosts (i.e. the custom domain is actually live). On a
  //      Vercel preview URL or before DNS cuts over, we don't want
  //      to bounce people to a domain that doesn't resolve yet.
  //
  // If either gate is closed we fall through to a no-op (header
  // injection only). The manual cookie override is honoured even
  // without GeoIP because that signal *is* explicit.
  const country = request.headers.get("x-vercel-ip-country");
  const envTR = process.env.NEXT_PUBLIC_SITE_HOST_TR?.toLowerCase();
  const envEN = process.env.NEXT_PUBLIC_SITE_HOST_EN?.toLowerCase();
  const cleanHost = host.split(":")[0].toLowerCase();
  const onConfiguredHost =
    !!envTR && !!envEN && (cleanHost === envTR || cleanHost === envEN);

  let intendedLocale: Locale | null = userPreference;
  if (!intendedLocale && country && onConfiguredHost) {
    intendedLocale = localeFromCountry(country);
  }

  if (!intendedLocale || intendedLocale === currentLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, effectiveLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Need to redirect to the alternate subdomain. Compute the target
  // host; if we can't (preview URL, unknown host) just stay put and
  // inject the header — better to render the wrong language than 5xx.
  const targetHost = alternateHost(host, intendedLocale);
  if (!targetHost) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, effectiveLocale);
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

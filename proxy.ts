/**
 * CAELINUS — Edge proxy (Next 16+).
 *
 * Replaces the legacy `middleware.ts` convention. Three responsibilities,
 * executed in order:
 *
 *   1) Locale resolution (i18n)
 *      Parse the locale from the request host (subdomain strategy:
 *      `www.caelinus.ai` → tr, `en.caelinus.ai` → en) and inject
 *      `x-caelinus-locale` so server components / generateMetadata /
 *      route handlers can call `getLocale()` cheaply.
 *
 *   2) GeoIP-based locale redirect
 *      First-time visitors with no manual override cookie are bounced
 *      to the appropriate subdomain based on `x-vercel-ip-country`.
 *      The redirect only fires when both signals are real:
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
 *   3) Supabase session refresh + auth gate
 *      Re-reads the Supabase auth cookies on every non-bot, non-static
 *      request and refreshes the JWT if it's about to expire. Anything
 *      under `/atelier/dashboard` or `/atelier/admin` requires an
 *      authenticated user; unauthenticated visitors are redirected to
 *      `/atelier/giris?next=<pathname>`. Without this, server
 *      components would see a stale session right after a browser-side
 *      login.
 *
 * The cookie (`caelinus-locale`) overrides GeoIP: once the user
 * manually toggles language we never bounce them again, even if their
 * IP says otherwise. Cookie is set by the toggle action in
 * `stores/lang-store.ts`.
 *
 * If Supabase env vars aren't configured (local dev without
 * `.env.local`), the auth pass is short-circuited so the rest of the
 * app remains usable.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv, supabaseConfigured } from "@/lib/env";
import {
  alternateHost,
  isBotUserAgent,
  LOCALE_COOKIE,
  type Locale,
  localeFromCountry,
  localeFromHost,
} from "@/lib/i18n/locale";

const LOCALE_HEADER = "x-caelinus-locale";
const PROTECTED_PREFIXES = ["/atelier/dashboard", "/atelier/admin"];
const AUTH_REDIRECT_PATH = "/atelier/giris";

/** Pathnames the proxy should never touch. We let static assets and
 *  Next's own RSC machinery short-circuit straight through after
 *  injecting the locale header. */
function isStaticOrInternal(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/_vercel/")) return true;
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

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Always resolve the locale up-front so we can inject the header
  // even on paths we end up short-circuiting.
  const currentLocale = localeFromHost(host);

  // === 1. Static / internal short-circuit (locale header only) ===
  // Bypass auth + GeoIP for static and API paths.
  if (isStaticOrInternal(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, currentLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // === 2. Bots see host-derived locale, no GeoIP, no auth refresh ===
  // Cookies are a human-only signal; bots always get the canonical
  // version of whichever subdomain they crawled.
  if (isBotUserAgent(request.headers.get("user-agent"))) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, currentLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // === 3. GeoIP / cookie-driven locale redirect ===
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
  // If either gate is closed we fall through to the auth pass without
  // redirecting. The manual cookie override is honoured even without
  // GeoIP because that signal *is* explicit.
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

  if (intendedLocale && intendedLocale !== currentLocale) {
    const targetHost = alternateHost(host, intendedLocale);
    if (targetHost) {
      const protocol =
        host.startsWith("localhost") || host.includes(".localhost")
          ? "http"
          : "https";
      const targetUrl = new URL(
        `${protocol}://${targetHost}${pathname}${search}`,
      );
      // 307 keeps method + body for forms; the GeoIP redirect should be
      // user-action-preserving in case someone deep-links a POST.
      return NextResponse.redirect(targetUrl, 307);
    }
    // No alternate host (preview URL etc) → fall through to auth pass.
  }

  // === 4. Supabase session refresh + protected-route gate ===
  // Build the request headers once with the resolved locale so every
  // subsequent NextResponse.next() carries it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, effectiveLocale);

  // No Supabase keys yet → make every request a no-op (still inject
  // the locale header) so dev keeps working before .env.local has
  // been filled.
  if (!supabaseConfigured()) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options as CookieOptions);
          }
        },
      },
    },
  );

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Network blip / placeholder URL / token rotated — fall through
    // and treat as unauthenticated. The page-level guards re-check.
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_REDIRECT_PATH;
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on every route except static assets and Next/Vercel internals.
  // The negative lookahead is the canonical Next pattern. See:
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|mp3|mp4|woff2?|ttf)$).*)",
  ],
};

/**
 * CAELINUS — Edge proxy (Next 16+).
 *
 * Replaces the legacy `middleware.ts` convention. Two responsibilities:
 *
 *   1) Session refresh
 *      Re-reads the Supabase auth cookies on every request that
 *      matches our matcher and refreshes the JWT if it's about to
 *      expire. Without this, server components would see a stale
 *      session right after a browser-side login.
 *
 *   2) Route protection
 *      Anything under `/atelier/dashboard` or `/atelier/admin` requires
 *      an authenticated user. Unauthenticated visitors are redirected
 *      to `/atelier/giris?next=<pathname>`.
 *
 * Public routes (the rest of the app) pass through untouched aside
 * from the cookie refresh. If Supabase env vars aren't configured
 * (local dev without `.env.local`), the proxy short-circuits to a
 * pass-through so the rest of the app remains usable.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv, supabaseConfigured } from "@/lib/env";

const PROTECTED_PREFIXES = ["/atelier/dashboard", "/atelier/admin"];
const AUTH_REDIRECT_PATH = "/atelier/giris";

export async function proxy(request: NextRequest) {
  // No Supabase keys yet → make every request a no-op so dev keeps
  // working before .env.local has been filled.
  if (!supabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options as CookieOptions);
          }
        },
      },
    }
  );

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Network blip / placeholder URL / token rotated — fall through
    // and treat as unauthenticated. The page-level guards re-check.
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_REDIRECT_PATH;
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|mp3|mp4|woff2?|ttf)$).*)",
  ],
};

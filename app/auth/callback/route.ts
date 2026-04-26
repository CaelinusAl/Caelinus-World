/**
 * OAuth / magic-link callback.
 *
 * Supabase redirects the user here with either:
 *   • `?code=…`            (PKCE — magic link, OAuth, signup confirm)
 *   • `?error=…&error_description=…` (failure path)
 *
 * We exchange the code for a session, write the auth cookies, and then
 * redirect the user to the path they originally wanted (`?next=…`),
 * defaulting to the atelier dashboard.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_NEXT = "/atelier/dashboard";

function safeNext(value: string | null): string {
  if (!value) return DEFAULT_NEXT;
  // Only allow same-origin paths beginning with a single slash to
  // prevent open-redirect attacks.
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_NEXT;
  return value;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description");
  const next = safeNext(url.searchParams.get("next"));

  if (errorDescription) {
    const dest = url.clone();
    dest.pathname = "/atelier/giris";
    dest.search = `?error=${encodeURIComponent(errorDescription)}`;
    return NextResponse.redirect(dest);
  }

  if (!code) {
    const dest = url.clone();
    dest.pathname = "/atelier/giris";
    dest.search = "?error=missing_code";
    return NextResponse.redirect(dest);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const dest = url.clone();
    dest.pathname = "/atelier/giris";
    dest.search = `?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(dest);
  }

  const dest = url.clone();
  dest.pathname = next;
  dest.search = "";
  return NextResponse.redirect(dest);
}

/**
 * Server-side sign-out.
 *
 * POST /auth/signout
 *
 * Forms post here (instead of calling supabase.auth.signOut() in the
 * browser) so the auth cookies are cleared atomically and the next
 * navigation is already unauthenticated. Returns a redirect to /atelier.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const dest = request.nextUrl.clone();
  dest.pathname = "/atelier";
  dest.search = "";
  return NextResponse.redirect(dest, { status: 303 });
}

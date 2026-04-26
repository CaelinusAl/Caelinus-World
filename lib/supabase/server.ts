/**
 * Server-side Supabase client (anon key, RLS-bound).
 *
 * Reads/writes the auth cookies via `next/headers` so server components,
 * route handlers, and server actions all observe the same session as
 * the browser. RLS policies in `supabase/migrations/` enforce that a
 * user can only see/modify their own rows.
 *
 * Usage:
 *
 *   // in a server component / route handler
 *   import { createSupabaseServerClient } from "@/lib/supabase/server";
 *   const supabase = await createSupabaseServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */

import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { clientEnv } from "@/lib/env";
import type { Database } from "./types";

export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options as CookieOptions);
            }
          } catch {
            // `cookieStore.set()` throws when called from a Server
            // Component (read-only). The middleware refreshes the
            // session in those flows, so swallowing here is correct.
          }
        },
      },
    }
  );
}

/**
 * Convenience: returns the current authenticated user (or null) from a
 * server context. Avoids the boilerplate of always destructuring.
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

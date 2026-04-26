/**
 * Service-role Supabase client (BYPASSES Row-Level Security).
 *
 * **Server-only.** This module imports `server-only`, so any accidental
 * client-side import will fail the Next.js build immediately.
 *
 * Use it for:
 *   • Admin actions (atelier approval, role grants)
 *   • Cron / scheduled jobs (invitations, digest emails)
 *   • Trusted server actions that intentionally need to read across users
 *
 * Do NOT use it for normal request handling — the regular server client
 * (`createSupabaseServerClient`) is RLS-bound and far safer. Reach for
 * the admin client only when you've explicitly verified the caller is
 * a Caelinus admin via `isAdminEmail(user.email)`.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { clientEnv, serverEnv } from "@/lib/env";
import type { Database } from "./types";

let _admin: SupabaseClient<Database> | null = null;

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  if (_admin) return _admin;
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[CAELINUS] SUPABASE_SERVICE_ROLE_KEY is missing. " +
        "The admin client cannot be created without it. " +
        "Set it in .env.local (server-only) and restart the dev server."
    );
  }
  _admin = createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  return _admin;
}

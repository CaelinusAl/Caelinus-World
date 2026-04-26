/**
 * CAELINUS — Atelier moderation: shared admin gate.
 *
 * Single helper used by both the moderation page and its server actions
 * so the rules live in one place:
 *
 *   1. The visitor must be authenticated.
 *   2. Their email must be on the `CAELINUS_ADMIN_EMAILS` allow-list
 *      (or — equivalently — on the `caelinus_admins` table; both paths
 *      are honoured by `is_caelinus_admin()` in Postgres, but the env
 *      list is the only one we can check synchronously here).
 *
 * Returns the admin user on success; throws `AdminGateError` on
 * everything else so the caller can decide between `redirect()` (page)
 * and a structured error envelope (server action).
 */
import "server-only";

import type { User } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminGateFailure =
  | "unauthenticated"
  | "not-admin";

export class AdminGateError extends Error {
  constructor(public readonly reason: AdminGateFailure) {
    super(reason);
    this.name = "AdminGateError";
  }
}

/**
 * Returns the current Caelinus admin, or throws `AdminGateError`. Never
 * reads from `caelinus_admins`; that table is consulted by RLS itself
 * once we hand the call off to Postgres.
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AdminGateError("unauthenticated");
  if (!isAdminEmail(user.email)) throw new AdminGateError("not-admin");
  return user;
}

/** Soft check: handy for UI gating (hide moderation links from non-admins). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

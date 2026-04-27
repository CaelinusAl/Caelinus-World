"use server";

/**
 * Account-level server actions — `/hesap`.
 *
 * Today the only one is `deleteAccount()`. We intentionally do NOT
 * expose a public REST route for it: the form posts directly to this
 * action so the call site is type-checked and the user has to be
 * signed in (we re-verify here rather than trusting cookies).
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierOrderRow, AtelierRow } from "@/lib/supabase/types";

export type DeleteAccountResult = {
  ok: false;
  reason: "not_signed_in" | "email_mismatch" | "has_orders" | "internal";
};

/**
 * Hard-delete the signed-in user from `auth.users`. Cascades to
 * `profiles → ateliers → atelier_collections / atelier_items` and
 * sets `atelier_orders.buyer_user_id` to null (buyer-side history
 * stays for the maker).
 *
 * Guard rails:
 *   1. Caller must be signed in.
 *   2. Caller must type their own email exactly (typo-safety).
 *   3. If the caller owns ateliers with any orders attached, we
 *      refuse — `atelier_orders.atelier_id` has `on delete restrict`,
 *      so the cascade would explode mid-way and we'd be left with a
 *      half-deleted user. Surface a friendly error instead.
 *
 * On success this function does NOT return — `redirect()` throws a
 * Next.js redirect signal that the form action handles. On failure
 * we return `{ ok: false, reason }` so the caller (`useActionState`)
 * can show a localized message.
 */
export async function deleteAccount(
  _prev: DeleteAccountResult | null,
  formData: FormData,
): Promise<DeleteAccountResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not_signed_in" };

  const typedEmailRaw = (formData.get("confirmEmail") ?? "").toString().trim().toLowerCase();
  const accountEmail = (user.email ?? "").trim().toLowerCase();
  if (!typedEmailRaw || typedEmailRaw !== accountEmail) {
    return { ok: false, reason: "email_mismatch" };
  }

  // Are they an atelier owner with order history?
  const { data: ateliersData } = await supabase
    .from("ateliers")
    .select("id")
    .eq("owner_user_id", user.id);
  const ateliers = (ateliersData ?? []) as Pick<AtelierRow, "id">[];

  if (ateliers.length > 0) {
    const atelierIds = ateliers.map((a) => a.id);
    const { data: ordersData, error: ordersErr } = await supabase
      .from("atelier_orders")
      .select("id")
      .in("atelier_id", atelierIds)
      .limit(1);
    if (ordersErr) {
      console.warn("[hesap.delete] order-check failed:", ordersErr.message);
      return { ok: false, reason: "internal" };
    }
    const orders = (ordersData ?? []) as Pick<AtelierOrderRow, "id">[];
    if (orders.length > 0) {
      return { ok: false, reason: "has_orders" };
    }
  }

  // Hard delete via service-role admin client. This runs the
  // cascade chain that leads back to `profiles` and the (empty)
  // ateliers. No more confirmation prompts after this point.
  const admin = createSupabaseAdminClient();
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.warn("[hesap.delete] auth.admin.deleteUser failed:", delErr.message);
    return { ok: false, reason: "internal" };
  }

  // Drop the local session cookie and bail out to the home page.
  await supabase.auth.signOut();
  redirect("/");
}

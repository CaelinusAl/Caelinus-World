"use server";

/**
 * Maker-side order lifecycle actions.
 *
 * The atelier owner walks each order through:
 *
 *   paid → shipped → delivered
 *   paid → cancelled  (manual override, no Stripe refund yet)
 *
 * RLS policies (`orders_update_atelier_owner` from migration 0006) make
 * sure only the actual owner can flip status, so we don't re-check
 * authorship in the action — Postgres rejects a stranger's update.
 *
 * Side effects:
 *   • markShipped also fires a "your order is on its way" email and
 *     stamps `buyer_notified_shipped_at` so we don't double-notify if
 *     the maker tweaks the row a second time.
 */

import { revalidatePath } from "next/cache";

import { getSiteUrl, sendEmail } from "@/lib/email/sender";
import { orderShippedEmail } from "@/lib/email/templates/order-shipped";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AtelierOrderRow,
  AtelierRow,
  ProfileRow,
} from "@/lib/supabase/types";

export type OrderActionResult =
  | { ok: true; order_id: string }
  | { ok: false; error: string };

function trim(value: FormDataEntryValue | null, max = 200): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

/* ─── Mark shipped ──────────────────────────────────────────────── */

export async function markOrderShipped(
  formData: FormData,
): Promise<OrderActionResult> {
  const orderId = trim(formData.get("orderId"));
  if (!orderId) return { ok: false, error: "Geçersiz sipariş kimliği." };

  const trackingCarrier = trim(formData.get("trackingCarrier"));
  const trackingNumber = trim(formData.get("trackingNumber"));
  const trackingUrl = trim(formData.get("trackingUrl"), 1000);
  const makerNote = trim(formData.get("makerNote"), 600);

  const supabase = await createSupabaseServerClient();

  // Update via the user's RLS context — only the atelier owner can
  // change the row, anyone else gets a row-level rejection.
  const updates: Partial<AtelierOrderRow> = {
    status: "shipped",
    shipped_at: new Date().toISOString(),
    tracking_carrier: trackingCarrier,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    maker_note: makerNote,
  };

  const { data: updatedRows, error } = await supabase
    .from("atelier_orders")
    .update(updates as never)
    .eq("id", orderId)
    .in("status", ["paid", "shipped"])
    .select("id, atelier_id, buyer_user_id, buyer_email, buyer_name");

  if (error) {
    console.error("[orders.markShipped]", error);
    return { ok: false, error: "Sipariş güncellenemedi." };
  }
  if (!updatedRows || updatedRows.length === 0) {
    return {
      ok: false,
      error: "Bu sipariş kargolanmaya uygun değil (önce 'paid' olmalı).",
    };
  }

  const updated = updatedRows[0] as Pick<
    AtelierOrderRow,
    "id" | "atelier_id" | "buyer_user_id" | "buyer_email" | "buyer_name"
  >;

  // Best-effort buyer notification. We use the admin client for the
  // notification flag write because the buyer column is not part of
  // the maker's RLS update policy, and we never want a mail failure
  // to roll back a shipment.
  try {
    await dispatchShippedEmail({
      orderId: updated.id,
      atelierId: updated.atelier_id,
      buyerUserId: updated.buyer_user_id,
      buyerEmail: updated.buyer_email,
      buyerName: updated.buyer_name,
      trackingCarrier,
      trackingNumber,
      trackingUrl,
      makerNote,
    });
  } catch (err) {
    console.warn("[orders.markShipped] notify buyer failed (non-fatal)", err);
  }

  revalidatePath("/atelier/dashboard/siparisler");
  return { ok: true, order_id: orderId };
}

/* ─── Mark delivered ────────────────────────────────────────────── */

export async function markOrderDelivered(
  formData: FormData,
): Promise<OrderActionResult> {
  const orderId = trim(formData.get("orderId"));
  if (!orderId) return { ok: false, error: "Geçersiz sipariş kimliği." };

  const supabase = await createSupabaseServerClient();
  const { error, data } = await supabase
    .from("atelier_orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    } as never)
    .eq("id", orderId)
    .in("status", ["shipped", "delivered"])
    .select("id");

  if (error) {
    console.error("[orders.markDelivered]", error);
    return { ok: false, error: "Sipariş güncellenemedi." };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "Bu sipariş teslim edildi olarak işaretlenemiyor.",
    };
  }

  revalidatePath("/atelier/dashboard/siparisler");
  return { ok: true, order_id: orderId };
}

/* ─── Cancel ────────────────────────────────────────────────────── */

export async function cancelOrder(
  formData: FormData,
): Promise<OrderActionResult> {
  const orderId = trim(formData.get("orderId"));
  if (!orderId) return { ok: false, error: "Geçersiz sipariş kimliği." };

  const reason = trim(formData.get("reason"), 600);

  const supabase = await createSupabaseServerClient();
  const { error, data } = await supabase
    .from("atelier_orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      maker_note: reason,
    } as never)
    .eq("id", orderId)
    // Don't allow cancelling a delivered order from here — that path
    // belongs to a refund flow, not this lightweight cancel.
    .in("status", ["pending", "paid", "shipped"])
    .select("id");

  if (error) {
    console.error("[orders.cancel]", error);
    return { ok: false, error: "Sipariş iptal edilemedi." };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "Bu sipariş iptal edilmeye uygun değil.",
    };
  }

  revalidatePath("/atelier/dashboard/siparisler");
  return { ok: true, order_id: orderId };
}

/* ─── Buyer notification helper ─────────────────────────────────── */

type ShippedEmailContext = {
  orderId: string;
  atelierId: string;
  buyerUserId: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  makerNote: string | null;
};

async function dispatchShippedEmail(ctx: ShippedEmailContext): Promise<void> {
  const admin = createSupabaseAdminClient();

  // Atelier name + slug for the mail body.
  const { data: atelierData } = await admin
    .from("ateliers")
    .select("name, slug")
    .eq("id", ctx.atelierId)
    .maybeSingle();
  const atelier = atelierData as Pick<AtelierRow, "name" | "slug"> | null;
  if (!atelier) return;

  // Resolve recipient email + locale. Prefer the registered profile
  // (locale + display_name); fall back to the Stripe-collected email.
  let toEmail = ctx.buyerEmail;
  let buyerName = ctx.buyerName ?? "";
  let locale: "tr" | "en" = "tr";

  if (ctx.buyerUserId) {
    const { data: profileData } = await admin
      .from("profiles")
      .select("display_name, locale")
      .eq("id", ctx.buyerUserId)
      .maybeSingle();
    const profile = profileData as Pick<
      ProfileRow,
      "display_name" | "locale"
    > | null;

    if (profile?.display_name) buyerName = profile.display_name;
    if (profile?.locale === "en" || profile?.locale === "tr") {
      locale = profile.locale;
    }

    // Authoritative email lives on auth.users.
    if (!toEmail) {
      const { data: userResp } = await admin.auth.admin.getUserById(
        ctx.buyerUserId,
      );
      toEmail = userResp?.user?.email ?? null;
    }
  }

  if (!toEmail) {
    console.info(
      "[orders.shippedEmail] skipped (no buyer email)",
      ctx.orderId,
    );
    return;
  }

  if (!buyerName) buyerName = toEmail.split("@")[0];

  const tpl = orderShippedEmail({
    buyerName,
    atelierName: atelier.name,
    atelierSlug: atelier.slug,
    orderId: ctx.orderId,
    trackingCarrier: ctx.trackingCarrier,
    trackingNumber: ctx.trackingNumber,
    trackingUrl: ctx.trackingUrl,
    makerNote: ctx.makerNote,
    locale,
    siteUrl: getSiteUrl(),
  });

  await sendEmail({
    to: toEmail,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });

  // Stamp the notification timestamp so we know we already pinged
  // the buyer; the maker UI shows this so the maker doesn't wonder
  // if the email actually went out.
  await admin
    .from("atelier_orders")
    .update({ buyer_notified_shipped_at: new Date().toISOString() } as never)
    .eq("id", ctx.orderId);
}

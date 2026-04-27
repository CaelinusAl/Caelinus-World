/**
 * Stripe webhook — `/api/stripe/webhook`.
 *
 * Stripe POSTs here for every event. We only act on a small subset:
 *
 *   • `checkout.session.completed`   → create or upsert the order row,
 *                                      mark it `paid` if the session
 *                                      already shows `payment_status`
 *                                      "paid", otherwise leave pending.
 *   • `payment_intent.succeeded`     → flip the linked order to `paid`.
 *
 * All writes use the service-role client so RLS stays strict for the
 * rest of the app. Signature verification is non-negotiable: the
 * webhook secret guards against forged payment events.
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendEmail } from "@/lib/email/sender";
import { serverEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AtelierItemRow,
  AtelierOrderRow,
  AtelierRow,
  ProfileRow,
  ShippingAddress,
} from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const secret = serverEnv.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return jsonError(503, "STRIPE_WEBHOOK_SECRET not configured");
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return jsonError(400, "Missing stripe-signature header");

  // Raw body is required for signature verification — must NOT be
  // parsed as JSON before this call.
  const raw = await req.text();

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return jsonError(
      400,
      `Webhook signature failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await onPaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        // We acknowledge unhandled events so Stripe doesn't keep
        // retrying. Add cases above as we expand the flow.
        break;
    }
  } catch (err) {
    // 500 → Stripe retries with backoff. We log and re-throw so the
    // payload doesn't silently disappear.
    console.error("[stripe.webhook] handler failed:", err);
    return jsonError(
      500,
      err instanceof Error ? err.message : "handler failed",
    );
  }

  return NextResponse.json({ received: true });
}

/* ─── handlers ──────────────────────────────────────────────────── */

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createSupabaseAdminClient();
  const meta = session.metadata ?? {};
  const atelierId = meta.atelier_id;
  const itemId = meta.atelier_item_id;
  const itemTitle = meta.item_title_tr || "Caelinus item";
  const itemImage = meta.item_image || null;
  const buyerUserId = meta.buyer_user_id || null;

  if (!atelierId || !itemId) {
    console.warn(
      "[stripe.webhook] checkout.session.completed without atelier_id/item_id metadata",
      { sessionId: session.id },
    );
    return;
  }

  // Pull the line item snapshot back out so we always store a
  // sane currency/amount even if the session metadata gets stripped.
  const { data: itemData } = await supabase
    .from("atelier_items")
    .select("id, title_tr, currency, price_amount, images")
    .eq("id", itemId)
    .maybeSingle();
  const item = itemData as Pick<
    AtelierItemRow,
    "id" | "title_tr" | "currency" | "price_amount" | "images"
  > | null;

  const currency = (
    session.currency ||
    item?.currency ||
    serverEnv.STRIPE_CURRENCY_DEFAULT ||
    "TRY"
  ).toUpperCase();

  const subtotal = session.amount_subtotal ?? item?.price_amount ?? 0;
  const total = session.amount_total ?? subtotal;
  const shipping =
    session.total_details?.amount_shipping ??
    Math.max(0, total - subtotal);
  const tax = session.total_details?.amount_tax ?? 0;

  const buyerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;
  const buyerName = session.customer_details?.name ?? null;

  // Stripe represents the address with snake_case keys we mirror in
  // our jsonb column — easier to render later without remapping.
  const shipDetails = session.shipping_details;
  const shipping_address: ShippingAddress | null = shipDetails?.address
    ? {
        line1: shipDetails.address.line1 ?? null,
        line2: shipDetails.address.line2 ?? null,
        city: shipDetails.address.city ?? null,
        postal_code: shipDetails.address.postal_code ?? null,
        state: shipDetails.address.state ?? null,
        country: shipDetails.address.country ?? null,
      }
    : null;

  const buyerNotes =
    session.custom_fields?.find((f) => f.key === "buyer_notes")?.text?.value ??
    null;

  const status: "pending" | "paid" =
    session.payment_status === "paid" ? "paid" : "pending";
  const paidAt = status === "paid" ? new Date().toISOString() : null;

  // Upsert by Stripe session id to keep the operation idempotent —
  // Stripe occasionally retries `checkout.session.completed`.
  const { data: orderRow, error: insertErr } = await supabase
    .from("atelier_orders")
    .upsert(
      {
        atelier_id: atelierId,
        buyer_user_id: buyerUserId || null,
        status,
        currency,
        subtotal_amount: subtotal,
        shipping_amount: shipping,
        tax_amount: tax,
        total_amount: total,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        shipping_address,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        buyer_notes: buyerNotes,
        paid_at: paidAt,
      } as never,
      { onConflict: "stripe_checkout_session_id" },
    )
    .select("id, atelier_id, status")
    .single();

  if (insertErr || !orderRow) {
    throw new Error(
      `[stripe.webhook] failed to upsert order: ${
        insertErr?.message ?? "no row"
      }`,
    );
  }

  const order = orderRow as Pick<AtelierOrderRow, "id" | "atelier_id" | "status">;

  // Add (or refresh) the line item snapshot. We delete + insert so a
  // retry can't double-count quantities.
  await supabase
    .from("atelier_order_items")
    .delete()
    .eq("order_id", order.id);

  await supabase.from("atelier_order_items").insert(
    {
      order_id: order.id,
      item_id: itemId,
      title_snapshot: itemTitle || item?.title_tr || "Caelinus item",
      currency_snapshot: currency,
      price_snapshot_amount: subtotal,
      image_snapshot_url: itemImage || item?.images?.[0] || null,
      quantity: 1,
    } as never,
  );

  // Notify the maker — best effort.
  if (status === "paid") {
    await notifyMakerOfNewOrder(order.id);
  }
}

async function onPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const supabase = createSupabaseAdminClient();
  // Match by payment_intent first, fall back to checkout session id.
  const { data, error } = await supabase
    .from("atelier_orders")
    .update(
      {
        status: "paid",
        paid_at: new Date().toISOString(),
      } as never,
    )
    .eq("stripe_payment_intent_id", pi.id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    throw new Error(
      `[stripe.webhook] payment_intent update failed: ${error.message}`,
    );
  }

  if (data) {
    await notifyMakerOfNewOrder(
      (data as Pick<AtelierOrderRow, "id">).id,
    );
  }
}

/* ─── side effects ──────────────────────────────────────────────── */

async function notifyMakerOfNewOrder(orderId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: o } = await supabase
      .from("atelier_orders")
      .select(
        "id, atelier_id, total_amount, currency, buyer_email, buyer_name",
      )
      .eq("id", orderId)
      .maybeSingle();
    const order = o as Pick<
      AtelierOrderRow,
      | "id"
      | "atelier_id"
      | "total_amount"
      | "currency"
      | "buyer_email"
      | "buyer_name"
    > | null;
    if (!order) return;

    const { data: a } = await supabase
      .from("ateliers")
      .select("slug, name, owner_user_id, contact_email")
      .eq("id", order.atelier_id)
      .maybeSingle();
    const atelier = a as Pick<
      AtelierRow,
      "slug" | "name" | "owner_user_id" | "contact_email"
    > | null;
    if (!atelier?.owner_user_id) return;

    const { data: p } = await supabase
      .from("profiles")
      .select("email, locale, display_name")
      .eq("id", atelier.owner_user_id)
      .maybeSingle();
    const profile = p as Pick<
      ProfileRow,
      "email" | "locale" | "display_name"
    > | null;

    const to = profile?.email ?? atelier.contact_email ?? null;
    if (!to) return;
    const locale = profile?.locale === "en" ? "en" : "tr";
    const formatted = `${(order.total_amount / 100).toFixed(2)} ${
      order.currency
    }`;

    const subject =
      locale === "en"
        ? `${atelier.name} · new order received`
        : `${atelier.name} · yeni sipariş geldi`;
    const greeting = profile?.display_name?.trim() || atelier.name;
    const body =
      locale === "en"
        ? `Hi ${greeting},\n\nA new order just landed for "${atelier.name}".\n\nTotal: ${formatted}\nBuyer: ${order.buyer_name ?? "—"} <${order.buyer_email ?? "—"}>\n\nOpen your bench to view shipping details.\n\n— Caelinus`
        : `Merhaba ${greeting},\n\n"${atelier.name}" için yeni bir sipariş düştü.\n\nTutar: ${formatted}\nAlıcı: ${order.buyer_name ?? "—"} <${order.buyer_email ?? "—"}>\n\nKargo bilgileri için tezgâhını aç.\n\n— Caelinus`;

    await sendEmail({
      to,
      subject,
      html: `<pre style="font-family:Georgia,serif;line-height:1.6;color:#f1ecff;background:#0a0816;padding:20px;border-radius:6px;white-space:pre-wrap;">${escapeHtml(
        body,
      )}</pre>`,
      text: body,
    });
  } catch (err) {
    console.warn("[stripe.webhook] maker notification failed:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

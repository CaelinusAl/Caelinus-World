"use server";

/**
 * Atelier item checkout — server action.
 *
 * Creates a Stripe Checkout Session for a single atelier item and
 * returns the redirect URL. The buyer can be either:
 *
 *   • signed-in  — we pre-fill `customer_email`, attach `buyer_user_id`
 *                  to the order via metadata so the webhook can claim it.
 *   • anonymous  — Stripe collects the email; the order has
 *                  `buyer_user_id = null` until later.
 *
 * Why a server action instead of a route handler? It lets the BUY button
 * be a `<form action={…}>` with native browser progressive enhancement
 * (no JS required for the happy path) while still keeping the secret
 * key on the server.
 */

import { redirect } from "next/navigation";
import type Stripe from "stripe";

import { getSiteUrl } from "@/lib/email/sender";
import { clientEnv, serverEnv } from "@/lib/env";
import { getStripe, stripeReady } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AtelierItemRow,
  AtelierRow,
} from "@/lib/supabase/types";

/**
 * Atelier checkout server action.
 *
 * Form actions can't return data to the page when the user submits a
 * standard `<form action={…}>` — the browser navigates. We therefore
 * use `redirect()` for both success (→ Stripe) and failure (→ atelier
 * page with a `checkout` query parameter that AtelierPublicBody
 * surfaces as a banner).
 */
function failBack(slug: string, code: string): never {
  if (slug) redirect(`/atelier/${slug}?checkout=${code}`);
  redirect(`/atelier?checkout=${code}`);
}

export async function startItemCheckout(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "").trim();
  const slugHint = String(formData.get("atelierSlug") ?? "").trim();

  // Stripe Checkout supports a fixed list of currencies — we only
  // attempt to forward what the listing has. We fail loudly if the
  // amount looks like an "inquire" (0) so the BUY button doesn't take
  // money for a price-on-request item.
  if (!stripeReady()) failBack(slugHint, "yapilandirma");
  if (!itemId) failBack(slugHint, "hata");

  const supabase = createSupabaseAdminClient();

  const { data: itemData, error: itemErr } = await supabase
    .from("atelier_items")
    .select(
      "id, atelier_id, title_tr, title_en, currency, price_amount, images, status, slug",
    )
    .eq("id", itemId)
    .maybeSingle();

  if (itemErr || !itemData) failBack(slugHint, "hata");

  const item = itemData as Pick<
    AtelierItemRow,
    | "id"
    | "atelier_id"
    | "title_tr"
    | "title_en"
    | "currency"
    | "price_amount"
    | "images"
    | "status"
    | "slug"
  >;

  if (item.status !== "published") failBack(slugHint, "yok");
  if (!item.price_amount || item.price_amount <= 0) {
    failBack(slugHint, "fiyatsiz");
  }

  const { data: atelierData } = await supabase
    .from("ateliers")
    .select("id, slug, name, contact_email, status")
    .eq("id", item.atelier_id)
    .maybeSingle();
  const atelier = atelierData as Pick<
    AtelierRow,
    "id" | "slug" | "name" | "contact_email" | "status"
  > | null;

  if (!atelier || atelier.status !== "approved") {
    failBack(slugHint, "kapali");
  }

  // Try to attach the buyer if signed in. Anonymous checkout still
  // works — Stripe collects the email and the webhook reconciles.
  let buyerUserId: string | null = null;
  let buyerEmail: string | null = null;
  try {
    const userClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (user) {
      buyerUserId = user.id;
      buyerEmail = user.email ?? null;
    }
  } catch {
    // No session — that's fine.
  }

  const siteUrl = getSiteUrl() || clientEnv.NEXT_PUBLIC_SITE_URL;
  const successUrl = `${siteUrl}/atelier/${atelier.slug}/checkout/basarili?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteUrl}/atelier/${atelier.slug}?checkout=iptal`;

  const currency = (item.currency || serverEnv.STRIPE_CURRENCY_DEFAULT)
    .toLowerCase();
  const stripe = getStripe();

  const cover = item.images?.[0] ?? null;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      // For TRY we prefer Türk Lirası presentation; Stripe handles the
      // rest. If the merchant's Stripe account doesn't support the
      // currency we surface the error to the user.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: item.price_amount,
            product_data: {
              name: item.title_tr,
              description: item.title_en ?? undefined,
              images: cover ? [cover] : undefined,
              metadata: {
                atelier_item_id: item.id,
                atelier_id: atelier.id,
              },
            },
          },
        },
      ],
      // Keep the order trail self-contained so the webhook can build
      // the database row without re-querying Stripe extensively.
      metadata: {
        atelier_id: atelier.id,
        atelier_slug: atelier.slug,
        atelier_item_id: item.id,
        item_title_tr: item.title_tr,
        item_image: cover ?? "",
        buyer_user_id: buyerUserId ?? "",
      },
      customer_email: buyerEmail ?? undefined,
      // Ask Stripe to collect a shipping address — atelier items are
      // physical objects more often than not. Restrict to TR for now;
      // makers can lift this later.
      shipping_address_collection: { allowed_countries: ["TR"] },
      // Allow a "buyer note" field — the maker often appreciates
      // colour / size preferences spelled out.
      custom_fields: [
        {
          key: "buyer_notes",
          label: { type: "custom", custom: "Üreticiye not (opsiyonel)" },
          type: "text",
          optional: true,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  } catch (err) {
    console.error("[checkout] stripe session create failed", err);
    failBack(atelier.slug, "stripe");
  }

  if (!session.url) {
    failBack(atelier.slug, "stripe");
  }

  redirect(session.url as string);
}

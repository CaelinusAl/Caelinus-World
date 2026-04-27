import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AtelierOrderItemRow,
  AtelierOrderRow,
  AtelierRow,
} from "@/lib/supabase/types";

export const metadata = {
  title: "Sipariş alındı · Caelinus",
};

export const dynamic = "force-dynamic";

function formatTotal(amount: number, currency: string): string {
  const code = (currency || "TRY").toUpperCase();
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: code,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${code}`;
  }
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { slug } = await params;
  const { session_id } = await searchParams;

  if (!session_id) notFound();

  const supabase = createSupabaseAdminClient();

  const { data: atelierData } = await supabase
    .from("ateliers")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  const atelier = atelierData as Pick<
    AtelierRow,
    "id" | "slug" | "name"
  > | null;
  if (!atelier) notFound();

  const { data: orderData } = await supabase
    .from("atelier_orders")
    .select(
      "id, status, currency, total_amount, buyer_email, buyer_name, paid_at, atelier_id",
    )
    .eq("stripe_checkout_session_id", session_id)
    .maybeSingle();
  const order = orderData as Pick<
    AtelierOrderRow,
    | "id"
    | "status"
    | "currency"
    | "total_amount"
    | "buyer_email"
    | "buyer_name"
    | "paid_at"
    | "atelier_id"
  > | null;

  let lineItems: Pick<
    AtelierOrderItemRow,
    "title_snapshot" | "image_snapshot_url" | "quantity"
  >[] = [];
  if (order) {
    const { data: items } = await supabase
      .from("atelier_order_items")
      .select("title_snapshot, image_snapshot_url, quantity")
      .eq("order_id", order.id);
    lineItems = (items ?? []) as typeof lineItems;
  }

  const stillProcessing = !order || order.status === "pending";

  return (
    <div className="atelier-shell">
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">Caelinus</span>
        </Link>
        <div className="atelier-ribbon-actions">
          <Link
            href={`/atelier/${atelier.slug}`}
            className="atelier-ribbon-btn"
          >
            ← {atelier.name}
          </Link>
        </div>
      </header>

      <main className="atelier-edit checkout-shell">
        <section className="checkout-card">
          <p className="atelier-edit-handle">Caelinus · Sipariş</p>
          <h1 className="checkout-title">
            {stillProcessing
              ? "Ödemen alındı, sipariş hazırlanıyor"
              : "Teşekkürler, siparişin alındı"}
          </h1>
          <p className="checkout-lead">
            {stillProcessing
              ? "Banka onayı geldiğinde siparişin atölyenin ekranına düşecek. Mailini bekle."
              : `${atelier.name} sahnesine hoşgeldin. Üretici siparişin için bilgilendirildi; kargolama mailini bekle.`}
          </p>

          {order ? (
            <dl className="checkout-meta">
              <div>
                <dt>Sipariş no</dt>
                <dd>{order.id.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div>
                <dt>Tutar</dt>
                <dd>{formatTotal(order.total_amount, order.currency)}</dd>
              </div>
              {order.buyer_email ? (
                <div>
                  <dt>E-posta</dt>
                  <dd>{order.buyer_email}</dd>
                </div>
              ) : null}
              {order.paid_at ? (
                <div>
                  <dt>Ödeme</dt>
                  <dd>
                    {new Date(order.paid_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {lineItems.length > 0 ? (
            <ul className="checkout-items">
              {lineItems.map((li, idx) => (
                <li key={idx}>
                  {li.image_snapshot_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={li.image_snapshot_url} alt={li.title_snapshot} />
                  ) : (
                    <span className="checkout-item-placeholder" aria-hidden="true">
                      ✦
                    </span>
                  )}
                  <span>
                    <b>{li.title_snapshot}</b>
                    <em>× {li.quantity}</em>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="checkout-actions">
            <Link
              href={`/atelier/${atelier.slug}`}
              className="atelier-btn atelier-btn-ghost"
            >
              ← Atölyeye dön
            </Link>
            <Link
              href="/hesap"
              className="atelier-btn atelier-btn-primary"
            >
              Hesabım →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

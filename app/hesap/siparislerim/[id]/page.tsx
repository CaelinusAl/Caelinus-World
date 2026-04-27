import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AtelierOrderItemRow,
  AtelierOrderRow,
  AtelierRow,
} from "@/lib/supabase/types";

import OrderDetailBody from "./OrderDetailBody";

export const metadata = {
  title: "Sipariş · Caelinus",
};

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function NotFoundPanel() {
  return (
    <div className="atelier-shell">
      <main className="orders-shell">
        <header className="orders-hero">
          <h1 className="orders-hero-title">Sipariş bulunamadı</h1>
          <p className="orders-hero-lead">
            Bu kimliğe sahip bir siparişin yok ya da bu sipariş sana ait değil.
            Geçerli bir bağlantı için Siparişlerim listesine geri dön ve
            görmek istediğin siparişin “Detay” bağlantısına tıkla.
          </p>
        </header>
        <div className="orders-empty">
          <Link
            href="/hesap/siparislerim"
            className="atelier-btn atelier-btn-primary"
          >
            ← Siparişlerim
          </Link>
        </div>
      </main>
    </div>
  );
}

/**
 * Buyer-facing order detail. The maker has a parallel maker-side
 * ledger at `/atelier/dashboard/siparisler` (with editing controls);
 * this page is read-only and shows the buyer everything Stripe + the
 * maker have put on the record.
 */
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/atelier/giris?next=/hesap/siparislerim/${id}`);

  // Reject obviously malformed ids before talking to Postgres — Supabase
  // treats `eq("id", "%60")` as a uuid cast that throws, which would
  // otherwise bubble up as a generic error. We want the friendly panel.
  if (!UUID_RE.test(id)) {
    return <NotFoundPanel />;
  }

  const { data: orderData, error: orderErr } = await supabase
    .from("atelier_orders")
    .select(
      "id, atelier_id, buyer_user_id, status, currency, subtotal_amount, shipping_amount, tax_amount, total_amount, buyer_email, buyer_name, shipping_address, buyer_notes, tracking_carrier, tracking_number, tracking_url, shipped_at, delivered_at, cancelled_at, maker_note, created_at, paid_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (orderErr) {
    console.warn("[orders.detail] supabase error:", orderErr.message);
  }
  const order = orderData as AtelierOrderRow | null;

  if (!order || order.buyer_user_id !== user.id) {
    return <NotFoundPanel />;
  }

  const [{ data: itemsData }, { data: atelierData }] = await Promise.all([
    supabase
      .from("atelier_order_items")
      .select(
        "id, order_id, item_id, title_snapshot, currency_snapshot, price_snapshot_amount, image_snapshot_url, quantity",
      )
      .eq("order_id", order.id),
    supabase
      .from("ateliers")
      .select("id, slug, name")
      .eq("id", order.atelier_id)
      .maybeSingle(),
  ]);

  const items = (itemsData ?? []) as AtelierOrderItemRow[];
  const atelier = atelierData as Pick<
    AtelierRow,
    "id" | "slug" | "name"
  > | null;

  if (!atelier) {
    return (
      <div className="atelier-shell">
        <main className="orders-shell">
          <p>Atölye bilgisi bulunamadı.</p>
          <Link href="/hesap/siparislerim">← Siparişlerim</Link>
        </main>
      </div>
    );
  }

  return <OrderDetailBody order={order} items={items} atelier={atelier} />;
}

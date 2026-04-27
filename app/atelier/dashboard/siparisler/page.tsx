import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AtelierOrderItemRow,
  AtelierOrderRow,
  AtelierRow,
  OrderStatus,
} from "@/lib/supabase/types";

import OrdersBody from "./OrdersBody";

/**
 * Maker-side order centre.
 *
 * Lists every order belonging to an atelier the visitor owns. RLS
 * (`orders_select_atelier_owner`) does the actual filtering — we just
 * select(*) and trust Postgres to hand us only authorised rows.
 *
 * Filters:
 *   • ?status=paid|shipped|delivered|cancelled — quick triage
 *   • (default) shows everything
 */

export const metadata = {
  title: "Siparişler · Caelinus Atelier",
};

const VALID_STATUS: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/atelier/giris?next=/atelier/dashboard/siparisler");
  }

  const sp = await searchParams;
  const status = (
    sp.status && VALID_STATUS.includes(sp.status as OrderStatus)
      ? (sp.status as OrderStatus)
      : null
  ) as OrderStatus | null;

  // Maker's atelier roster — the OrdersBody surfaces atelier names
  // alongside each order so a maker with several benches can tell
  // them apart at a glance.
  const ateliersResult = await supabase
    .from("ateliers")
    .select("id, slug, name")
    .eq("owner_user_id", user.id);
  const ateliers = (ateliersResult.data ?? []) as Pick<
    AtelierRow,
    "id" | "slug" | "name"
  >[];

  // Orders. Service-role would be overkill — RLS already restricts
  // rows to ateliers we own.
  let ordersQuery = supabase
    .from("atelier_orders")
    .select(
      "id, atelier_id, status, currency, subtotal_amount, shipping_amount, tax_amount, total_amount, buyer_email, buyer_name, shipping_address, buyer_notes, tracking_carrier, tracking_number, tracking_url, shipped_at, delivered_at, cancelled_at, maker_note, buyer_notified_shipped_at, created_at, paid_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) ordersQuery = ordersQuery.eq("status", status);

  const ordersResult = await ordersQuery;
  const orders = (ordersResult.data ?? []) as AtelierOrderRow[];

  // Line items in one round-trip, indexed by order_id.
  const orderIds = orders.map((o) => o.id);
  let items: AtelierOrderItemRow[] = [];
  if (orderIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("atelier_order_items")
      .select(
        "id, order_id, item_id, title_snapshot, currency_snapshot, price_snapshot_amount, image_snapshot_url, quantity",
      )
      .in("order_id", orderIds);
    items = (itemsData ?? []) as AtelierOrderItemRow[];
  }

  // Quick counts for the status chips so the maker can see at a
  // glance how many "paid" orders need attention.
  const counts: Record<OrderStatus, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  };
  if (!status) {
    for (const o of orders) counts[o.status] += 1;
  } else {
    // When filtering, we still want the chip counts to reflect the
    // full inbox. Run an unfiltered, ids-only query.
    const { data: rawCounts } = await supabase
      .from("atelier_orders")
      .select("status");
    const all = (rawCounts ?? []) as { status: OrderStatus }[];
    for (const r of all) counts[r.status] += 1;
  }

  return (
    <OrdersBody
      ateliers={ateliers}
      orders={orders}
      items={items}
      activeStatus={status}
      counts={counts}
    />
  );
}

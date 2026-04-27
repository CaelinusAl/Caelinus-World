import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AtelierOrderItemRow,
  AtelierOrderRow,
  AtelierRow,
} from "@/lib/supabase/types";

import MyOrdersBody from "./MyOrdersBody";

export const metadata = {
  title: "Siparişlerim · Caelinus",
};

/**
 * Buyer's order history — `/hesap/siparislerim`.
 *
 * Lists every order linked to `auth.uid()`. Guest checkout orders
 * (`buyer_user_id IS NULL`) don't appear here — buyers can still find
 * them via the e-mail receipt and the success page link.
 */
export default async function MyOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/atelier/giris?next=/hesap/siparislerim");

  const ordersResult = await supabase
    .from("atelier_orders")
    .select(
      "id, atelier_id, status, currency, total_amount, buyer_email, buyer_name, buyer_notes, tracking_carrier, tracking_number, tracking_url, shipped_at, delivered_at, cancelled_at, maker_note, created_at, paid_at",
    )
    .eq("buyer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (ordersResult.data ?? []) as AtelierOrderRow[];

  let items: AtelierOrderItemRow[] = [];
  let ateliers: Pick<AtelierRow, "id" | "slug" | "name">[] = [];

  if (orders.length > 0) {
    const orderIds = orders.map((o) => o.id);
    const atelierIds = Array.from(new Set(orders.map((o) => o.atelier_id)));

    const [{ data: itemsData }, { data: ateliersData }] = await Promise.all([
      supabase
        .from("atelier_order_items")
        .select(
          "id, order_id, item_id, title_snapshot, currency_snapshot, price_snapshot_amount, image_snapshot_url, quantity",
        )
        .in("order_id", orderIds),
      supabase
        .from("ateliers")
        .select("id, slug, name")
        .in("id", atelierIds),
    ]);

    items = (itemsData ?? []) as AtelierOrderItemRow[];
    ateliers = (ateliersData ?? []) as typeof ateliers;
  }

  return <MyOrdersBody orders={orders} items={items} ateliers={ateliers} />;
}

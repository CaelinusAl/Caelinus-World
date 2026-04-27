"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import type {
  AtelierOrderItemRow,
  AtelierOrderRow,
  AtelierRow,
  OrderStatus,
} from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../../_components/AtelierMatrix";
import {
  cancelOrder,
  markOrderDelivered,
  markOrderShipped,
} from "./_actions/orders";

type OrderItemSnapshot = Pick<
  AtelierOrderItemRow,
  | "id"
  | "order_id"
  | "title_snapshot"
  | "image_snapshot_url"
  | "quantity"
  | "price_snapshot_amount"
  | "currency_snapshot"
>;

type OrderRow = AtelierOrderRow;

interface Props {
  ateliers: Pick<AtelierRow, "id" | "slug" | "name">[];
  orders: OrderRow[];
  items: OrderItemSnapshot[];
  activeStatus: OrderStatus | null;
  counts: Record<OrderStatus, number>;
}

/* ─── i18n ───────────────────────────────────────────────────────── */

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  back: { tr: "← Tezgâh", en: "← Bench" },
  title: { tr: "Siparişler", en: "Orders" },
  subtitle: {
    tr: "Tezgâhından çıkan ürünleri buradan kargola, durumunu güncelle.",
    en: "Ship pieces from your bench and walk each order through fulfilment.",
  },
  empty: {
    tr: "Henüz sipariş yok. İlk satışın geldiğinde burada görünecek.",
    en: "No orders yet. The first one will land here when it arrives.",
  },
  emptyFiltered: {
    tr: "Bu filtrede sipariş yok.",
    en: "No orders in this filter.",
  },
  filters: {
    all: { tr: "Hepsi", en: "All" },
  },
  status: {
    pending: { tr: "Beklemede", en: "Pending" },
    paid: { tr: "Ödendi", en: "Paid" },
    shipped: { tr: "Kargoda", en: "Shipped" },
    delivered: { tr: "Teslim edildi", en: "Delivered" },
    cancelled: { tr: "İptal", en: "Cancelled" },
    refunded: { tr: "İade", en: "Refunded" },
  } as Record<OrderStatus, { tr: string; en: string }>,
  buyer: { tr: "Alıcı", en: "Buyer" },
  shipTo: { tr: "Adres", en: "Ship to" },
  buyerNote: { tr: "Alıcının notu", en: "Buyer's note" },
  makerNoteLabel: { tr: "Ürün için notun", en: "Note to buyer" },
  trackingCarrier: { tr: "Kargo firması", en: "Carrier" },
  trackingNumber: { tr: "Takip no", en: "Tracking #" },
  trackingUrl: { tr: "Takip linki", en: "Tracking URL" },
  notify: {
    tr: "Alıcıya bildirildi",
    en: "Buyer notified",
  },
  actions: {
    ship: { tr: "Kargolandı olarak işaretle", en: "Mark as shipped" },
    deliver: { tr: "Teslim edildi", en: "Mark delivered" },
    cancel: { tr: "İptal et", en: "Cancel order" },
    cancelConfirm: {
      tr: "Bu siparişi iptal etmek istediğine emin misin?",
      en: "Cancel this order?",
    },
  },
  cancelReason: {
    tr: "İptal nedeni (opsiyonel)",
    en: "Cancel reason (optional)",
  },
  total: { tr: "Tutar", en: "Total" },
  paidAt: { tr: "Ödeme", en: "Paid" },
  shippedAt: { tr: "Kargo", en: "Shipped" },
  deliveredAt: { tr: "Teslim", en: "Delivered" },
} as const;

/* ─── helpers ────────────────────────────────────────────────────── */

function formatMoney(amount: number, currency: string): string {
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

function formatDate(iso: string | null, lang: "tr" | "en"): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function statusToToneClass(s: OrderStatus): string {
  switch (s) {
    case "paid":
      return "is-paid";
    case "shipped":
      return "is-shipped";
    case "delivered":
      return "is-delivered";
    case "cancelled":
    case "refunded":
      return "is-cancelled";
    default:
      return "is-pending";
  }
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function OrdersBody({
  ateliers,
  orders,
  items,
  activeStatus,
  counts,
}: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const itemsByOrder = useMemo(() => {
    const map = new Map<string, OrderItemSnapshot[]>();
    for (const it of items) {
      const arr = map.get(it.order_id) ?? [];
      arr.push(it);
      map.set(it.order_id, arr);
    }
    return map;
  }, [items]);

  const ateliersById = useMemo(() => {
    const m = new Map<string, Pick<AtelierRow, "id" | "slug" | "name">>();
    for (const a of ateliers) m.set(a.id, a);
    return m;
  }, [ateliers]);

  const filterChips: Array<OrderStatus | null> = useMemo(
    () => [null, "paid", "shipped", "delivered", "cancelled"],
    [],
  );

  const totalCount = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="atelier-shell">
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>
        <div className="atelier-ribbon-actions">
          <Link href="/atelier/dashboard" className="atelier-ribbon-btn">
            {T.back[L]}
          </Link>
          <button
            type="button"
            className="atelier-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="atelier-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      <main className="orders-shell">
        <header className="orders-hero">
          <h1 className="orders-hero-title">{T.title[L]}</h1>
          <p className="orders-hero-lead">{T.subtitle[L]}</p>
        </header>

        <nav className="orders-filters" aria-label={T.title[L]}>
          {filterChips.map((s) => {
            const isActive =
              (activeStatus === null && s === null) || activeStatus === s;
            const label =
              s === null ? T.filters.all[L] : T.status[s][L];
            const count = s === null ? totalCount : counts[s] ?? 0;
            const href = s === null
              ? "/atelier/dashboard/siparisler"
              : `/atelier/dashboard/siparisler?status=${s}`;
            return (
              <Link
                key={s ?? "all"}
                href={href}
                className={
                  "orders-filter-chip" +
                  (isActive ? " is-active" : "") +
                  " " + (s ? statusToToneClass(s) : "")
                }
              >
                <span>{label}</span>
                <span className="orders-filter-count">{count}</span>
              </Link>
            );
          })}
        </nav>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <p>
              {activeStatus !== null
                ? T.emptyFiltered[L]
                : T.empty[L]}
            </p>
          </div>
        ) : (
          <ul className="orders-list">
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                lineItems={itemsByOrder.get(o.id) ?? []}
                atelier={ateliersById.get(o.atelier_id) ?? null}
                lang={L}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

/* ─── OrderCard ──────────────────────────────────────────────────── */

function OrderCard({
  order,
  lineItems,
  atelier,
  lang,
}: {
  order: OrderRow;
  lineItems: OrderItemSnapshot[];
  atelier: Pick<AtelierRow, "id" | "slug" | "name"> | null;
  lang: "tr" | "en";
}) {
  const cover = lineItems.find((li) => li.image_snapshot_url)?.image_snapshot_url ?? null;

  const statusLabel = T.status[order.status][lang];
  const tone = statusToToneClass(order.status);

  const shipping = order.shipping_address;

  return (
    <li className={"order-card " + tone}>
      {/* Cover */}
      <div className="order-card-cover">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={lineItems[0]?.title_snapshot ?? "—"} />
        ) : (
          <span aria-hidden="true">✦</span>
        )}
      </div>

      {/* Body */}
      <div className="order-card-body">
        <div className="order-card-meta-row">
          <span className="order-card-id">#{shortId(order.id)}</span>
          <span className={"order-card-status-pill " + tone}>{statusLabel}</span>
          {atelier ? (
            <Link
              href={`/atelier/${atelier.slug}`}
              className="order-card-atelier"
            >
              {atelier.name}
            </Link>
          ) : null}
          <span className="order-card-date">
            {formatDate(order.paid_at ?? order.created_at, lang)}
          </span>
        </div>

        <ul className="order-card-titles">
          {lineItems.map((li) => (
            <li key={li.id}>
              <span>{li.title_snapshot}</span>
              <em>× {li.quantity}</em>
            </li>
          ))}
        </ul>

        <div className="order-card-totals">
          <span>{T.total[lang]}</span>
          <strong>{formatMoney(order.total_amount, order.currency)}</strong>
        </div>

        <dl className="order-card-buyer">
          <div>
            <dt>{T.buyer[lang]}</dt>
            <dd>
              {order.buyer_name ? (
                <span>{order.buyer_name}</span>
              ) : null}
              {order.buyer_email ? (
                <a href={`mailto:${order.buyer_email}`}>{order.buyer_email}</a>
              ) : null}
            </dd>
          </div>
          {shipping ? (
            <div>
              <dt>{T.shipTo[lang]}</dt>
              <dd>
                {[
                  shipping.line1,
                  shipping.line2,
                  [shipping.postal_code, shipping.city].filter(Boolean).join(" "),
                  shipping.state,
                  shipping.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          ) : null}
          {order.buyer_notes ? (
            <div>
              <dt>{T.buyerNote[lang]}</dt>
              <dd className="order-card-buyer-quote">{order.buyer_notes}</dd>
            </div>
          ) : null}
        </dl>

        {/* Existing tracking — shown for shipped/delivered/cancelled */}
        {(order.tracking_number || order.tracking_url || order.maker_note) ? (
          <div className="order-card-tracking">
            {order.tracking_number || order.tracking_url ? (
              <p>
                <strong>{T.trackingNumber[lang]}:</strong>{" "}
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {[order.tracking_carrier, order.tracking_number]
                      .filter(Boolean)
                      .join(" · ") || order.tracking_url}
                  </a>
                ) : (
                  <span>
                    {[order.tracking_carrier, order.tracking_number]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </p>
            ) : null}
            {order.maker_note ? (
              <p className="order-card-maker-note">{order.maker_note}</p>
            ) : null}
            {order.buyer_notified_shipped_at ? (
              <p className="order-card-notified">
                ✓ {T.notify[lang]} ·{" "}
                {formatDate(order.buyer_notified_shipped_at, lang)}
              </p>
            ) : null}
          </div>
        ) : null}

        <OrderActions order={order} lang={lang} />
      </div>
    </li>
  );
}

/* ─── OrderActions ───────────────────────────────────────────────── */

function OrderActions({
  order,
  lang,
}: {
  order: OrderRow;
  lang: "tr" | "en";
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (order.status === "delivered" || order.status === "cancelled" || order.status === "refunded") {
    if (order.status === "delivered" && order.delivered_at) {
      return (
        <div className="order-card-actions is-final">
          <p>
            {T.deliveredAt[lang]} · {formatDate(order.delivered_at, lang)}
          </p>
        </div>
      );
    }
    if (order.status === "cancelled" && order.cancelled_at) {
      return (
        <div className="order-card-actions is-final">
          <p>
            {T.status.cancelled[lang]} ·{" "}
            {formatDate(order.cancelled_at, lang)}
          </p>
        </div>
      );
    }
    return null;
  }

  function handleShip(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await markOrderShipped(formData);
      if (!res.ok) setError(res.error);
    });
  }

  function handleDeliver(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await markOrderDelivered(formData);
      if (!res.ok) setError(res.error);
    });
  }

  function handleCancel(formData: FormData) {
    if (!window.confirm(T.actions.cancelConfirm[lang])) return;
    setError(null);
    start(async () => {
      const res = await cancelOrder(formData);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="order-card-actions">
      {/* Paid → ship form */}
      {(order.status === "paid" || order.status === "shipped") && (
        <form action={handleShip} className="order-action-form">
          <input type="hidden" name="orderId" value={order.id} />
          <div className="order-action-row">
            <label className="order-action-input">
              <span>{T.trackingCarrier[lang]}</span>
              <input
                type="text"
                name="trackingCarrier"
                placeholder="MNG / Yurtiçi / Aras …"
                defaultValue={order.tracking_carrier ?? ""}
              />
            </label>
            <label className="order-action-input">
              <span>{T.trackingNumber[lang]}</span>
              <input
                type="text"
                name="trackingNumber"
                placeholder="ABC123…"
                defaultValue={order.tracking_number ?? ""}
              />
            </label>
          </div>
          <label className="order-action-input">
            <span>{T.trackingUrl[lang]}</span>
            <input
              type="url"
              name="trackingUrl"
              placeholder="https://…"
              defaultValue={order.tracking_url ?? ""}
            />
          </label>
          <label className="order-action-input">
            <span>{T.makerNoteLabel[lang]}</span>
            <textarea
              name="makerNote"
              rows={2}
              maxLength={600}
              defaultValue={order.maker_note ?? ""}
            />
          </label>
          <button
            type="submit"
            className="order-action-submit"
            disabled={pending}
          >
            {pending ? "…" : T.actions.ship[lang]}
          </button>
        </form>
      )}

      {/* Shipped → mark delivered */}
      {order.status === "shipped" && (
        <form action={handleDeliver} className="order-action-secondary">
          <input type="hidden" name="orderId" value={order.id} />
          <button
            type="submit"
            className="order-action-secondary-btn"
            disabled={pending}
          >
            {T.actions.deliver[lang]} →
          </button>
        </form>
      )}

      {/* Cancel — available until delivered */}
      {(order.status === "pending" ||
        order.status === "paid" ||
        order.status === "shipped") && (
        <form action={handleCancel} className="order-action-secondary">
          <input type="hidden" name="orderId" value={order.id} />
          <input
            type="text"
            name="reason"
            className="order-action-cancel-reason"
            placeholder={T.cancelReason[lang]}
            maxLength={600}
          />
          <button
            type="submit"
            className="order-action-cancel-btn"
            disabled={pending}
          >
            {T.actions.cancel[lang]}
          </button>
        </form>
      )}

      {error ? <p className="order-action-error">{error}</p> : null}
    </div>
  );
}

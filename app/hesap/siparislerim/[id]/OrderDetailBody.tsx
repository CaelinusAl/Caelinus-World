"use client";

import Link from "next/link";

import type {
  AtelierOrderItemRow,
  AtelierOrderRow,
  AtelierRow,
  OrderStatus,
} from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../../../atelier/_components/AtelierMatrix";

type Props = {
  order: AtelierOrderRow;
  items: AtelierOrderItemRow[];
  atelier: Pick<AtelierRow, "id" | "slug" | "name">;
};

const T = {
  brand: { tr: "Caelinus · Sipariş", en: "Caelinus · Order" },
  back: { tr: "← Siparişlerim", en: "← My orders" },
  title: { tr: "Sipariş detayı", en: "Order detail" },
  status: {
    pending: { tr: "Beklemede", en: "Pending" },
    paid: { tr: "Ödendi", en: "Paid" },
    shipped: { tr: "Kargoda", en: "Shipped" },
    delivered: { tr: "Teslim edildi", en: "Delivered" },
    cancelled: { tr: "İptal", en: "Cancelled" },
    refunded: { tr: "İade", en: "Refunded" },
  } as Record<OrderStatus, { tr: string; en: string }>,
  totalLabel: { tr: "Toplam", en: "Total" },
  subtotalLabel: { tr: "Ara toplam", en: "Subtotal" },
  shippingLabel: { tr: "Kargo", en: "Shipping" },
  taxLabel: { tr: "Vergi", en: "Tax" },
  buyerLabel: { tr: "Alıcı", en: "Buyer" },
  shipToLabel: { tr: "Adres", en: "Ship to" },
  buyerNoteLabel: { tr: "Alıcının notu", en: "Buyer's note" },
  makerNoteLabel: { tr: "Üreticiden not", en: "Note from maker" },
  trackingLabel: { tr: "Takip", en: "Tracking" },
  paidAt: { tr: "Ödeme", en: "Paid" },
  shippedAt: { tr: "Kargo", en: "Shipped" },
  deliveredAt: { tr: "Teslim", en: "Delivered" },
  cancelledAt: { tr: "İptal", en: "Cancelled" },
  itemsLabel: { tr: "Parçalar", en: "Pieces" },
  contactMaker: {
    tr: "Üreticiye yaz",
    en: "Contact maker",
  },
} as const;

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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function OrderDetailBody({ order, items, atelier }: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const tone = statusToToneClass(order.status);
  const shipping = order.shipping_address;

  return (
    <div className="atelier-shell">
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/universe" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>
        <div className="atelier-ribbon-actions">
          <Link href="/hesap/siparislerim" className="atelier-ribbon-btn">
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
          <p className="orders-hero-eyebrow">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="orders-hero-title">{T.title[L]}</h1>
          <p className="orders-hero-lead">
            <Link href={`/atelier/${atelier.slug}`}>{atelier.name}</Link>
          </p>
        </header>

        <section className={"order-detail-card " + tone}>
          <div className="order-detail-status-row">
            <span className={"order-card-status-pill " + tone}>
              {T.status[order.status][L]}
            </span>
            <span className="order-detail-date">
              {formatDate(order.paid_at ?? order.created_at, L)}
            </span>
          </div>

          {/* Status timeline */}
          <ol className="order-timeline">
            <li className={"is-paid " + (order.paid_at ? "is-on" : "")}>
              <span aria-hidden="true">●</span>
              <span>{T.status.paid[L]}</span>
              <em>{order.paid_at ? formatDate(order.paid_at, L) : ""}</em>
            </li>
            <li className={"is-shipped " + (order.shipped_at ? "is-on" : "")}>
              <span aria-hidden="true">●</span>
              <span>{T.status.shipped[L]}</span>
              <em>
                {order.shipped_at ? formatDate(order.shipped_at, L) : ""}
              </em>
            </li>
            <li
              className={
                "is-delivered " +
                (order.delivered_at ? "is-on" : "") +
                (order.cancelled_at ? " is-cancelled" : "")
              }
            >
              <span aria-hidden="true">●</span>
              <span>
                {order.cancelled_at
                  ? T.status.cancelled[L]
                  : T.status.delivered[L]}
              </span>
              <em>
                {order.delivered_at
                  ? formatDate(order.delivered_at, L)
                  : order.cancelled_at
                    ? formatDate(order.cancelled_at, L)
                    : ""}
              </em>
            </li>
          </ol>

          {/* Tracking */}
          {(order.tracking_number || order.tracking_url) ? (
            <div className="order-card-tracking">
              <p>
                <strong>{T.trackingLabel[L]}:</strong>{" "}
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
            </div>
          ) : null}

          {order.maker_note ? (
            <div className="order-card-tracking">
              <p>
                <strong>{T.makerNoteLabel[L]}:</strong>
              </p>
              <p className="order-card-maker-note">{order.maker_note}</p>
            </div>
          ) : null}

          {/* Items */}
          <h2 className="order-detail-section-title">{T.itemsLabel[L]}</h2>
          <ul className="checkout-items">
            {items.map((li) => (
              <li key={li.id}>
                {li.image_snapshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={li.image_snapshot_url}
                    alt={li.title_snapshot}
                  />
                ) : (
                  <span
                    className="checkout-item-placeholder"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                )}
                <span>
                  <b>{li.title_snapshot}</b>
                  <em>× {li.quantity}</em>
                </span>
                <span className="order-detail-item-price">
                  {formatMoney(
                    li.price_snapshot_amount * li.quantity,
                    li.currency_snapshot,
                  )}
                </span>
              </li>
            ))}
          </ul>

          {/* Money breakdown */}
          <dl className="order-detail-money">
            <div>
              <dt>{T.subtotalLabel[L]}</dt>
              <dd>{formatMoney(order.subtotal_amount, order.currency)}</dd>
            </div>
            {order.shipping_amount > 0 ? (
              <div>
                <dt>{T.shippingLabel[L]}</dt>
                <dd>{formatMoney(order.shipping_amount, order.currency)}</dd>
              </div>
            ) : null}
            {order.tax_amount > 0 ? (
              <div>
                <dt>{T.taxLabel[L]}</dt>
                <dd>{formatMoney(order.tax_amount, order.currency)}</dd>
              </div>
            ) : null}
            <div className="order-detail-money-total">
              <dt>{T.totalLabel[L]}</dt>
              <dd>{formatMoney(order.total_amount, order.currency)}</dd>
            </div>
          </dl>

          {/* Buyer + ship-to */}
          <dl className="order-card-buyer">
            <div>
              <dt>{T.buyerLabel[L]}</dt>
              <dd>
                {order.buyer_name ? <span>{order.buyer_name}</span> : null}
                {order.buyer_email ? (
                  <a href={`mailto:${order.buyer_email}`}>
                    {order.buyer_email}
                  </a>
                ) : null}
              </dd>
            </div>
            {shipping ? (
              <div>
                <dt>{T.shipToLabel[L]}</dt>
                <dd>
                  {[
                    shipping.line1,
                    shipping.line2,
                    [shipping.postal_code, shipping.city]
                      .filter(Boolean)
                      .join(" "),
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
                <dt>{T.buyerNoteLabel[L]}</dt>
                <dd className="order-card-buyer-quote">{order.buyer_notes}</dd>
              </div>
            ) : null}
          </dl>

          <div className="checkout-actions">
            <Link
              href={`/atelier/${atelier.slug}`}
              className="atelier-btn atelier-btn-ghost"
            >
              ← {atelier.name}
            </Link>
            <Link
              href={`mailto:?subject=${encodeURIComponent(`${atelier.name} · #${order.id.slice(0, 8).toUpperCase()}`)}`}
              className="atelier-btn atelier-btn-primary"
            >
              {T.contactMaker[L]} →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

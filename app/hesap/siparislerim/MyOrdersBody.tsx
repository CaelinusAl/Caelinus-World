"use client";

import Link from "next/link";
import { useMemo } from "react";

import type {
  AtelierOrderItemRow,
  AtelierOrderRow,
  AtelierRow,
  OrderStatus,
} from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../../atelier/_components/AtelierMatrix";

type Props = {
  orders: AtelierOrderRow[];
  items: AtelierOrderItemRow[];
  ateliers: Pick<AtelierRow, "id" | "slug" | "name">[];
};

const T = {
  brand: { tr: "Caelinus · Hesap", en: "Caelinus · Account" },
  back: { tr: "← Hesap", en: "← Account" },
  title: { tr: "Siparişlerim", en: "My orders" },
  subtitle: {
    tr: "Bu sayfada Caelinus üzerinden verdiğin tüm siparişleri ve durumlarını görürsün.",
    en: "Every order you placed through Caelinus, with its current state.",
  },
  empty: {
    tr: "Henüz siparişin yok. Universe'de bir atölye keşfetmeye başlayabilirsin.",
    en: "You haven't placed an order yet. Universe is a good place to start.",
  },
  exploreCta: { tr: "Universe", en: "Universe" },
  status: {
    pending: { tr: "Beklemede", en: "Pending" },
    paid: { tr: "Ödendi", en: "Paid" },
    shipped: { tr: "Kargoda", en: "Shipped" },
    delivered: { tr: "Teslim edildi", en: "Delivered" },
    cancelled: { tr: "İptal", en: "Cancelled" },
    refunded: { tr: "İade", en: "Refunded" },
  } as Record<OrderStatus, { tr: string; en: string }>,
  total: { tr: "Tutar", en: "Total" },
  tracking: { tr: "Takip", en: "Tracking" },
  detail: { tr: "Detay", en: "Detail" },
  paidAt: { tr: "Ödeme", en: "Paid" },
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
    month: "short",
    year: "numeric",
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

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export default function MyOrdersBody({ orders, items, ateliers }: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const itemsByOrder = useMemo(() => {
    const m = new Map<string, AtelierOrderItemRow[]>();
    for (const i of items) {
      const arr = m.get(i.order_id) ?? [];
      arr.push(i);
      m.set(i.order_id, arr);
    }
    return m;
  }, [items]);

  const atelierById = useMemo(() => {
    const m = new Map<string, Pick<AtelierRow, "id" | "slug" | "name">>();
    for (const a of ateliers) m.set(a.id, a);
    return m;
  }, [ateliers]);

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
          <Link href="/hesap" className="atelier-ribbon-btn">
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

        {orders.length === 0 ? (
          <div className="orders-empty">
            <p>{T.empty[L]}</p>
            <Link
              href="/universe"
              className="atelier-btn atelier-btn-primary"
            >
              {T.exploreCta[L]} →
            </Link>
          </div>
        ) : (
          <ul className="orders-list">
            {orders.map((o) => {
              const lineItems = itemsByOrder.get(o.id) ?? [];
              const cover =
                lineItems.find((li) => li.image_snapshot_url)
                  ?.image_snapshot_url ?? null;
              const atelier = atelierById.get(o.atelier_id) ?? null;
              const tone = statusToToneClass(o.status);

              return (
                <li key={o.id} className={"order-card " + tone}>
                  <div className="order-card-cover">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={lineItems[0]?.title_snapshot ?? "—"}
                      />
                    ) : (
                      <span aria-hidden="true">✦</span>
                    )}
                  </div>

                  <div className="order-card-body">
                    <div className="order-card-meta-row">
                      <span className="order-card-id">#{shortId(o.id)}</span>
                      <span
                        className={"order-card-status-pill " + tone}
                      >
                        {T.status[o.status][L]}
                      </span>
                      {atelier ? (
                        <Link
                          href={`/atelier/${atelier.slug}`}
                          className="order-card-atelier"
                        >
                          {atelier.name}
                        </Link>
                      ) : null}
                      <span className="order-card-date">
                        {formatDate(o.paid_at ?? o.created_at, L)}
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
                      <span>{T.total[L]}</span>
                      <strong>{formatMoney(o.total_amount, o.currency)}</strong>
                    </div>

                    {/* Status timeline */}
                    <ol className="order-timeline">
                      <li className={"is-paid " + (o.paid_at ? "is-on" : "")}>
                        <span aria-hidden="true">●</span>
                        <span>{T.status.paid[L]}</span>
                        <em>{o.paid_at ? formatDate(o.paid_at, L) : ""}</em>
                      </li>
                      <li className={"is-shipped " + (o.shipped_at ? "is-on" : "")}>
                        <span aria-hidden="true">●</span>
                        <span>{T.status.shipped[L]}</span>
                        <em>
                          {o.shipped_at ? formatDate(o.shipped_at, L) : ""}
                        </em>
                      </li>
                      <li
                        className={
                          "is-delivered " +
                          (o.delivered_at ? "is-on" : "") +
                          (o.cancelled_at ? " is-cancelled" : "")
                        }
                      >
                        <span aria-hidden="true">●</span>
                        <span>
                          {o.cancelled_at
                            ? T.status.cancelled[L]
                            : T.status.delivered[L]}
                        </span>
                        <em>
                          {o.delivered_at
                            ? formatDate(o.delivered_at, L)
                            : o.cancelled_at
                              ? formatDate(o.cancelled_at, L)
                              : ""}
                        </em>
                      </li>
                    </ol>

                    {(o.tracking_number || o.tracking_url || o.maker_note) ? (
                      <div className="order-card-tracking">
                        {o.tracking_url || o.tracking_number ? (
                          <p>
                            <strong>{T.tracking[L]}:</strong>{" "}
                            {o.tracking_url ? (
                              <a
                                href={o.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {[o.tracking_carrier, o.tracking_number]
                                  .filter(Boolean)
                                  .join(" · ") || o.tracking_url}
                              </a>
                            ) : (
                              <span>
                                {[o.tracking_carrier, o.tracking_number]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </p>
                        ) : null}
                        {o.maker_note ? (
                          <p className="order-card-maker-note">{o.maker_note}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="order-card-actions">
                      <Link
                        href={`/hesap/siparislerim/${o.id}`}
                        className="order-action-secondary-btn"
                      >
                        {T.detail[L]} →
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

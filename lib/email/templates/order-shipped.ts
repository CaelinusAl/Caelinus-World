/**
 * Email template for "your order has shipped" — sent to the buyer
 * the moment the atelier owner flips the order from "paid" to
 * "shipped" and saves a tracking number (or just confirms shipment).
 *
 * Mirrors the visual/voice rules of `atelier-decision.ts` so the buyer
 * sees a consistent Caelinus mailbox.
 */

import "server-only";

type Locale = "tr" | "en";

type OrderShippedInput = {
  buyerName: string;
  atelierName: string;
  atelierSlug: string;
  orderId: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  makerNote: string | null;
  locale: Locale;
  siteUrl: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const styles = {
  shell:
    "background:#0a0816;color:#f1ecff;font-family:Georgia,'Cormorant Garamond',serif;padding:24px 18px;line-height:1.65;",
  card:
    "max-width:560px;margin:0 auto;background:linear-gradient(180deg,rgba(40,28,82,0.55) 0%,rgba(12,8,28,0.92) 100%);border:1px solid rgba(255,200,255,0.18);border-radius:6px;padding:36px 32px;",
  eyebrow:
    "color:rgba(255,200,255,0.78);font-size:11px;letter-spacing:0.32em;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;margin:0 0 14px;",
  title:
    "font-size:28px;line-height:1.18;color:#fff;font-weight:500;margin:0 0 20px;letter-spacing:0.01em;",
  body:
    "color:rgba(241,236,255,0.86);font-size:15px;margin:0 0 16px;",
  meta:
    "color:rgba(255,200,255,0.92);font-size:14px;margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.02em;",
  quote:
    "border-left:3px solid rgba(255,150,210,0.55);padding:10px 14px;color:rgba(241,236,255,0.92);background:rgba(255,255,255,0.02);margin:18px 0;font-style:italic;font-size:14.5px;",
  cta:
    "display:inline-block;margin:18px 0 6px;padding:13px 22px;background:linear-gradient(135deg,#ff6ec7 0%,#a76bff 100%);color:#0a0816 !important;font-family:Helvetica,Arial,sans-serif;text-decoration:none;font-weight:600;letter-spacing:0.04em;border-radius:4px;font-size:13.5px;",
  footer:
    "color:rgba(241,236,255,0.5);font-size:12px;margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.06em;",
};

export function orderShippedEmail(input: OrderShippedInput): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    buyerName,
    atelierName,
    atelierSlug,
    orderId,
    trackingNumber,
    trackingCarrier,
    trackingUrl,
    makerNote,
    locale,
    siteUrl,
  } = input;

  const orderUrl = `${siteUrl}/hesap/siparislerim/${orderId}`;
  const atelierUrl = `${siteUrl}/atelier/${atelierSlug}`;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const safeNote = makerNote ? escapeHtml(makerNote).replace(/\n/g, "<br>") : null;

  const trackingLine = (() => {
    if (trackingUrl) {
      const carrierTxt = trackingCarrier ? `${trackingCarrier} · ` : "";
      return `<a href="${trackingUrl}" style="color:#ff9ce3;">${escapeHtml(carrierTxt + (trackingNumber ?? trackingUrl))}</a>`;
    }
    if (trackingNumber || trackingCarrier) {
      return escapeHtml(
        [trackingCarrier, trackingNumber].filter(Boolean).join(" · "),
      );
    }
    return null;
  })();

  if (locale === "en") {
    const subject = `${atelierName} · your order is on its way`;
    const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Atelier</p>
    <h1 style="${styles.title}">Your order is on its way, ${escapeHtml(buyerName)}</h1>
    <p style="${styles.body}"><strong>${escapeHtml(atelierName)}</strong> just handed your order to the courier. It's leaving the bench now.</p>
    <p style="${styles.meta}">Order · #${shortId}</p>
    ${trackingLine ? `<p style="${styles.meta}">Tracking · ${trackingLine}</p>` : ""}
    ${safeNote ? `<div style="${styles.quote}">${safeNote}</div>` : ""}
    <p><a href="${orderUrl}" style="${styles.cta}">View order →</a></p>
    <p style="${styles.body}"><a href="${atelierUrl}" style="color:#ff9ce3;">Return to ${escapeHtml(atelierName)}</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
    const text = [
      `Your order is on its way, ${buyerName}.`,
      ``,
      `"${atelierName}" just handed your order (#${shortId}) to the courier.`,
      ...(trackingNumber || trackingCarrier
        ? [`Tracking: ${[trackingCarrier, trackingNumber].filter(Boolean).join(" · ")}`]
        : []),
      ...(trackingUrl ? [`Track here: ${trackingUrl}`] : []),
      ...(makerNote ? ["", `Note from the maker:`, makerNote] : []),
      ``,
      `View order: ${orderUrl}`,
      ``,
      `— Caelinus`,
    ].join("\n");
    return { subject, html, text };
  }

  const subject = `${atelierName} · siparişin yola çıktı`;
  const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Atelier</p>
    <h1 style="${styles.title}">Siparişin yola çıktı, ${escapeHtml(buyerName)}</h1>
    <p style="${styles.body}"><strong>${escapeHtml(atelierName)}</strong> siparişini kargoya teslim etti. Tezgâhtan ayrıldı.</p>
    <p style="${styles.meta}">Sipariş · #${shortId}</p>
    ${trackingLine ? `<p style="${styles.meta}">Takip · ${trackingLine}</p>` : ""}
    ${safeNote ? `<div style="${styles.quote}">${safeNote}</div>` : ""}
    <p><a href="${orderUrl}" style="${styles.cta}">Siparişi gör →</a></p>
    <p style="${styles.body}"><a href="${atelierUrl}" style="color:#ff9ce3;">${escapeHtml(atelierName)} sayfasına dön</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
  const text = [
    `Siparişin yola çıktı, ${buyerName}.`,
    ``,
    `"${atelierName}" siparişini (#${shortId}) kargoya teslim etti.`,
    ...(trackingNumber || trackingCarrier
      ? [`Takip: ${[trackingCarrier, trackingNumber].filter(Boolean).join(" · ")}`]
      : []),
    ...(trackingUrl ? [`Takip linki: ${trackingUrl}`] : []),
    ...(makerNote ? ["", `Üreticiden not:`, makerNote] : []),
    ``,
    `Siparişi gör: ${orderUrl}`,
    ``,
    `— Caelinus`,
  ].join("\n");
  return { subject, html, text };
}

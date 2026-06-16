/**
 * "Ön siparişin alındı" — yumuşak lansman akışında müşteriye gönderilen
 * onay maili. Gerçek tahsilat yok; mesaj: ekip iletişime geçecek.
 *
 * atelier-decision / order-shipped ile aynı görsel dili paylaşır.
 */

import "server-only";

type Locale = "tr" | "en";

type PreorderLine = { name: string; size?: string; qty: number };

type PreorderReceivedInput = {
  buyerName: string;
  orderId: string;
  items: PreorderLine[];
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
  body: "color:rgba(241,236,255,0.86);font-size:15px;margin:0 0 16px;",
  meta:
    "color:rgba(255,200,255,0.92);font-size:14px;margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.02em;",
  list: "color:rgba(241,236,255,0.86);font-size:14.5px;margin:0 0 16px;padding-left:18px;",
  cta:
    "display:inline-block;margin:18px 0 6px;padding:13px 22px;background:linear-gradient(135deg,#ff6ec7 0%,#a76bff 100%);color:#0a0816 !important;font-family:Helvetica,Arial,sans-serif;text-decoration:none;font-weight:600;letter-spacing:0.04em;border-radius:4px;font-size:13.5px;",
  footer:
    "color:rgba(241,236,255,0.5);font-size:12px;margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.06em;",
};

function lineText(i: PreorderLine): string {
  const sz = i.size ? ` · ${i.size}` : "";
  return `${i.name}${sz} × ${i.qty}`;
}

export function preorderReceivedEmail(input: PreorderReceivedInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { buyerName, orderId, items, locale, siteUrl } = input;
  const shortId = orderId.replace(/^ORD-/, "").slice(0, 12).toUpperCase();
  const shopUrl = `${siteUrl}/universe/shop`;
  const itemsHtml = items
    .map((i) => `<li>${escapeHtml(lineText(i))}</li>`)
    .join("");

  if (locale === "en") {
    const subject = "Caelinus · your pre-order is received";
    const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Pre-order</p>
    <h1 style="${styles.title}">Your frequency is reserved, ${escapeHtml(buyerName)}</h1>
    <p style="${styles.body}">We received your pre-order. <strong>No payment has been taken.</strong> Our team will reach out to you by email to complete the details.</p>
    <p style="${styles.meta}">Pre-order · #${shortId}</p>
    <ul style="${styles.list}">${itemsHtml}</ul>
    <p><a href="${shopUrl}" style="${styles.cta}">Return to the shop →</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
    const text = [
      `Your frequency is reserved, ${buyerName}.`,
      ``,
      `We received your pre-order (#${shortId}). No payment has been taken — our team will reach out by email.`,
      ``,
      `Items:`,
      ...items.map((i) => `· ${lineText(i)}`),
      ``,
      `Shop: ${shopUrl}`,
      ``,
      `— Caelinus`,
    ].join("\n");
    return { subject, html, text };
  }

  const subject = "Caelinus · ön siparişin alındı";
  const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Ön Sipariş</p>
    <h1 style="${styles.title}">Frekansın ayrıldı, ${escapeHtml(buyerName)}</h1>
    <p style="${styles.body}">Ön siparişini aldık. <strong>Herhangi bir ödeme alınmadı.</strong> Ekibimiz detayları tamamlamak için e-posta ile seninle iletişime geçecek.</p>
    <p style="${styles.meta}">Ön sipariş · #${shortId}</p>
    <ul style="${styles.list}">${itemsHtml}</ul>
    <p><a href="${shopUrl}" style="${styles.cta}">Mağazaya dön →</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
  const text = [
    `Frekansın ayrıldı, ${buyerName}.`,
    ``,
    `Ön siparişini aldık (#${shortId}). Herhangi bir ödeme alınmadı — ekibimiz e-posta ile ulaşacak.`,
    ``,
    `Ürünler:`,
    ...items.map((i) => `· ${lineText(i)}`),
    ``,
    `Mağaza: ${shopUrl}`,
    ``,
    `— Caelinus`,
  ].join("\n");
  return { subject, html, text };
}

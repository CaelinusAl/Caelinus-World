/**
 * Email templates for atelier moderation decisions.
 *
 * Two templates:
 *
 *   • atelierApprovedEmail({ name, slug, locale, siteUrl })
 *     — sent right after the admin clicks "Onayla". Welcomes the maker,
 *     shows their public link, points at /atelier/<slug>/duzenle.
 *
 *   • atelierRejectedEmail({ name, reason, slug, locale, siteUrl })
 *     — sent right after "Geri gönder". Repeats the moderator's note
 *     verbatim and links to the edit screen so the maker can revise.
 *
 * Templates render both HTML (for normal mail clients) and a plain-text
 * fallback. They keep the visual language minimal — Caelinus voice,
 * dark gradient banner, single primary link. We avoid loading remote
 * fonts; mail clients ignore them anyway.
 */

import "server-only";

type Locale = "tr" | "en";

type ApprovedInput = {
  name: string;
  slug: string;
  atelierName: string;
  locale: Locale;
  siteUrl: string;
};

type RejectedInput = ApprovedInput & {
  reason: string;
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
    "font-size:30px;line-height:1.18;color:#fff;font-weight:500;margin:0 0 22px;letter-spacing:0.01em;",
  body:
    "color:rgba(241,236,255,0.86);font-size:15px;margin:0 0 16px;",
  quote:
    "border-left:3px solid rgba(255,150,210,0.55);padding:10px 14px;color:rgba(241,236,255,0.92);background:rgba(255,255,255,0.02);margin:18px 0;font-style:italic;font-size:14.5px;",
  cta:
    "display:inline-block;margin:18px 0 6px;padding:13px 22px;background:linear-gradient(135deg,#ff6ec7 0%,#a76bff 100%);color:#0a0816 !important;font-family:Helvetica,Arial,sans-serif;text-decoration:none;font-weight:600;letter-spacing:0.04em;border-radius:4px;font-size:13.5px;",
  footer:
    "color:rgba(241,236,255,0.5);font-size:12px;margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.06em;",
};

/* ─── Approved ─────────────────────────────────────────────────── */

export function atelierApprovedEmail(input: ApprovedInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, slug, atelierName, locale, siteUrl } = input;
  const editUrl = `${siteUrl}/atelier/${slug}/duzenle`;
  const publicUrl = `${siteUrl}/atelier/${slug}`;

  if (locale === "en") {
    const subject = `${atelierName} · your atelier is open on Caelinus`;
    const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Atelier</p>
    <h1 style="${styles.title}">Welcome to the bench, ${escapeHtml(name)}</h1>
    <p style="${styles.body}">We've reviewed <strong>${escapeHtml(atelierName)}</strong> and opened it to the universe. Your atelier is live and visitors can find you at:</p>
    <p style="${styles.body}"><a href="${publicUrl}" style="color:#ff9ce3;">${publicUrl}</a></p>
    <p style="${styles.body}">Drop new pieces into your collection any time — every change shows on your public stage in seconds.</p>
    <p><a href="${editUrl}" style="${styles.cta}">Open my bench →</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
    const text = [
      `Welcome to the bench, ${name}.`,
      ``,
      `We've reviewed "${atelierName}" and opened it to the universe. Your atelier is live at ${publicUrl}.`,
      ``,
      `Open your bench: ${editUrl}`,
      ``,
      `— Caelinus`,
    ].join("\n");
    return { subject, html, text };
  }

  const subject = `${atelierName} · atölyen Caelinus'ta açıldı`;
  const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Atelier</p>
    <h1 style="${styles.title}">Tezgâha hoş geldin, ${escapeHtml(name)}</h1>
    <p style="${styles.body}"><strong>${escapeHtml(atelierName)}</strong>'i inceledik ve evrene açtık. Atölyen artık şuradan görünüyor:</p>
    <p style="${styles.body}"><a href="${publicUrl}" style="color:#ff9ce3;">${publicUrl}</a></p>
    <p style="${styles.body}">İstediğin zaman koleksiyonuna yeni parçalar ekleyebilirsin — her değişiklik saniyeler içinde sahnene yansır.</p>
    <p><a href="${editUrl}" style="${styles.cta}">Tezgâhımı aç →</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
  const text = [
    `Tezgâha hoş geldin, ${name}.`,
    ``,
    `"${atelierName}" başvurunu inceledik ve evrene açtık. Atölyen artık ${publicUrl} adresinde görünüyor.`,
    ``,
    `Tezgâhını aç: ${editUrl}`,
    ``,
    `— Caelinus`,
  ].join("\n");
  return { subject, html, text };
}

/* ─── Rejected ─────────────────────────────────────────────────── */

export function atelierRejectedEmail(input: RejectedInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, slug, atelierName, reason, locale, siteUrl } = input;
  const editUrl = `${siteUrl}/atelier/${slug}/duzenle`;
  const safeReason = escapeHtml(reason).replace(/\n/g, "<br>");

  if (locale === "en") {
    const subject = `${atelierName} · we'd like a few revisions`;
    const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Atelier</p>
    <h1 style="${styles.title}">A note on ${escapeHtml(atelierName)}</h1>
    <p style="${styles.body}">Hi ${escapeHtml(name)} — thanks for the application. We've taken a careful look and we'd like a few revisions before opening the atelier to the universe.</p>
    <div style="${styles.quote}">${safeReason}</div>
    <p style="${styles.body}">Open your bench, fold the notes in, and re-submit when you're ready. We'll review again right away.</p>
    <p><a href="${editUrl}" style="${styles.cta}">Open my bench →</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
    const text = [
      `Hi ${name},`,
      ``,
      `Thanks for the "${atelierName}" application. We'd like a few revisions before opening it to the universe.`,
      ``,
      `Notes from us:`,
      reason,
      ``,
      `Open your bench: ${editUrl}`,
      ``,
      `— Caelinus`,
    ].join("\n");
    return { subject, html, text };
  }

  const subject = `${atelierName} · birkaç düzenleme bekliyoruz`;
  const html = `
<div style="${styles.shell}">
  <div style="${styles.card}">
    <p style="${styles.eyebrow}">Caelinus · Atelier</p>
    <h1 style="${styles.title}">${escapeHtml(atelierName)} hakkında</h1>
    <p style="${styles.body}">Merhaba ${escapeHtml(name)} — başvuru için teşekkürler. Dikkatle inceledik ve atölyeyi evrene açmadan önce birkaç noktayı birlikte revize etmek istiyoruz.</p>
    <div style="${styles.quote}">${safeReason}</div>
    <p style="${styles.body}">Tezgâhını açıp notları işle, hazır olduğunda yeniden yolla. Hızlıca tekrar bakarız.</p>
    <p><a href="${editUrl}" style="${styles.cta}">Tezgâhımı aç →</a></p>
    <p style="${styles.footer}">— Caelinus</p>
  </div>
</div>`;
  const text = [
    `Merhaba ${name},`,
    ``,
    `"${atelierName}" başvurusu için teşekkürler. Atölyeyi evrene açmadan önce birkaç noktayı birlikte revize etmek istiyoruz.`,
    ``,
    `Notlarımız:`,
    reason,
    ``,
    `Tezgâhını aç: ${editUrl}`,
    ``,
    `— Caelinus`,
  ].join("\n");
  return { subject, html, text };
}

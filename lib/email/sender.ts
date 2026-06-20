/**
 * Caelinus — transactional email sender.
 *
 * Single entry point: `sendEmail({ to, subject, html, text })`.
 *
 * Sağlayıcı önceliği:
 * • SMTP (Titan vb.) tanımlıysa (SMTP_HOST + SMTP_USER + SMTP_PASS) →
 *   nodemailer ile gerçek posta kutusundan gönderir (yanıtlar kutuya düşer).
 * • Değilse `RESEND_API_KEY` varsa → https://api.resend.com/emails.
 * • Hiçbiri yoksa → yapılandırılmış console log (dev/CI patlamasın).
 *
 * Best-effort: returns `{ ok, error? }` instead of throwing. Callers
 * that depend on user-visible side-effects should NOT bubble errors —
 * a failed approval mail must not roll back an approval decision.
 */

import "server-only";

import { clientEnv, serverEnv } from "@/lib/env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback for clients that strip HTML. Optional. */
  text?: string;
  /** Override default From. Should be `"Caelinus <hello@mail.caelinus.world>"`. */
  from?: string;
  /** Reply-to overrides — handy for "operator + user" chains. */
  replyTo?: string;
  /** Where the user should land after clicking the CTA. Helps templates
   *  that need a base URL (e.g. /atelier/<slug>/duzenle). */
  siteUrl?: string;
};

type Provider = "smtp" | "resend" | "console";

export type SendEmailResult =
  | { ok: true; provider: Provider; id?: string }
  | { ok: false; provider: Provider; error: string };

const FALLBACK_FROM = "Caelinus <onboarding@resend.dev>";

export function getDefaultFrom(): string {
  if (serverEnv.EMAIL_FROM) return serverEnv.EMAIL_FROM;
  // Titan SMTP: From, kimlik doğrulanan kutuyla aynı olmalı.
  if (serverEnv.SMTP_USER) return `Caelinus <${serverEnv.SMTP_USER}>`;
  return FALLBACK_FROM;
}

export function getSiteUrl(): string {
  return clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

async function sendViaSmtp(
  input: SendEmailInput,
  from: string,
): Promise<SendEmailResult> {
  try {
    const { default: nodemailer } = await import("nodemailer");
    const port = serverEnv.SMTP_PORT ?? 465;
    const secure = serverEnv.SMTP_SECURE ?? port === 465;
    const transport = nodemailer.createTransport({
      host: serverEnv.SMTP_HOST,
      port,
      secure,
      auth: { user: serverEnv.SMTP_USER, pass: serverEnv.SMTP_PASS },
    });
    const info = await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { ok: true, provider: "smtp", id: info.messageId };
  } catch (err) {
    return {
      ok: false,
      provider: "smtp",
      error: err instanceof Error ? err.message : "SMTP send failed",
    };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = serverEnv.RESEND_API_KEY;
  const from = input.from || getDefaultFrom();

  // 1) SMTP (Titan vb.) tam yapılandırılmışsa onu kullan.
  if (serverEnv.SMTP_HOST && serverEnv.SMTP_USER && serverEnv.SMTP_PASS) {
    return sendViaSmtp(input, from);
  }

  if (!key) {
    // Dev / CI fallback: log the mail body so a developer can copy it
    // out of the terminal without needing a real mailbox.
    if (typeof console !== "undefined") {
      console.info(
        "[email.sender] (no RESEND_API_KEY) would have sent",
        JSON.stringify(
          {
            to: input.to,
            from,
            subject: input.subject,
            text: input.text?.slice(0, 1000),
          },
          null,
          2,
        ),
      );
    }
    return { ok: true, provider: "console" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return {
        ok: false,
        provider: "resend",
        error: `Resend ${res.status}: ${txt.slice(0, 200)}`,
      };
    }
    const j = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, provider: "resend", id: j?.id };
  } catch (err) {
    return {
      ok: false,
      provider: "resend",
      error: err instanceof Error ? err.message : "Resend request failed",
    };
  }
}

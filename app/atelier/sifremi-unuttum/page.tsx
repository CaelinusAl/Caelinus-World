"use client";

import Link from "next/link";
import { useState } from "react";

import AuthShell from "../_components/AuthShell";
import { clientEnv, supabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLangStore } from "@/stores/lang-store";

const T = {
  title:    { tr: "Parolanı Unuttun mu?", en: "Forgot Your Password?" },
  subtitle: {
    tr: "E-postanı bırak, yeni bir parola bağlantısı yola çıksın.",
    en: "Leave your email and a fresh password link will set off.",
  },
  email:    { tr: "E-posta", en: "Email" },
  submit:   { tr: "Bağlantı gönder", en: "Send link" },
  submitting: { tr: "Gönderiliyor…", en: "Sending…" },
  back:     { tr: "Girişe dön", en: "Back to sign-in" },
  sent: {
    tr: "Bağlantı yola çıktı. Gelmediyse spam'e bak.",
    en: "Link is on its way. If it isn't there, peek into spam.",
  },
  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış.",
    en: "Supabase environment isn't wired up yet.",
  },
} as const;

export default function SifremiUnuttumPage() {
  const { lang, hydrated } = useLangStore();
  const L = hydrated ? lang : "tr";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const configured = supabaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return setError(T.notConfigured[L]);
    setSubmitting(true);
    setError(null);
    setInfo(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/atelier/sifre-yenile`,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(T.sent[L]);
  }

  return (
    <AuthShell title={T.title} subtitle={T.subtitle}>
      {error ? <div className="atelier-alert is-error">{error}</div> : null}
      {info ? <div className="atelier-alert is-info">{info}</div> : null}
      {!configured ? (
        <div className="atelier-alert is-warn">{T.notConfigured[L]}</div>
      ) : null}

      <form className="atelier-form" onSubmit={onSubmit}>
        <label className="atelier-field">
          <span className="atelier-field-label">{T.email[L]}</span>
          <input
            className="atelier-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@caelinus.world"
          />
        </label>

        <button
          type="submit"
          className="atelier-btn atelier-btn-primary"
          disabled={submitting}
        >
          {submitting ? T.submitting[L] : T.submit[L]}
        </button>
      </form>

      <p className="atelier-auth-foot-cta">
        <Link href="/atelier/giris" className="atelier-link is-strong">
          ← {T.back[L]}
        </Link>
      </p>
    </AuthShell>
  );
}

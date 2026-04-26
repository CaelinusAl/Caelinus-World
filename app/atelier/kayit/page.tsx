"use client";

import Link from "next/link";
import { useState } from "react";

import AuthShell from "../_components/AuthShell";
import { clientEnv, supabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLangStore } from "@/stores/lang-store";

const T = {
  title:    { tr: "Atelier Hesabı Aç", en: "Open an Atelier Account" },
  subtitle: {
    tr: "Üreticisin, tasarımcısın, çiftçisin, şefsin — toprağına bağlı olan herkesin yeri burada.",
    en: "If you make, grow, design, cook — anyone tied to the soil belongs here.",
  },
  email:    { tr: "E-posta", en: "Email" },
  password: { tr: "Parola (en az 8 karakter)", en: "Password (min 8 chars)" },
  display:  { tr: "Görünür ad (opsiyonel)", en: "Display name (optional)" },
  submit:   { tr: "Hesabı oluştur", en: "Create account" },
  submitting: { tr: "Oluşturuluyor…", en: "Creating…" },
  hasAccount: {
    tr: "Zaten hesabın var mı? ",
    en: "Already have an account? ",
  },
  signin:   { tr: "Giriş yap", en: "Sign in" },
  emailSent: {
    tr: "Onay e-postası gönderildi. Kutunu kontrol et — bağlantıya tıkladıktan sonra geri dön.",
    en: "Confirmation email sent. Check your inbox — return here after clicking the link.",
  },
  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış. .env.local'i hazırla, sonra tekrar dene.",
    en: "Supabase environment isn't wired up yet. Fill .env.local and try again.",
  },
  consent: {
    tr: "Kayıt olarak Caelinus ahdine ve gizlilik notuna katılmış olursun.",
    en: "By signing up you agree to Caelinus' covenant and privacy note.",
  },
} as const;

export default function KayitPage() {
  const { lang, hydrated } = useLangStore();
  const L = hydrated ? lang : "tr";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: displayName ? { display_name: displayName } : undefined,
        emailRedirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/atelier/dashboard`,
      },
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(T.emailSent[L]);
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
          <span className="atelier-field-label">{T.display[L]}</span>
          <input
            className="atelier-input"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        </label>

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

        <label className="atelier-field">
          <span className="atelier-field-label">{T.password[L]}</span>
          <input
            className="atelier-input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="atelier-btn atelier-btn-primary"
          disabled={submitting}
        >
          {submitting ? T.submitting[L] : T.submit[L]}
        </button>

        <p className="atelier-fineprint">{T.consent[L]}</p>
      </form>

      <p className="atelier-auth-foot-cta">
        {T.hasAccount[L]}
        <Link href="/atelier/giris" className="atelier-link is-strong">
          {T.signin[L]}
        </Link>
      </p>
    </AuthShell>
  );
}

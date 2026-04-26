"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import AuthShell from "../_components/AuthShell";
import { clientEnv, supabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLangStore } from "@/stores/lang-store";

type Mode = "password" | "magic";

const T = {
  title:    { tr: "Atelier'e Giriş", en: "Atelier Sign In" },
  subtitle: {
    tr: "Tezgâhının ışığını yak. Üretim defterine geri dön.",
    en: "Light your bench. Return to the maker's ledger.",
  },
  footer:   {
    tr: "Henüz bir atelier'in yok mu? ",
    en: "No atelier yet? ",
  },
  ctaSignup: { tr: "Başvurunu başlat", en: "Begin your application" },
  email:    { tr: "E-posta", en: "Email" },
  password: { tr: "Parola", en: "Password" },
  signIn:   { tr: "Giriş yap", en: "Sign in" },
  magicCta: { tr: "Sihirli bağlantı gönder", en: "Send magic link" },
  switchToMagic:    { tr: "Parolasız giriş", en: "Passwordless sign-in" },
  switchToPassword: { tr: "Parola ile giriş", en: "Password sign-in" },
  forgot:   { tr: "Parolanı mı unuttun?", en: "Forgot your password?" },
  sending:  { tr: "Gönderiliyor…", en: "Sending…" },
  signing:  { tr: "Giriliyor…", en: "Signing in…" },
  magicSent: {
    tr: "Bağlantı yola çıktı. E-posta kutunu kontrol et — gelmediyse spam'e bak.",
    en: "Link is on its way. Check your inbox — if it isn't there, peek into spam.",
  },
  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış. .env.local'i hazırla, sonra tekrar dene.",
    en: "Supabase environment isn't wired up yet. Fill .env.local and try again.",
  },
} as const;

const ERROR_TR: Record<string, string> = {
  invalid_credentials: "E-posta ya da parola eşleşmedi.",
  email_not_confirmed: "E-postanı henüz onaylamamışsın. Onay e-postasını kontrol et.",
  missing_code: "Giriş bağlantısı geçersizdi. Yeniden dene.",
};

function translateError(msg: string, lang: "tr" | "en"): string {
  if (!msg) return "";
  if (lang === "en") return msg;
  for (const key of Object.keys(ERROR_TR)) {
    if (msg.toLowerCase().includes(key.replace("_", " "))) return ERROR_TR[key];
  }
  return msg;
}

export default function GirisPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/atelier/dashboard";

  const { lang, hydrated } = useLangStore();
  const L = hydrated ? lang : "tr";

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configured = supabaseConfigured();

  useEffect(() => {
    const incoming = params.get("error");
    if (incoming) setError(decodeURIComponent(incoming));
  }, [params]);

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return setError(T.notConfigured[L]);
    setSubmitting(true);
    setError(null);
    setInfo(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(translateError(error.message, L));
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function onMagic(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return setError(T.notConfigured[L]);
    setSubmitting(true);
    setError(null);
    setInfo(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSubmitting(false);
    if (error) {
      setError(translateError(error.message, L));
      return;
    }
    setInfo(T.magicSent[L]);
  }

  return (
    <AuthShell
      title={T.title}
      subtitle={T.subtitle}
      footer={T.footer}
    >
      {error ? <div className="atelier-alert is-error">{error}</div> : null}
      {info ? <div className="atelier-alert is-info">{info}</div> : null}
      {!configured ? (
        <div className="atelier-alert is-warn">{T.notConfigured[L]}</div>
      ) : null}

      <form
        className="atelier-form"
        onSubmit={mode === "password" ? onPassword : onMagic}
      >
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

        {mode === "password" ? (
          <label className="atelier-field">
            <span className="atelier-field-label">{T.password[L]}</span>
            <input
              className="atelier-input"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        ) : null}

        <button
          type="submit"
          className="atelier-btn atelier-btn-primary"
          disabled={submitting}
        >
          {submitting
            ? mode === "password"
              ? T.signing[L]
              : T.sending[L]
            : mode === "password"
              ? T.signIn[L]
              : T.magicCta[L]}
        </button>

        <div className="atelier-form-meta">
          <button
            type="button"
            className="atelier-link"
            onClick={() => {
              setMode(mode === "password" ? "magic" : "password");
              setError(null);
              setInfo(null);
            }}
          >
            {mode === "password" ? T.switchToMagic[L] : T.switchToPassword[L]}
          </button>
          {mode === "password" ? (
            <Link href="/atelier/sifremi-unuttum" className="atelier-link">
              {T.forgot[L]}
            </Link>
          ) : null}
        </div>
      </form>

      <p className="atelier-auth-foot-cta">
        {T.footer[L]}
        <Link href="/atelier/kayit" className="atelier-link is-strong">
          {T.ctaSignup[L]}
        </Link>
      </p>
    </AuthShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthShell from "../_components/AuthShell";
import { supabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLangStore } from "@/stores/lang-store";

const T = {
  title:    { tr: "Yeni Parola", en: "New Password" },
  subtitle: {
    tr: "Yeni parolanı oluştur. En az 8 karakter — sezgisel olsun.",
    en: "Set your new password. At least 8 characters — let it feel right.",
  },
  password: { tr: "Yeni parola", en: "New password" },
  confirm:  { tr: "Tekrar yaz", en: "Confirm" },
  submit:   { tr: "Parolayı kaydet", en: "Save password" },
  submitting: { tr: "Kaydediliyor…", en: "Saving…" },
  mismatch: { tr: "Parolalar eşleşmiyor.", en: "Passwords do not match." },
  done: { tr: "Tamamlandı. Yönlendiriliyorsun…", en: "Done. Redirecting…" },
  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış.",
    en: "Supabase environment isn't wired up yet.",
  },
} as const;

export default function SifreYenilePage() {
  const router = useRouter();
  const { lang, hydrated } = useLangStore();
  const L = hydrated ? lang : "tr";

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const configured = supabaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return setError(T.notConfigured[L]);
    if (pw !== confirm) return setError(T.mismatch[L]);
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(T.done[L]);
    setTimeout(() => router.push("/atelier/dashboard"), 800);
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
          <span className="atelier-field-label">{T.password[L]}</span>
          <input
            className="atelier-input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </label>

        <label className="atelier-field">
          <span className="atelier-field-label">{T.confirm[L]}</span>
          <input
            className="atelier-input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
    </AuthShell>
  );
}

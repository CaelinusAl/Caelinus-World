"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CinemaCTA, NebulaPortal, StageHero } from "@/app/_stage";
import { supabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProfileRow } from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../atelier/_components/AtelierMatrix";

type Props = {
  profile: ProfileRow;
};

const T = {
  brand: { tr: "Caelinus · Hesap", en: "Caelinus · Account" },
  back: { tr: "← Universe", en: "← Universe" },
  bench: { tr: "Tezgâhım", en: "My bench" },
  myOrders: { tr: "Siparişlerim", en: "My orders" },
  hero: {
    eyebrow: { tr: "Hesabın", en: "Your account" },
    title: { tr: "İmzanı bırak", en: "Leave your signature" },
    lead: {
      tr: "Adının yanında hangi avatarın olsun, hangi dilde gezinmek istersin? Bu sayfada sadece sen değişiklik yapabilirsin.",
      en: "Which avatar sits next to your name, which language do you walk in? Only you can edit this page.",
    },
  },
  sections: {
    identity: { tr: "Kimlik", en: "Identity" },
    preferences: { tr: "Tercihler", en: "Preferences" },
    danger: { tr: "Hesap işlemleri", en: "Account actions" },
  },
  fields: {
    email: { tr: "E-posta", en: "Email" },
    emailHint: {
      tr: "E-posta adresini değiştirmek için Caelinus'a yaz.",
      en: "To change your email, message Caelinus.",
    },
    displayName: { tr: "Görünen ad", en: "Display name" },
    displayNameHint: {
      tr: "Atölye sayfanda ve yorumlarda görünür. Boş bırakırsan e-posta'nın @ önündeki kısmı kullanılır.",
      en: "Shown on your atelier and in comments. Defaults to the part before @ in your email if empty.",
    },
    avatar: { tr: "Avatar URL'si", en: "Avatar URL" },
    avatarHint: {
      tr: "Karelerde dairesel kırpılır. İleride doğrudan yükleme gelecek; şimdilik kendi sunduğun bir görselin URL'sini gir.",
      en: "Cropped to a circle in cards. Direct upload coming later; for now paste a URL you control.",
    },
    locale: { tr: "Dil tercihi", en: "Language preference" },
    localeHint: {
      tr: "TR/EN düğmesi anında değişir; bu seçim Caelinus'un sana gönderdiği e-postaların dilini de belirler.",
      en: "The TR/EN switch changes immediately; this selection also drives the language of emails Caelinus sends you.",
    },
  },
  langOptions: {
    tr: { tr: "Türkçe", en: "Turkish" },
    en: { tr: "İngilizce", en: "English" },
  },
  save: { tr: "Kaydet", en: "Save" },
  saving: { tr: "Kaydediliyor…", en: "Saving…" },
  saved: { tr: "Kaydedildi.", en: "Saved." },
  signout: { tr: "Çıkış yap", en: "Sign out" },
  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış. .env.local'i hazırla, sonra tekrar dene.",
    en: "Supabase environment isn't wired up yet. Fill .env.local and try again.",
  },
  generic: {
    tr: "Bir şey ters gitti. Bir saniye sonra tekrar dene.",
    en: "Something went wrong. Try again in a moment.",
  },
} as const;

export default function AccountBody({ profile }: Props) {
  const router = useRouter();
  const { lang, hydrated, hydrate, setLang, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const configured = supabaseConfigured();

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [locale, setLocale] = useState<"tr" | "en">(profile.locale ?? "tr");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If a profile already declares a locale and the lang store hasn't
  // been touched in this browser yet, sync the store on first load so
  // the rest of the app immediately reflects their choice.
  useEffect(() => {
    if (hydrated && profile.locale && lang !== profile.locale) {
      // Don't overwrite an in-session toggle the user already made;
      // only seed once on mount.
      setLang(profile.locale as "tr" | "en");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  async function onSave() {
    if (!configured) {
      setError(T.notConfigured[L]);
      return;
    }
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const trimmedName = displayName.trim();
      const trimmedAvatar = avatarUrl.trim();
      const update: Partial<ProfileRow> = {
        display_name: trimmedName || null,
        avatar_url: trimmedAvatar || null,
        locale,
      };
      const { error: dbErr } = await supabase
        .from("profiles")
        .update(update as never)
        .eq("id", profile.id);
      if (dbErr) {
        setError(dbErr.message || T.generic[L]);
        return;
      }
      setLang(locale);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : T.generic[L]);
    } finally {
      setSaving(false);
    }
  }

  const initial = (
    displayName?.trim()?.[0] ??
    profile.email?.trim()?.[0] ??
    "✦"
  ).toUpperCase();

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
            {T.myOrders[L]}
          </Link>
          <Link href="/atelier/dashboard" className="atelier-ribbon-btn">
            {T.bench[L]}
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

      <main className="atelier-edit account-shell">
        <StageHero
          tone="cosmic"
          eyebrow={T.hero.eyebrow[L]}
          title={T.hero.title[L]}
          lead={T.hero.lead[L]}
          layout="split"
          portalSlot={
            <NebulaPortal size={200} tone="cosmic">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={
                    displayName?.trim() ||
                    profile.email ||
                    (L === "tr" ? "Avatar" : "Avatar")
                  }
                />
              ) : (
                <span className="account-portal-initial" aria-hidden="true">
                  {initial}
                </span>
              )}
            </NebulaPortal>
          }
        />

        {!configured ? (
          <div className="atelier-alert is-warn">{T.notConfigured[L]}</div>
        ) : null}
        {error ? <div className="atelier-alert is-error">{error}</div> : null}
        {saved ? <div className="atelier-alert is-info">{T.saved[L]}</div> : null}

        <section className="atelier-edit-panel">
          <h2 className="atelier-edit-h2">{T.sections.identity[L]}</h2>

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.email[L]}</span>
            <input
              className="atelier-input"
              type="email"
              value={profile.email ?? ""}
              readOnly
              disabled
            />
            <p className="atelier-field-hint">{T.fields.emailHint[L]}</p>
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">
              {T.fields.displayName[L]}
            </span>
            <input
              className="atelier-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
            />
            <p className="atelier-field-hint">
              {T.fields.displayNameHint[L]}
            </p>
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.avatar[L]}</span>
            <input
              className="atelier-input"
              type="url"
              placeholder="https://"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <p className="atelier-field-hint">{T.fields.avatarHint[L]}</p>
          </label>
        </section>

        <section className="atelier-edit-panel">
          <h2 className="atelier-edit-h2">{T.sections.preferences[L]}</h2>
          <p className="atelier-edit-intro">{T.fields.localeHint[L]}</p>

          <fieldset className="atelier-field atelier-status-field">
            <legend className="atelier-field-label">
              {T.fields.locale[L]}
            </legend>
            <div className="atelier-status-radio-row">
              {(["tr", "en"] as const).map((opt) => (
                <label
                  key={opt}
                  className={
                    "atelier-status-radio" +
                    (locale === opt ? " is-active" : "")
                  }
                >
                  <input
                    type="radio"
                    name="locale"
                    value={opt}
                    checked={locale === opt}
                    onChange={() => setLocale(opt)}
                  />
                  <span>{T.langOptions[opt][L]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <div className="atelier-edit-savebar">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="atelier-btn atelier-btn-ghost"
              disabled={saving}
            >
              {T.signout[L]}
            </button>
          </form>
          <button
            type="button"
            className="atelier-btn atelier-btn-primary"
            onClick={onSave}
            disabled={saving || !configured}
          >
            {saving ? T.saving[L] : T.save[L]}
          </button>
        </div>
      </main>
    </div>
  );
}

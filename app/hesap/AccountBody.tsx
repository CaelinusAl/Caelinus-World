"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { CinemaCTA, NebulaPortal, StageHero } from "@/app/_stage";
import { supabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProfileRow } from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../atelier/_components/AtelierMatrix";

import { deleteAccount, type DeleteAccountResult } from "./_actions/account";

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
    security: { tr: "Güvenlik", en: "Security" },
    preferences: { tr: "Tercihler", en: "Preferences" },
    notifications: { tr: "Bildirimler", en: "Notifications" },
    danger: { tr: "Tehlikeli bölge", en: "Danger zone" },
  },

  fields: {
    email: { tr: "E-posta", en: "Email" },
    emailHint: {
      tr: "Aşağıdaki Güvenlik bölümünden değiştirebilirsin.",
      en: "Change it from the Security section below.",
    },
    displayName: { tr: "Görünen ad", en: "Display name" },
    displayNameHint: {
      tr: "Atölye sayfanda ve yorumlarda görünür. Boş bırakırsan e-posta'nın @ önündeki kısmı kullanılır.",
      en: "Shown on your atelier and in comments. Defaults to the part before @ in your email if empty.",
    },
    avatar: { tr: "Avatar", en: "Avatar" },
    avatarHint: {
      tr: "JPG, PNG veya WebP — en fazla 4 MB. Karelerde dairesel kırpılır.",
      en: "JPG, PNG or WebP — up to 4 MB. Cropped to a circle in cards.",
    },
    avatarUpload: { tr: "Görsel yükle", en: "Upload image" },
    avatarRemove: { tr: "Kaldır", en: "Remove" },
    avatarUploading: { tr: "Yükleniyor…", en: "Uploading…" },
    locale: { tr: "Dil tercihi", en: "Language preference" },
    localeHint: {
      tr: "TR/EN düğmesi anında değişir; bu seçim Caelinus'un sana gönderdiği e-postaların dilini de belirler.",
      en: "The TR/EN switch changes immediately; this selection also drives the language of emails Caelinus sends you.",
    },

    newPassword: { tr: "Yeni şifre", en: "New password" },
    newPasswordConfirm: { tr: "Yeni şifre (tekrar)", en: "Confirm new password" },
    newPasswordHint: {
      tr: "En az 8 karakter. Caelinus şifreni saklarken hash'ler — düz metin tutulmaz.",
      en: "At least 8 characters. Caelinus hashes your password — plain text is never stored.",
    },
    newEmail: { tr: "Yeni e-posta", en: "New email" },
    newEmailHint: {
      tr: "Hem eski hem yeni adrese onay maili gider. İkisini de onaylayana kadar değişiklik aktifleşmez.",
      en: "Confirmation emails go to both old and new addresses. The change is only active once both are confirmed.",
    },
  },

  actions: {
    save: { tr: "Kaydet", en: "Save" },
    saving: { tr: "Kaydediliyor…", en: "Saving…" },
    saved: { tr: "Kaydedildi.", en: "Saved." },
    signout: { tr: "Çıkış yap", en: "Sign out" },
    changePassword: { tr: "Şifreyi güncelle", en: "Update password" },
    changingPassword: { tr: "Güncelleniyor…", en: "Updating…" },
    passwordChanged: { tr: "Şifren güncellendi.", en: "Your password has been updated." },
    changeEmail: { tr: "E-postayı değiştir", en: "Change email" },
    changingEmail: { tr: "Gönderiliyor…", en: "Sending…" },
    emailQueued: {
      tr: "Onay e-postaları yola çıktı. Eski ve yeni kutuna da bak.",
      en: "Confirmation emails have been sent. Check both old and new inboxes.",
    },
    deleteAccount: { tr: "Hesabımı sil", en: "Delete my account" },
    deleting: { tr: "Siliniyor…", en: "Deleting…" },
    confirmDelete: { tr: "Onayla ve sil", en: "Confirm and delete" },
    cancel: { tr: "Vazgeç", en: "Cancel" },
  },

  langOptions: {
    tr: { tr: "Türkçe", en: "Turkish" },
    en: { tr: "İngilizce", en: "English" },
  },

  notifications: {
    orders: { tr: "Sipariş güncellemeleri", en: "Order updates" },
    ordersHint: {
      tr: "Sipariş alındı, kargolandı, teslim edildi gibi olaylar için işlemsel e-posta. Kapatmanı önermeyiz.",
      en: "Transactional email for order received, shipped, delivered. We strongly recommend keeping this on.",
    },
    marketing: { tr: "Caelinus bülteni", en: "Caelinus newsletter" },
    marketingHint: {
      tr: "Yeni atölyeler, sezon hikayeleri, etkinlikler. KVKK kapsamında açık rıza gerektirir; istediğin an kapatabilirsin.",
      en: "New ateliers, seasonal stories, events. Opt-in under GDPR; you can switch this off any time.",
    },
  },

  danger: {
    intro: {
      tr: "Hesabını sildiğinde profilin, atölyelerin ve verilerinin geri alınamaz biçimde silinir. Sipariş geçmişi (alıcı ya da satıcı olarak) anonimleştirilir ama vergisel saklama yükümlülükleri için bir süre kalmaya devam eder.",
      en: "Deleting your account permanently removes your profile, ateliers and data. Order history (as buyer or seller) is anonymized but retained briefly for tax bookkeeping.",
    },
    typeEmail: {
      tr: "Devam etmek için hesap e-postanı yaz",
      en: "Type your account email to continue",
    },
    typeEmailHint: {
      tr: "Bu adımdan sonra geri dönüş yok.",
      en: "There's no going back after this step.",
    },
  },

  errors: {
    notConfigured: {
      tr: "Supabase ortam değişkenleri henüz dolmamış. .env.local'i hazırla, sonra tekrar dene.",
      en: "Supabase environment isn't wired up yet. Fill .env.local and try again.",
    },
    generic: {
      tr: "Bir şey ters gitti. Bir saniye sonra tekrar dene.",
      en: "Something went wrong. Try again in a moment.",
    },
    passwordsMismatch: {
      tr: "İki şifre eşleşmiyor.",
      en: "The two passwords do not match.",
    },
    passwordTooShort: {
      tr: "Şifre en az 8 karakter olmalı.",
      en: "Password must be at least 8 characters.",
    },
    invalidEmail: {
      tr: "Geçerli bir e-posta adresi gir.",
      en: "Enter a valid email address.",
    },
    avatarTooBig: {
      tr: "Görsel 4 MB'dan büyük olamaz.",
      en: "Image cannot exceed 4 MB.",
    },
    avatarBadType: {
      tr: "JPG, PNG, WebP veya AVIF olmalı.",
      en: "Must be JPG, PNG, WebP or AVIF.",
    },
    deleteEmailMismatch: {
      tr: "Yazdığın e-posta hesabınkiyle eşleşmiyor.",
      en: "The email you typed doesn't match your account.",
    },
    deleteHasOrders: {
      tr: "Atölyenin aktif sipariş geçmişi var. Önce destekle iletişime geç (selin@asksanri.com).",
      en: "Your atelier has active order history. Please contact support first (selin@asksanri.com).",
    },
    deleteInternal: {
      tr: "Hesap silinemedi. Birkaç saniye sonra tekrar dene; sorun sürerse destekle iletişime geç.",
      en: "Account could not be deleted. Try again in a moment; if it persists contact support.",
    },
  },
} as const;

const AVATAR_BUCKET = "user-avatars";
const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
const AVATAR_OK_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type Lang = "tr" | "en";

export default function AccountBody({ profile }: Props) {
  const router = useRouter();
  const { lang, hydrated, hydrate, setLang, toggle } = useLangStore();
  const L: Lang = hydrated ? lang : "tr";

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const configured = supabaseConfigured();

  // ─── Identity panel state ─────────────────────────────────────────
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Preferences (locale) ─────────────────────────────────────────
  const [locale, setLocale] = useState<Lang>(profile.locale ?? "tr");

  // ─── Notifications ────────────────────────────────────────────────
  const [notifyOrders, setNotifyOrders] = useState(profile.notify_orders);
  const [notifyMarketing, setNotifyMarketing] = useState(profile.notify_marketing);

  // ─── Identity / preferences save status ───────────────────────────
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Security: password change ────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // ─── Security: email change ───────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailQueued, setEmailQueued] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // ─── Danger zone: delete account ──────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteState, deleteFormAction, deletePending] = useActionState<
    DeleteAccountResult | null,
    FormData
  >(deleteAccount, null);

  // Sync language store with profile preference once.
  useEffect(() => {
    if (hydrated && profile.locale && lang !== profile.locale) {
      setLang(profile.locale as Lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ─── handlers ─────────────────────────────────────────────────────

  async function onSaveProfile() {
    if (!configured) {
      setError(T.errors.notConfigured[L]);
      return;
    }
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const trimmedName = displayName.trim();
      const update: Partial<ProfileRow> = {
        display_name: trimmedName || null,
        avatar_url: avatarUrl.trim() || null,
        locale,
        notify_orders: notifyOrders,
        notify_marketing: notifyMarketing,
        // Stamp consent only when the user actively opts in to
        // marketing; clearing it removes the audit trail too.
        marketing_consent_at: notifyMarketing
          ? profile.marketing_consent_at ?? new Date().toISOString()
          : null,
      };
      const { error: dbErr } = await supabase
        .from("profiles")
        .update(update as never)
        .eq("id", profile.id);
      if (dbErr) {
        setError(dbErr.message || T.errors.generic[L]);
        return;
      }
      setLang(locale);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : T.errors.generic[L]);
    } finally {
      setSaving(false);
    }
  }

  async function onUploadAvatar(file: File) {
    if (!configured) {
      setError(T.errors.notConfigured[L]);
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError(T.errors.avatarTooBig[L]);
      return;
    }
    if (!AVATAR_OK_TYPES.has(file.type)) {
      setError(T.errors.avatarBadType[L]);
      return;
    }
    setError(null);
    setAvatarUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (upErr) {
        setError(upErr.message || T.errors.generic[L]);
        return;
      }
      const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      setAvatarUrl(pub.publicUrl);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : T.errors.generic[L]);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onRemoveAvatar() {
    setAvatarUrl("");
    setSaved(false);
  }

  async function onChangePassword() {
    if (!configured) {
      setPwError(T.errors.notConfigured[L]);
      return;
    }
    if (newPassword.length < 8) {
      setPwError(T.errors.passwordTooShort[L]);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPwError(T.errors.passwordsMismatch[L]);
      return;
    }
    setPwError(null);
    setPwSaved(false);
    setPwSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (authErr) {
        setPwError(authErr.message || T.errors.generic[L]);
        return;
      }
      setNewPassword("");
      setNewPasswordConfirm("");
      setPwSaved(true);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : T.errors.generic[L]);
    } finally {
      setPwSaving(false);
    }
  }

  async function onChangeEmail() {
    if (!configured) {
      setEmailError(T.errors.notConfigured[L]);
      return;
    }
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes("@") || trimmed === profile.email) {
      setEmailError(T.errors.invalidEmail[L]);
      return;
    }
    setEmailError(null);
    setEmailQueued(false);
    setEmailSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authErr } = await supabase.auth.updateUser({ email: trimmed });
      if (authErr) {
        setEmailError(authErr.message || T.errors.generic[L]);
        return;
      }
      setNewEmail("");
      setEmailQueued(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : T.errors.generic[L]);
    } finally {
      setEmailSaving(false);
    }
  }

  // ─── derived ──────────────────────────────────────────────────────

  const initial = (
    displayName?.trim()?.[0] ??
    profile.email?.trim()?.[0] ??
    "✦"
  ).toUpperCase();

  const deleteErrorMessage = (() => {
    if (!deleteState || deleteState.ok) return null;
    switch (deleteState.reason) {
      case "email_mismatch":
        return T.errors.deleteEmailMismatch[L];
      case "has_orders":
        return T.errors.deleteHasOrders[L];
      case "not_signed_in":
        return T.errors.generic[L];
      case "internal":
      default:
        return T.errors.deleteInternal[L];
    }
  })();

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
          <div className="atelier-alert is-warn">{T.errors.notConfigured[L]}</div>
        ) : null}
        {error ? <div className="atelier-alert is-error">{error}</div> : null}
        {saved ? <div className="atelier-alert is-info">{T.actions.saved[L]}</div> : null}

        {/* ─── Identity ────────────────────────────────────────────── */}
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
            <span className="atelier-field-label">{T.fields.displayName[L]}</span>
            <input
              className="atelier-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
            />
            <p className="atelier-field-hint">{T.fields.displayNameHint[L]}</p>
          </label>

          <div className="atelier-field">
            <span className="atelier-field-label">{T.fields.avatar[L]}</span>
            <div className="account-avatar-uploader">
              <div className="account-avatar-preview" aria-hidden="true">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="account-avatar-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="account-avatar-file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadAvatar(f);
                  }}
                  disabled={avatarUploading || !configured}
                />
                <button
                  type="button"
                  className="atelier-btn atelier-btn-ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading || !configured}
                >
                  {avatarUploading
                    ? T.fields.avatarUploading[L]
                    : T.fields.avatarUpload[L]}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    className="atelier-btn atelier-btn-ghost"
                    onClick={onRemoveAvatar}
                    disabled={avatarUploading}
                  >
                    {T.fields.avatarRemove[L]}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="atelier-field-hint">{T.fields.avatarHint[L]}</p>
          </div>
        </section>

        {/* ─── Preferences (locale) ────────────────────────────────── */}
        <section className="atelier-edit-panel">
          <h2 className="atelier-edit-h2">{T.sections.preferences[L]}</h2>
          <p className="atelier-edit-intro">{T.fields.localeHint[L]}</p>

          <fieldset className="atelier-field atelier-status-field">
            <legend className="atelier-field-label">{T.fields.locale[L]}</legend>
            <div className="atelier-status-radio-row">
              {(["tr", "en"] as const).map((opt) => (
                <label
                  key={opt}
                  className={
                    "atelier-status-radio" + (locale === opt ? " is-active" : "")
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

        {/* ─── Notifications ───────────────────────────────────────── */}
        <section className="atelier-edit-panel">
          <h2 className="atelier-edit-h2">{T.sections.notifications[L]}</h2>

          <div className="account-toggle-row">
            <div className="account-toggle-text">
              <span className="account-toggle-title">
                {T.notifications.orders[L]}
              </span>
              <p className="account-toggle-hint">
                {T.notifications.ordersHint[L]}
              </p>
            </div>
            <label className="account-toggle">
              <input
                type="checkbox"
                checked={notifyOrders}
                onChange={(e) => setNotifyOrders(e.target.checked)}
              />
              <span className="account-toggle-track" aria-hidden="true">
                <span className="account-toggle-thumb" />
              </span>
            </label>
          </div>

          <div className="account-toggle-row">
            <div className="account-toggle-text">
              <span className="account-toggle-title">
                {T.notifications.marketing[L]}
              </span>
              <p className="account-toggle-hint">
                {T.notifications.marketingHint[L]}
              </p>
            </div>
            <label className="account-toggle">
              <input
                type="checkbox"
                checked={notifyMarketing}
                onChange={(e) => setNotifyMarketing(e.target.checked)}
              />
              <span className="account-toggle-track" aria-hidden="true">
                <span className="account-toggle-thumb" />
              </span>
            </label>
          </div>
        </section>

        {/* ─── Save bar (identity + prefs + notifications) ────────── */}
        <div className="atelier-edit-savebar">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="atelier-btn atelier-btn-ghost"
              disabled={saving}
            >
              {T.actions.signout[L]}
            </button>
          </form>
          <button
            type="button"
            className="atelier-btn atelier-btn-primary"
            onClick={onSaveProfile}
            disabled={saving || !configured}
          >
            {saving ? T.actions.saving[L] : T.actions.save[L]}
          </button>
        </div>

        {/* ─── Security: password ──────────────────────────────────── */}
        <section className="atelier-edit-panel">
          <h2 className="atelier-edit-h2">{T.sections.security[L]}</h2>

          {pwError ? <div className="atelier-alert is-error">{pwError}</div> : null}
          {pwSaved ? (
            <div className="atelier-alert is-info">{T.actions.passwordChanged[L]}</div>
          ) : null}

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.newPassword[L]}</span>
            <input
              className="atelier-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">
              {T.fields.newPasswordConfirm[L]}
            </span>
            <input
              className="atelier-input"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
            <p className="atelier-field-hint">{T.fields.newPasswordHint[L]}</p>
          </label>

          <div className="atelier-edit-savebar account-inline-savebar">
            <button
              type="button"
              className="atelier-btn atelier-btn-primary"
              onClick={onChangePassword}
              disabled={
                pwSaving ||
                !configured ||
                newPassword.length === 0 ||
                newPasswordConfirm.length === 0
              }
            >
              {pwSaving ? T.actions.changingPassword[L] : T.actions.changePassword[L]}
            </button>
          </div>

          {/* email change */}
          {emailError ? (
            <div className="atelier-alert is-error">{emailError}</div>
          ) : null}
          {emailQueued ? (
            <div className="atelier-alert is-info">{T.actions.emailQueued[L]}</div>
          ) : null}

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.newEmail[L]}</span>
            <input
              className="atelier-input"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={profile.email ?? ""}
              autoComplete="email"
            />
            <p className="atelier-field-hint">{T.fields.newEmailHint[L]}</p>
          </label>

          <div className="atelier-edit-savebar account-inline-savebar">
            <button
              type="button"
              className="atelier-btn atelier-btn-ghost"
              onClick={onChangeEmail}
              disabled={emailSaving || !configured || newEmail.trim().length === 0}
            >
              {emailSaving ? T.actions.changingEmail[L] : T.actions.changeEmail[L]}
            </button>
          </div>
        </section>

        {/* ─── Danger zone ─────────────────────────────────────────── */}
        <section className="atelier-edit-panel account-danger-panel">
          <h2 className="atelier-edit-h2">{T.sections.danger[L]}</h2>
          <p className="atelier-edit-intro">{T.danger.intro[L]}</p>

          {!deleteOpen ? (
            <div className="atelier-edit-savebar account-inline-savebar">
              <button
                type="button"
                className="atelier-btn account-danger-btn"
                onClick={() => setDeleteOpen(true)}
              >
                {T.actions.deleteAccount[L]}
              </button>
            </div>
          ) : (
            <form action={deleteFormAction} className="account-danger-confirm">
              <label className="atelier-field">
                <span className="atelier-field-label">{T.danger.typeEmail[L]}</span>
                <input
                  className="atelier-input"
                  type="email"
                  name="confirmEmail"
                  required
                  autoComplete="off"
                  placeholder={profile.email ?? ""}
                />
                <p className="atelier-field-hint">{T.danger.typeEmailHint[L]}</p>
              </label>

              {deleteErrorMessage ? (
                <div className="atelier-alert is-error">{deleteErrorMessage}</div>
              ) : null}

              <div className="atelier-edit-savebar account-inline-savebar">
                <button
                  type="button"
                  className="atelier-btn atelier-btn-ghost"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deletePending}
                >
                  {T.actions.cancel[L]}
                </button>
                <button
                  type="submit"
                  className="atelier-btn account-danger-btn"
                  disabled={deletePending}
                >
                  {deletePending
                    ? T.actions.deleting[L]
                    : T.actions.confirmDelete[L]}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

// `CinemaCTA` is exported from `_stage` and used elsewhere; importing it
// here keeps the existing module surface untouched. We don't currently
// need it on this page but stripping the import would leave a stray
// stage export reference in the codebase — leaving as-is for now.
void CinemaCTA;

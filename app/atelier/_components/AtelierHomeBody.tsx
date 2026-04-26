"use client";

import Link from "next/link";

import { useLangStore } from "@/stores/lang-store";

type AtelierStatus =
  | "none"
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | null;

interface Props {
  authed: boolean;
  email: string | null;
  atelierStatus: AtelierStatus;
}

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  hero: {
    title: {
      tr: "Üretenlerin Tezgâhı",
      en: "The Maker's Bench",
    },
    lead: {
      tr: "Toprağa, ateşe, ipliğe, tahtaya, otlara dokunan herkes için bir alan. Atelier — tasarımın ve üretimin Caelinus tarafı.",
      en: "A place for anyone whose hands touch soil, fire, thread, wood, herbs. Atelier is the maker's side of Caelinus.",
    },
  },
  ctaApply:    { tr: "Atelier başvurusu yap", en: "Apply to open an atelier" },
  ctaSignin:   { tr: "Giriş yap", en: "Sign in" },
  ctaDashboard:{ tr: "Tezgâhıma git", en: "Go to my bench" },
  pillars: {
    title: { tr: "Atelier ne sunar?", en: "What does Atelier offer?" },
    items: [
      {
        glyph: "❀",
        title: { tr: "Hikâyeli vitrin", en: "A storytelling shopfront" },
        body: {
          tr: "Her üretim bir hikâyeyle yayımlanır — bölgesi, frekansı, mood'u, üretim notu. Toprak Anlatıyor.",
          en: "Every piece ships with a story — its region, frequency, mood, maker's note. The soil tells.",
        },
      },
      {
        glyph: "✦",
        title: { tr: "Frekans hizalı keşif", en: "Frequency-aligned discovery" },
        body: {
          tr: "Caelinus okumaları, kullanıcıyı senin atölyene rastgele değil — uygun ses dalgasında getirir.",
          en: "Caelinus readings bring people to your bench not at random, but at the right resonance.",
        },
      },
      {
        glyph: "✿",
        title: { tr: "Bölgesel hatıra", en: "Regional remembrance" },
        body: {
          tr: "Üretiğini bağladığın bölge, Anadolu Atlas'ında nokta olarak yanar. Toprak unutmaz.",
          en: "The region you tie your craft to lights up as a node on the Anatolia Atlas. Soil remembers.",
        },
      },
    ],
  },
  status: {
    none: {
      title: { tr: "Henüz bir tezgâhın yok", en: "You haven't opened a bench yet" },
      body: {
        tr: "Hesap açıldı. Sıradaki adım: Atelier başvurunu hazırlamak — kim olduğunu, ne ürettiğini, hangi toprağa bağlı olduğunu anlat.",
        en: "Your account is open. Next: prepare your atelier application — tell us who you are, what you craft, which soil you're tied to.",
      },
      cta: { tr: "Başvuruya başla", en: "Start application" },
    },
    draft: {
      title: { tr: "Başvurun taslakta", en: "Your application is in draft" },
      body: {
        tr: "Tezgâhının kapısı henüz kapalı. Dilediğin zaman geri dön, hikâyeni tamamla.",
        en: "Your bench door isn't open yet. Return when ready and finish your story.",
      },
      cta: { tr: "Devam et", en: "Continue" },
    },
    pending: {
      title: { tr: "Başvurun bekliyor", en: "Your application is in review" },
      body: {
        tr: "Caelinus kütüphanesi başvuruna bakıyor. Genelde 2-5 gün içinde haberini alırsın.",
        en: "The Caelinus librarians are reading your application. You'll usually hear back in 2-5 days.",
      },
      cta: { tr: "Başvurumu gör", en: "View my application" },
    },
    approved: {
      title: { tr: "Tezgâhın açık", en: "Your bench is open" },
      body: {
        tr: "Atölyene gir — koleksiyonlarını, parçalarını, hikâyelerini yönet.",
        en: "Step into your atelier — manage your collections, pieces, and stories.",
      },
      cta: { tr: "Atölyeme gir", en: "Enter my atelier" },
    },
    rejected: {
      title: { tr: "Başvuru güncelleme bekliyor", en: "Application needs an update" },
      body: {
        tr: "Caelinus kütüphanesi bir not bıraktı. İçeriği gözden geçirip tekrar gönderebilirsin.",
        en: "The Caelinus librarians left a note. Review and resubmit when you'd like.",
      },
      cta: { tr: "Notları gör", en: "View notes" },
    },
  },
} as const;

export default function AtelierHomeBody({
  authed,
  email,
  atelierStatus,
}: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const statusBlock =
    authed && atelierStatus
      ? T.status[atelierStatus === "rejected" ? "rejected" : atelierStatus]
      : null;

  return (
    <div className="atelier-shell">
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>

        <div className="atelier-ribbon-actions">
          {authed ? (
            <form action="/auth/signout" method="post">
              <button className="atelier-ribbon-btn" type="submit">
                {L === "tr" ? "Çıkış" : "Sign out"}
              </button>
            </form>
          ) : (
            <Link href="/atelier/giris" className="atelier-ribbon-btn">
              {T.ctaSignin[L]}
            </Link>
          )}
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

      <main className="atelier-home">
        <section className="atelier-hero">
          <div className="atelier-hero-glyph" aria-hidden="true">
            ⌖
          </div>
          <h1 className="atelier-hero-title">{T.hero.title[L]}</h1>
          <p className="atelier-hero-lead">{T.hero.lead[L]}</p>

          <div className="atelier-hero-cta">
            {authed ? (
              <Link href="/atelier/dashboard" className="atelier-btn atelier-btn-primary">
                {T.ctaDashboard[L]}
              </Link>
            ) : (
              <>
                <Link href="/atelier/kayit" className="atelier-btn atelier-btn-primary">
                  {T.ctaApply[L]}
                </Link>
                <Link href="/atelier/giris" className="atelier-btn atelier-btn-ghost">
                  {T.ctaSignin[L]}
                </Link>
              </>
            )}
          </div>

          {authed && email ? (
            <p className="atelier-hero-email">{email}</p>
          ) : null}
        </section>

        {statusBlock ? (
          <section className="atelier-status">
            <h2 className="atelier-status-title">{statusBlock.title[L]}</h2>
            <p className="atelier-status-body">{statusBlock.body[L]}</p>
            <Link
              href="/atelier/dashboard"
              className="atelier-btn atelier-btn-ghost"
            >
              {statusBlock.cta[L]} →
            </Link>
          </section>
        ) : null}

        <section className="atelier-pillars">
          <h2 className="atelier-pillars-title">{T.pillars.title[L]}</h2>
          <div className="atelier-pillars-grid">
            {T.pillars.items.map((it) => (
              <article key={it.glyph} className="atelier-pillar">
                <div className="atelier-pillar-glyph" aria-hidden="true">
                  {it.glyph}
                </div>
                <h3 className="atelier-pillar-title">{it.title[L]}</h3>
                <p className="atelier-pillar-body">{it.body[L]}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

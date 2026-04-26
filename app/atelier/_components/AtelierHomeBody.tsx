"use client";

import Link from "next/link";

import {
  CinemaCTA,
  GlowPlatform,
  NebulaPortal,
  StageCard,
  StageHero,
} from "@/app/_stage";
import { KIND_LABELS } from "@/lib/atelier/validation";
import type { AtelierKind, AtelierRow } from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "./AtelierMatrix";

type AtelierStatus =
  | "none"
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | null;

/** A trimmed projection of `AtelierRow` for the featured strip. */
export type FeaturedAtelier = Pick<
  AtelierRow,
  | "slug"
  | "name"
  | "kind"
  | "region"
  | "province"
  | "cover_image_url"
  | "avatar_image_url"
>;

interface Props {
  authed: boolean;
  email: string | null;
  atelierStatus: AtelierStatus;
  featured?: FeaturedAtelier[];
}

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  eyebrow: { tr: "Atelier", en: "Atelier" },
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
        tone: "magenta" as const,
      },
      {
        glyph: "✦",
        title: { tr: "Frekans hizalı keşif", en: "Frequency-aligned discovery" },
        body: {
          tr: "Caelinus okumaları, kullanıcıyı senin atölyene rastgele değil — uygun ses dalgasında getirir.",
          en: "Caelinus readings bring people to your bench not at random, but at the right resonance.",
        },
        tone: "cosmic" as const,
      },
      {
        glyph: "✿",
        title: { tr: "Bölgesel hatıra", en: "Regional remembrance" },
        body: {
          tr: "Üretiğini bağladığın bölge, Anadolu Atlas'ında nokta olarak yanar. Toprak unutmaz.",
          en: "The region you tie your craft to lights up as a node on the Anatolia Atlas. Soil remembers.",
        },
        tone: "gold" as const,
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
  featured: {
    title: { tr: "Açık tezgâhlar", en: "Open benches" },
    sub: {
      tr: "Caelinus kütüphanesinin onayladığı son atölyeler.",
      en: "The most recent ateliers welcomed by the Caelinus librarians.",
    },
    empty: {
      tr: "Henüz açık bir tezgâh yok — ilkini sen aç.",
      en: "No open benches yet — open the first one yourself.",
    },
  },
} as const;

export default function AtelierHomeBody({
  authed,
  email,
  atelierStatus,
  featured = [],
}: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const statusBlock =
    authed && atelierStatus
      ? T.status[atelierStatus === "rejected" ? "rejected" : atelierStatus]
      : null;

  const statusHref =
    atelierStatus === "none" ? "/atelier/basvuru" : "/atelier/dashboard";

  return (
    <div className="atelier-shell">
      {/* Cinematic atmosphere: nebula matrix rain behind everything,
          then the existing radial vignette on top to anchor the eye. */}
      <AtelierMatrix intensity="rich" />
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
        <StageHero
          tone="magenta"
          eyebrow={T.eyebrow[L]}
          title={T.hero.title[L]}
          lead={T.hero.lead[L]}
          portalSlot={
            <NebulaPortal size={200} tone="magenta">
              <span className="atelier-home-portal-glyph" aria-hidden="true">
                ⌖
              </span>
            </NebulaPortal>
          }
          actions={
            authed ? (
              <CinemaCTA
                href="/atelier/dashboard"
                variant="primary"
                tone="magenta"
                trailingGlyph="→"
              >
                {T.ctaDashboard[L]}
              </CinemaCTA>
            ) : (
              <>
                <CinemaCTA
                  href="/atelier/kayit"
                  variant="primary"
                  tone="magenta"
                  trailingGlyph="→"
                >
                  {T.ctaApply[L]}
                </CinemaCTA>
                <CinemaCTA href="/atelier/giris" variant="ghost" tone="magenta">
                  {T.ctaSignin[L]}
                </CinemaCTA>
              </>
            )
          }
        >
          {authed && email ? (
            <p className="atelier-home-email">{email}</p>
          ) : null}
        </StageHero>

        {statusBlock ? (
          <section className="atelier-status">
            <h2 className="atelier-status-title">{statusBlock.title[L]}</h2>
            <p className="atelier-status-body">{statusBlock.body[L]}</p>
            <CinemaCTA
              href={statusHref}
              variant="ghost"
              tone="magenta"
              trailingGlyph="→"
            >
              {statusBlock.cta[L]}
            </CinemaCTA>
          </section>
        ) : null}

        {/* Pillars — stage-card pillars with their own glow platforms. */}
        <section className="atelier-home-section">
          <header className="atelier-home-section-head">
            <h2 className="atelier-home-section-title">
              {T.pillars.title[L]}
            </h2>
          </header>
          <div className="atelier-home-pillars-grid">
            {T.pillars.items.map((item) => (
              <div key={item.glyph} className="atelier-home-pillar-wrap">
                <StageCard
                  as="div"
                  variant="pillar"
                  tone={item.tone}
                  glyph={item.glyph}
                  title={item.title[L]}
                  body={item.body[L]}
                  withPlatform
                />
                <GlowPlatform
                  width={180}
                  tone={item.tone}
                  intensity="soft"
                  className="atelier-home-pillar-platform"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Featured strip — recent approved ateliers. */}
        <section className="atelier-home-section">
          <header className="atelier-home-section-head">
            <h2 className="atelier-home-section-title">
              {T.featured.title[L]}
            </h2>
            <p className="atelier-home-section-sub">{T.featured.sub[L]}</p>
          </header>

          {featured.length > 0 ? (
            <div className="atelier-home-featured-grid">
              {featured.map((a) => (
                <StageCard
                  key={a.slug}
                  as="link"
                  href={`/atelier/${a.slug}`}
                  variant="poster"
                  tone={featuredTone(a.kind)}
                  image={a.cover_image_url}
                  eyebrow={KIND_LABELS[a.kind][L]}
                  title={a.name}
                  meta={
                    a.province ? (
                      <span>{a.province.toUpperCase()}</span>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : (
            <p className="atelier-home-featured-empty">
              {T.featured.empty[L]}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

/** Map atelier kinds to a stage tone. Keeps the showcase visually
 *  varied without us having to hand-pick a colour per atelier. */
function featuredTone(
  kind: AtelierKind,
): "magenta" | "cosmic" | "gold" | "amber" | "teal" {
  switch (kind) {
    case "designer":   return "magenta";
    case "artisan":    return "cosmic";
    case "farmer":     return "teal";
    case "chef":       return "amber";
    case "herbalist":  return "gold";
    case "cooperative":
    case "other":
    default:           return "magenta";
  }
}

"use client";

import Link from "next/link";

import {
  CinemaCTA,
  NebulaPortal,
  StageCard,
  StageHero,
} from "@/app/_stage";
import { KIND_LABELS } from "@/lib/atelier/validation";
import type { AtelierKind, AtelierStatus } from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../_components/AtelierMatrix";

type AtelierRow = {
  id: string;
  slug: string;
  name: string;
  kind: AtelierKind;
  status: AtelierStatus;
  region: string | null;
  province: string | null;
  updated_at: string;
  cover_image_url: string | null;
  avatar_image_url: string | null;
};

interface Props {
  email: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  ateliers: AtelierRow[];
  /** True when the visitor is on CAELINUS_ADMIN_EMAILS — surfaces the
   *  moderation shortcut in the ribbon. */
  isAdmin?: boolean;
}

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  signout: { tr: "Çıkış", en: "Sign out" },
  moderate: { tr: "Moderasyon", en: "Moderation" },
  greetEyebrow: { tr: "Tezgâh", en: "Bench" },
  greet: {
    tr: (name: string) => `Hoş geldin, ${name}`,
    en: (name: string) => `Welcome, ${name}`,
  },
  empty: {
    eyebrow: { tr: "Yeni başlangıç", en: "Fresh start" },
    title: { tr: "Tezgâhın henüz boş", en: "Your bench is still empty" },
    body: {
      tr: "İlk atelier'ini açmak için kısa bir başvuru var: kim olduğunu, ne ürettiğini, hangi toprağa bağlı olduğunu anlat.",
      en: "Opening your first atelier starts with a short application: tell us who you are, what you craft, which soil you're tied to.",
    },
    cta: { tr: "Başvuruyu başlat", en: "Start application" },
  },
  yours: {
    title: { tr: "Tezgâhların", en: "Your benches" },
    cta:   { tr: "Yeni atelier", en: "New atelier" },
  },
  statusLabel: {
    draft:    { tr: "Taslak", en: "Draft" },
    pending:  { tr: "İncelemede", en: "In review" },
    approved: { tr: "Açık", en: "Open" },
    rejected: { tr: "Geri gönderildi", en: "Returned" },
  } as Record<string, { tr: string; en: string }>,
} as const;

function kindToTone(
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

function statusToCardStatus(
  s: AtelierStatus,
): "draft" | "pending" | "approved" | "rejected" {
  return s;
}

export default function DashboardBody({
  email,
  displayName,
  avatarUrl,
  ateliers,
  isAdmin = false,
}: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const name = displayName || (email ? email.split("@")[0] : "—");
  const hasAteliers = ateliers.length > 0;

  return (
    <div className="atelier-shell">
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>

        <div className="atelier-ribbon-actions">
          {isAdmin ? (
            <Link href="/atelier/admin" className="atelier-ribbon-btn">
              {T.moderate[L]}
            </Link>
          ) : null}
          <form action="/auth/signout" method="post">
            <button className="atelier-ribbon-btn" type="submit">
              {T.signout[L]}
            </button>
          </form>
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

      <main className="atelier-dash">
        <StageHero
          layout="split"
          tone="magenta"
          eyebrow={T.greetEyebrow[L]}
          title={T.greet[L](name)}
          lead={email ?? undefined}
          portalSlot={
            <NebulaPortal size={140} tone="magenta">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} />
              ) : (
                <span className="atelier-dash-portal-glyph" aria-hidden="true">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </NebulaPortal>
          }
          actions={
            hasAteliers ? (
              <CinemaCTA
                href="/atelier/basvuru"
                variant="ghost"
                tone="magenta"
                trailingGlyph="+"
              >
                {T.yours.cta[L]}
              </CinemaCTA>
            ) : null
          }
        />

        {hasAteliers ? (
          <section className="atelier-dash-section">
            <header className="atelier-dash-section-head">
              <h2 className="atelier-dash-h2">{T.yours.title[L]}</h2>
            </header>

            <div className="atelier-dash-grid">
              {ateliers.map((a) => {
                const label =
                  T.statusLabel[a.status] ?? { tr: a.status, en: a.status };
                return (
                  <StageCard
                    key={a.id}
                    as="link"
                    href={`/atelier/${a.slug}/duzenle`}
                    variant="poster"
                    tone={kindToTone(a.kind)}
                    image={a.cover_image_url}
                    eyebrow={KIND_LABELS[a.kind][L]}
                    title={a.name}
                    statusLabel={label[L]}
                    status={statusToCardStatus(a.status)}
                    meta={
                      <>
                        {a.region ? (
                          <span>{a.region.toUpperCase()}</span>
                        ) : null}
                        {a.province ? (
                          <span>{a.province.toUpperCase()}</span>
                        ) : null}
                      </>
                    }
                  />
                );
              })}
            </div>
          </section>
        ) : (
          <section className="atelier-dash-empty-stage">
            <StageHero
              layout="vertical"
              tone="magenta"
              eyebrow={T.empty.eyebrow[L]}
              title={T.empty.title[L]}
              lead={T.empty.body[L]}
              actions={
                <CinemaCTA
                  href="/atelier/basvuru"
                  variant="primary"
                  tone="magenta"
                  trailingGlyph="→"
                >
                  {T.empty.cta[L]}
                </CinemaCTA>
              }
            />
          </section>
        )}
      </main>
    </div>
  );
}

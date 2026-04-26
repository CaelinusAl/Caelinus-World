"use client";

import Link from "next/link";

import { useLangStore } from "@/stores/lang-store";

type AtelierRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
  region: string | null;
  province: string | null;
  updated_at: string;
};

interface Props {
  email: string | null;
  displayName: string | null;
  ateliers: AtelierRow[];
}

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  signout: { tr: "Çıkış", en: "Sign out" },
  greet: {
    tr: (name: string) => `Hoş geldin, ${name}`,
    en: (name: string) => `Welcome, ${name}`,
  },
  empty: {
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

export default function DashboardBody({ email, displayName, ateliers }: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const name = displayName || (email ? email.split("@")[0] : "—");
  const hasAteliers = ateliers.length > 0;

  return (
    <div className="atelier-shell">
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>

        <div className="atelier-ribbon-actions">
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
        <section className="atelier-dash-greet">
          <h1 className="atelier-dash-h1">{T.greet[L](name)}</h1>
          {email ? <p className="atelier-dash-sub">{email}</p> : null}
        </section>

        {hasAteliers ? (
          <section className="atelier-dash-section">
            <header className="atelier-dash-section-head">
              <h2 className="atelier-dash-h2">{T.yours.title[L]}</h2>
              <Link
                href="/atelier/basvuru"
                className="atelier-btn atelier-btn-ghost"
              >
                + {T.yours.cta[L]}
              </Link>
            </header>

            <div className="atelier-dash-grid">
              {ateliers.map((a) => {
                const label =
                  T.statusLabel[a.status] ?? { tr: a.status, en: a.status };
                return (
                  <Link
                    key={a.id}
                    href={`/atelier/${a.slug}/duzenle`}
                    className={`atelier-dash-card is-${a.status}`}
                  >
                    <div className="atelier-dash-card-name">{a.name}</div>
                    <div className="atelier-dash-card-meta">
                      <span>{a.kind}</span>
                      {a.region ? <span>· {a.region}</span> : null}
                      {a.province ? <span>· {a.province}</span> : null}
                    </div>
                    <span
                      className={`atelier-dash-card-status status-${a.status}`}
                    >
                      {label[L]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="atelier-dash-empty">
            <h2 className="atelier-dash-h2">{T.empty.title[L]}</h2>
            <p className="atelier-dash-empty-body">{T.empty.body[L]}</p>
            <Link
              href="/atelier/basvuru"
              className="atelier-btn atelier-btn-primary"
            >
              {T.empty.cta[L]} →
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

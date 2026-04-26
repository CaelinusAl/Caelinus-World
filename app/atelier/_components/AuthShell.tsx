"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "./AtelierMatrix";

type Copy = { tr: string; en: string };

interface Props {
  /** Page title shown in the parchment header. */
  title: Copy;
  /** Subtitle / poetic line under the title. */
  subtitle?: Copy;
  /** Footer line at the bottom (legal / "back to garden"). */
  footer?: Copy;
  /** The form / body of the auth page. */
  children: ReactNode;
}

/**
 * Shared chrome for every /atelier/* auth page (giris, kayit, …).
 *
 * Reuses Caelinus' parchment + candlelight palette so auth feels like
 * stepping into the atölye antechamber, not a generic SaaS form.
 */
export default function AuthShell({ title, subtitle, footer, children }: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const safeLang = hydrated ? lang : "tr";

  return (
    <div className="atelier-shell">
      {/* Same nebula language as the rest of /atelier/*, dialled down
          so long forms (login, signup, password reset) stay easy on
          the eyes. */}
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">Caelinus · Atelier</span>
        </Link>
        <button
          type="button"
          className="atelier-ribbon-lang"
          onClick={toggle}
          aria-label="Toggle language"
        >
          <span className={safeLang === "tr" ? "is-active" : ""}>TR</span>
          <span className="atelier-ribbon-lang-divider">·</span>
          <span className={safeLang === "en" ? "is-active" : ""}>EN</span>
        </button>
      </header>

      <main className="atelier-auth">
        <div className="atelier-auth-card">
          <h1 className="atelier-auth-title">{title[safeLang]}</h1>
          {subtitle ? (
            <p className="atelier-auth-subtitle">{subtitle[safeLang]}</p>
          ) : null}

          <div className="atelier-auth-body">{children}</div>

          {footer ? (
            <p className="atelier-auth-footer">{footer[safeLang]}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

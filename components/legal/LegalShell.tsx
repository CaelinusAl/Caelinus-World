import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_LAST_UPDATED } from "@/lib/company";
import "./legal.css";

type Props = {
  title: string;
  /** Son güncelleme tarihini gizlemek için false geç (örn. iletişim sayfası). */
  showUpdated?: boolean;
  children: ReactNode;
};

export default function LegalShell({ title, showUpdated = true, children }: Props) {
  return (
    <main className="legal-scene">
      <div className="legal-shell">
        <nav className="legal-breadcrumbs" aria-label="Yol">
          <Link href="/">Caelinus</Link>
          <span className="legal-sep">/</span>
          <span>{title}</span>
        </nav>

        <h1 className="legal-title">{title}</h1>
        {showUpdated && (
          <p className="legal-updated">Son güncelleme: {LEGAL_LAST_UPDATED}</p>
        )}

        <div className="legal-prose">{children}</div>
      </div>
    </main>
  );
}

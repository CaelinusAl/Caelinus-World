import type { Metadata } from "next";
import Link from "next/link";

import "./caelinus-ai.css";

export const metadata: Metadata = {
  title: "Caelinus AI — Selfie'den Avatara",
  description:
    "Caelinus'in kendi AI avatar pipeline'ı. Selfie ver, frekansını oku, kendi 3D bedeninde Caelinus ürünlerini dene.",
};

export default function CaelinusAILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cai-shell">
      <div className="cai-shell-bg" aria-hidden="true">
        <div className="cai-shell-bg-grain" />
        <div className="cai-shell-bg-glow" />
      </div>

      <header className="cai-header">
        <Link href="/caelinus-ai/avatar" className="cai-header-mark">
          <span className="cai-header-mark-glyph">✦</span>
          <span className="cai-header-mark-name">CAELINUS AI</span>
        </Link>
        <nav className="cai-header-nav" aria-label="Caelinus AI">
          <Link href="/caelinus-ai/avatar" className="cai-header-link">
            Avatar
          </Link>
          <Link href="/caelinus-ai/try-on" className="cai-header-link">
            Try-on
          </Link>
          <Link href="/universe" className="cai-header-link cai-header-link--ghost">
            Universe
          </Link>
        </nav>
      </header>

      <main className="cai-main">{children}</main>

      <footer className="cai-footer">
        <span className="cai-footer-line">
          ✦ Caelinus AI — frekanslar, atölye, ışık
        </span>
        <span className="cai-footer-tech">
          Provider-pluggable · MediaPipe · React Three Fiber
        </span>
      </footer>
    </div>
  );
}

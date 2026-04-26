"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/"];

export default function Footer() {
  const pathname = usePathname() ?? "/";

  if (HIDDEN_PATHS.includes(pathname)) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="cae-footer" aria-label="Caelinus footer">
      <div className="cae-footer-mark">✦ CAELINUS UNIVERSE ✦</div>
      <p className="cae-footer-whisper">
        Frekansını giy, evrenle dans et. — Wear your frequency, dance with the universe.
      </p>
      <div className="cae-footer-meta">
        <Link href="/manifesto">Manifesto</Link>
        <Link href="/universe/gaia">Gaia</Link>
        <Link href="/universe/shop">Shop</Link>
        <Link href="/designers">Designers</Link>
        <span>© {year} Caelinus</span>
      </div>
    </footer>
  );
}

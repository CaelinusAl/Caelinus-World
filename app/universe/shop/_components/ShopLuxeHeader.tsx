"use client";

/**
 * ShopLuxeHeader — sticky cam navigasyon (lüks).
 *
 * Mevcut mimariyi bozmaz: store'lardan (cart, lang) gerçek veriyle beslenir,
 * var olan route'lara bağlanır. Scroll'da zarifçe küçülür, animasyonlu underline,
 * aktif sayfa göstergesi, sağ aksiyonlar (Ara · Beğeni · Avatar · Çanta · Evren ·
 * Dil · Tema) hizalı.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartCount } from "@/stores/cart-store";
import { useLangStore } from "@/stores/lang-store";

const NAV = [
  { href: "/universe/shop", label: "Bazaar", active: true },
  { href: "/atelier", label: "Atelier", active: false },
  { href: "/manifesto", label: "Manifesto", active: false },
  { href: "/network", label: "Network", active: false },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const PATHS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  heart: "M12 20s-7-4.5-9.5-9A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z",
  user: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bag: "M6 8h12l-1 12H7L6 8ZM9 8V6a3 3 0 0 1 6 0v2",
  sparkle: "M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M18.4 5.6l-4.2 4.2M9.8 14.2l-4.2 4.2",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4.2 4.2l2 2M17.8 17.8l2 2M1 12h3M20 12h3M4.2 19.8l2-2M17.8 6.2l2-2",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
};

export default function ShopLuxeHeader() {
  const count = useCartCount();
  const lang = useLangStore((s) => s.lang);
  const toggleLang = useLangStore((s) => s.toggle);
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hafif tema bayrağı — shop katmanına yansır (kozmetik, kalıcı).
  useEffect(() => {
    const saved =
      typeof window !== "undefined" &&
      window.localStorage.getItem("caelinus-shop-theme") === "light";
    setLight(saved);
    document.documentElement.dataset.shopTheme = saved ? "light" : "dark";
  }, []);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.shopTheme = next ? "light" : "dark";
    try {
      window.localStorage.setItem("caelinus-shop-theme", next ? "light" : "dark");
    } catch {
      /* yok say */
    }
  };

  return (
    <header className={`shoplux-header${scrolled ? " is-scrolled" : ""}`}>
      <Link href="/" className="shoplux-brand" aria-label="Caelinus ana sayfa">
        <span className="bw">CAELINUS</span>
        <span className="bk">Bazaar</span>
      </Link>

      <nav className="shoplux-nav" aria-label="Mağaza navigasyonu">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={n.active ? "is-active" : ""} aria-current={n.active ? "page" : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="shoplux-actions">
        <button type="button" className="slx-icon slx-hide-sm" aria-label="Ara">
          <Icon d={PATHS.search} />
        </button>
        <Link href="/hesap" className="slx-icon slx-hide-sm" aria-label="Beğendiklerim">
          <Icon d={PATHS.heart} />
        </Link>
        <Link href="/avatar" className="slx-icon" aria-label="Avatarım">
          <Icon d={PATHS.user} />
        </Link>
        <Link href="/universe/shop/checkout" className="slx-icon" aria-label={`Çanta (${count} ürün)`}>
          <Icon d={PATHS.bag} />
          {count > 0 && <span className="slx-badge">{count > 9 ? "9+" : count}</span>}
        </Link>
        <Link href="/universe" className="slx-icon slx-hide-sm" aria-label="Evrene dön">
          <Icon d={PATHS.sparkle} />
        </Link>
        <button type="button" className="slx-icon slx-lang" onClick={toggleLang} aria-label="Dili değiştir">
          {lang === "tr" ? "TR" : "EN"}
        </button>
        <button type="button" className="slx-icon" onClick={toggleTheme} aria-label="Temayı değiştir" aria-pressed={light}>
          <Icon d={light ? PATHS.moon : PATHS.sun} />
        </button>
      </div>
    </header>
  );
}

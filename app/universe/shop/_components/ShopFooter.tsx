"use client";

/**
 * ShopFooter — lüks evren footer'ı.
 * Takımyıldız arka planı + bülten + sütunlar (mevcut route'lara bağlı) + sosyal
 * + dil + telif. Bülten yerel başarı durumuyla çalışır (API'yi bozmaz).
 */

import { useState } from "react";
import Link from "next/link";
import { useLangStore } from "@/stores/lang-store";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Evren",
    links: [
      { label: "Evren Meydanı", href: "/universe" },
      { label: "Cosmos", href: "/cosmos" },
      { label: "Deneyim", href: "/experience" },
      { label: "VR", href: "/vr" },
    ],
  },
  {
    title: "Bazaar",
    links: [
      { label: "Koleksiyon", href: "/universe/shop" },
      { label: "Avatar Deneme", href: "/universe/shop/avatar" },
      { label: "Burçlar", href: "/universe/shop/burclar" },
      { label: "Çanta", href: "/universe/shop/checkout" },
    ],
  },
  {
    title: "Topluluk",
    links: [
      { label: "Manifesto", href: "/manifesto" },
      { label: "Tasarımcılar", href: "/designers" },
      { label: "Network", href: "/network" },
      { label: "Katkı", href: "/katki" },
    ],
  },
  {
    title: "Destek",
    links: [
      { label: "İletişim", href: "/iletisim" },
      { label: "Gizlilik", href: "/gizlilik" },
      { label: "Çerez Politikası", href: "/cerez-politikasi" },
      { label: "Arşiv", href: "/archive" },
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", d: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM17.5 6.5h.01" },
  { label: "X", d: "M4 4l16 16M20 4L4 20" },
  { label: "TikTok", d: "M15 4c0 3 2 5 5 5M15 4v9a4 4 0 1 1-4-4" },
];

export default function ShopFooter() {
  const lang = useLangStore((s) => s.lang);
  const toggleLang = useLangStore((s) => s.toggle);
  const [done, setDone] = useState(false);
  const year = new Date().getFullYear();

  return (
    <footer className="shoplux-footer" aria-label="Site altbilgisi">
      <div className="shoplux-constellation" aria-hidden="true" />
      <div className="shoplux-footer-inner">
        <div className="shoplux-footer-top">
          <div className="shoplux-footer-brand">
            <span className="bw">CAELINUS</span>
            <p>
              Frekansın sanatı. Moda, ritüel ve dünyanın yaşayan bir evreni —
              ışığını giy, evrenle dans et.
            </p>
            <form
              className={`shoplux-news${done ? " is-done" : ""}`}
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
            >
              <input
                type="email"
                required
                placeholder="E-posta adresin"
                aria-label="Bülten için e-posta"
              />
              <button type="submit">{done ? "✓ Katıldın" : "Katıl"}</button>
            </form>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} className="shoplux-col" aria-label={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <hr className="shoplux-divider" />

        <div className="shoplux-footer-bottom">
          <div className="shoplux-social" aria-label="Sosyal medya">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href="#"
                className="slx-icon"
                aria-label={s.label}
                onClick={(e) => e.preventDefault()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
            <button type="button" className="slx-icon slx-lang" onClick={toggleLang} aria-label="Dili değiştir">
              {lang === "tr" ? "TR" : "EN"}
            </button>
          </div>

          <span className="copy">© {year} Caelinus · Frekansını Giy</span>

          <div className="legal">
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/cerez-politikasi">Çerezler</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

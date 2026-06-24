"use client";

/**
 * ShopHeader — Caelinus Shop girişi (MIRROR GATE eşiği).
 *
 * İlk girişte kullanıcı NE olduğunu ve içeride NE bulacağını anlamalı:
 *  - net, SEO-dostu bir H1 ("Caelinus Shop")
 *  - tek cümlelik değer önermesi (kozmik moda + 12 burç + AI deneme)
 *  - hızlı yön bulma rozetleri (12 burç · Solfeggio · AI avatar)
 *  - iki açık CTA: "Aynaya Gir" (avatar) ve "Koleksiyonları Gör" (katalog)
 *
 * Şiirsel "ayna" dili korunur ama artık açıklayıcı metnin altında durur;
 * checkout / sepet akışı bozulmadan kalır.
 */

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { cartTotal } from "@/lib/cart-storage";

const HIGHLIGHTS = [
  { icon: "☉", label: "12 Burç Koleksiyonu" },
  { icon: "✶", label: "Solfeggio Frekansları" },
  { icon: "🪞", label: "AI Avatar ile Dene" },
];

/** Katalog/akış bölümüne yumuşak kaydırma — header ayrı bileşen olduğu
 *  için DOM üzerinden hedefe iner. */
function scrollToCatalog() {
  if (typeof document === "undefined") return;
  const target =
    document.querySelector(".shop-guide") ?? document.querySelector(".shop-main");
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ShopHeader() {
  const items = useCartStore((s) => s.items);
  const total = cartTotal(items);

  return (
    <section className="shop-hero mirror-hero">
      <div className="shop-kicker mirror-kicker">CAELINUS · FREKANS MAĞAZASI</div>
      <h1 className="shop-title mirror-title">Caelinus Shop</h1>
      <p className="shop-subtitle mirror-subtitle">
        12 burcun frekansına akort edilmiş kozmik moda. Hikâyesi olan
        parçaları keşfet, AI avatarınla aynada dene, frekansını giy.
      </p>

      <ul className="shop-hero-highlights" aria-label="Caelinus Shop öne çıkanlar">
        {HIGHLIGHTS.map((h) => (
          <li key={h.label} className="shop-hero-highlight">
            <span className="shop-hero-highlight-icon" aria-hidden="true">
              {h.icon}
            </span>
            {h.label}
          </li>
        ))}
      </ul>

      <div className="mirror-cta-row">
        <Link href="/universe/shop/avatar" className="mirror-cta-primary">
          <span className="mirror-cta-glyph" aria-hidden="true">◍</span>
          Aynaya Gir
        </Link>
        <button
          type="button"
          className="mirror-cta-secondary"
          onClick={scrollToCatalog}
        >
          Koleksiyonları Gör ↓
        </button>
        {items.length > 0 && (
          <Link href="/universe/shop/checkout" className="shop-pill mirror-cart-pill">
            🛒 Sepet ({items.length}) — ${total.toFixed(0)}
          </Link>
        )}
      </div>
    </section>
  );
}

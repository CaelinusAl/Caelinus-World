"use client";

/**
 * ShopHeader — MIRROR GATE eşiği.
 *
 * Burası artık "ürün satışı" değil; kullanıcının Caelinus evrenindeki
 * frekans bedenini seçtiği eşik. Kullanıcı kendini yüklemez —
 * Caelinus aynasına yaklaşır.
 *
 * Mod butonları (freq / tryon / live / ai) hâlâ aynı scene-store
 * mantığını sürüyor; yalnızca dili "ayna" ritüeline çevrildi.
 * Checkout / sepet akışı bozulmadan korunur.
 */

import Link from "next/link";
import { useSceneStore, type ShopMode } from "@/stores/scene-store";
import { useCartStore } from "@/stores/cart-store";
import { cartTotal } from "@/lib/cart-storage";

const MODE_BUTTONS: { mode: ShopMode; icon: string; label: string; cls: string }[] = [
  { mode: "tryon", icon: "🪞", label: "Aynada Dene",    cls: "shop-action-btn--tryon" },
  { mode: "freq",  icon: "✶",  label: "Frekansını Giy", cls: "shop-action-btn--freq" },
  { mode: "ai",    icon: "✦",  label: "AI Kombin",      cls: "shop-action-btn--ai" },
  { mode: "live",  icon: "◈",  label: "Bazaar'a Geç",   cls: "shop-action-btn--live" },
];

export default function ShopHeader() {
  const activeMode = useSceneStore((s) => s.activeMode);
  const setMode = useSceneStore((s) => s.setMode);
  const items = useCartStore((s) => s.items);
  const total = cartTotal(items);

  return (
    <section className="shop-hero mirror-hero">
      <div className="shop-kicker mirror-kicker">CAELINUS · MIRROR GATE</div>
      <h1 className="shop-title mirror-title">AVATAR STUDIO</h1>
      <p className="shop-subtitle mirror-subtitle">
        Caelinus aynasında frekans bedenini oluştur.
      </p>
      <p className="mirror-hero-alt">
        Selfie yükle. AI seni Caelinus evreninde avatar bedenine dönüştürsün.
      </p>

      <div className="mirror-cta-row">
        <Link href="/universe/shop/avatar" className="mirror-cta-primary">
          <span className="mirror-cta-glyph" aria-hidden="true">◍</span>
          Aynaya Gir
        </Link>
        {items.length > 0 && (
          <Link href="/universe/shop/checkout" className="shop-pill mirror-cart-pill">
            🛒 Sepet ({items.length}) — ${total.toFixed(0)}
          </Link>
        )}
      </div>

      <div className="shop-hero-pills mirror-modes">
        {MODE_BUTTONS.map((b) => (
          <button
            key={b.mode}
            className={`shop-action-btn ${b.cls} ${activeMode === b.mode ? "active" : ""}`}
            onClick={() => setMode(b.mode)}
          >
            <span className="btn-icon">{b.icon}</span> {b.label}
          </button>
        ))}
      </div>
    </section>
  );
}

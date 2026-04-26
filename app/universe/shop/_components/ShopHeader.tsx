"use client";

import Link from "next/link";
import { useSceneStore, type ShopMode } from "@/stores/scene-store";
import { useCartStore } from "@/stores/cart-store";
import { cartTotal } from "@/lib/cart-storage";

const MODE_BUTTONS: { mode: ShopMode; icon: string; label: string; cls: string }[] = [
  { mode: "ai",    icon: "✦",  label: "AI Kombin",       cls: "shop-action-btn--ai" },
  { mode: "freq",  icon: "🌙", label: "Frekans Moda",    cls: "shop-action-btn--freq" },
  { mode: "tryon", icon: "👗", label: "Virtual Try-On",   cls: "shop-action-btn--tryon" },
  { mode: "live",  icon: "🛒", label: "Canli Alisveris", cls: "shop-action-btn--live" },
];

export default function ShopHeader() {
  const activeMode = useSceneStore((s) => s.activeMode);
  const setMode = useSceneStore((s) => s.setMode);
  const items = useCartStore((s) => s.items);
  const total = cartTotal(items);

  return (
    <section className="shop-hero">
      <div className="shop-kicker">CAELINUS UNIVERSE</div>
      <h1 className="shop-title">FREQUENCY SHOP</h1>
      <p className="shop-subtitle">
        Bu sadece alisveris degil. Kimligini seciyorsun.
      </p>
      <div className="shop-hero-tagline">FREKANSINI GIY · EVRENLE DANS ET</div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12 }}>
        <Link href="/universe/shop/avatar" className="shop-pill" style={{ textDecoration: "none" }}>
          ✨ Avatarini Olustur
        </Link>
        {items.length > 0 && (
          <Link
            href="/universe/shop/checkout"
            className="shop-pill"
            style={{ textDecoration: "none", borderColor: "rgba(110,255,180,0.24)" }}
          >
            🛒 Sepet ({items.length}) — ${total.toFixed(0)}
          </Link>
        )}
      </div>

      <div className="shop-hero-pills">
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

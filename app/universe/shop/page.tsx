"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSceneStore } from "@/stores/scene-store";
import { useCartStore } from "@/stores/cart-store";
import { loadAvatarConfig } from "@/lib/avatar-storage";
import ShopHeader from "./_components/ShopHeader";
import TryOnSection from "./_components/TryOnSection";
import ProductSection from "./_components/ProductSection";
import OutfitBuilder from "./_components/OutfitBuilder";
import AiKombinPanel from "./_components/AiKombinPanel";
import LiveShoppingPanel from "./_components/LiveShoppingPanel";
import FrequencyShelf from "./_components/FrequencyShelf";

export default function ShopPage() {
  const activeMode = useSceneStore((s) => s.activeMode);

  useEffect(() => {
    useCartStore.getState().hydrate();
    loadAvatarConfig();
  }, []);

  return (
    <main className="shop-page">
      {/* BG */}
      <div className="shop-bg" />
      <div className="shop-overlay" />
      <div className="shop-vignette" />

      {/* Rain */}
      <div className="shop-rain">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`shop-beam beam-${i % 6}`}
            style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 1.1}s`, animationDuration: `${7 + i * 0.6}s` }}
          />
        ))}
      </div>

      <div className="shop-shell">
        <ShopHeader />

        <FrequencyShelf />

        <section className="shop-main">
          {/* 1. AVATAR STAGE — Always visible */}
          <TryOnSection />

          {/* 2. VIRTUAL TRY-ON MODE */}
          <div className={`shop-section-panel ${activeMode === "tryon" ? "visible" : ""}`}>
            <ProductSection />
            <OutfitBuilder />
          </div>

          {/* 3. AI KOMBIN MODE */}
          <div className={`shop-section-panel ${activeMode === "ai" ? "visible" : ""}`}>
            <AiKombinPanel />
          </div>

          {/* 4. FREKANS MODA MODE */}
          <div className={`shop-section-panel ${activeMode === "freq" ? "visible" : ""}`}>
            <ProductSection />
          </div>

          {/* 5. CANLI ALISVERIS MODE */}
          <div className={`shop-section-panel ${activeMode === "live" ? "visible" : ""}`}>
            <LiveShoppingPanel />
          </div>
        </section>

        {/* DESIGNERS CTA */}
        <section className="shop-designers-cta">
          <div className="shop-designers-card">
            <h2 className="shop-designers-title">Tasarimci misin?</h2>
            <p className="shop-designers-desc">
              Hikayeli urunlerini Caelinus evreninde sat. AI avatar mankenlerde sergilensin,
              frekans eslesmesiyle dogru musteriye ulassin.
            </p>
            <Link href="/designers" className="shop-designers-btn">
              ✦ Basvuru Yap
            </Link>
          </div>
        </section>

        {/* BOTTOM NAV */}
        <div className="shop-bottom">
          <Link href="/universe" className="shop-back">← Evrene Don</Link>
          <span className="shop-whisper">Frekansini giy, evrenle dans et.</span>
        </div>
      </div>
    </main>
  );
}

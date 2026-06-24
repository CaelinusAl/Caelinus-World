"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSceneStore } from "@/stores/scene-store";
import { useCartStore } from "@/stores/cart-store";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { loadAvatarConfig } from "@/lib/avatar-storage";
import { AVATARS_IN_PRODUCTION } from "@/lib/avatar-bodies";
import { productsExtended } from "@/data/products";
import ShopHeader from "./_components/ShopHeader";
import ShopGuide from "./_components/ShopGuide";
import MirrorGate from "./_components/MirrorGate";
import TryOnSection from "./_components/TryOnSection";
import ProductSection from "./_components/ProductSection";
import OutfitBuilder from "./_components/OutfitBuilder";
import AiKombinPanel from "./_components/AiKombinPanel";
import StylistPanel from "./_components/StylistPanel";
import LiveShoppingPanel from "./_components/LiveShoppingPanel";
import AvatarBadge from "./_components/AvatarBadge";
import "./shop-experience.css";

/**
 * TryOnLauncher — PDP'den (`/universe/shop/urun/<id>`) gelen
 * `?try=<id>` veya `?dress=<id>` parametresini avatara aktarır.
 *
 *   try=<id>   → ürünü TryOn paneline yükler (yan paneli açar, beden seç).
 *   dress=<id> → ürünü doğrudan dressedSlots'a ekler (avatara giydirir).
 *
 * Her iki halde mod `tryon` olur, URL geçmişten temizlenir
 * (replaceState) — sayfa yenilense de aynı ürün ikinci kez tetiklenmez.
 *
 * useSearchParams Next 16'da Suspense gerektirdiği için ShopPage
 * altında kendi sınırı olan ayrı bir bileşen olarak duruyor.
 */
function TryOnLauncher() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tryId = searchParams.get("try");
    const dressId = searchParams.get("dress");
    const targetId = tryId ?? dressId;
    if (!targetId) return;

    const product = productsExtended.find((p) => p.id === targetId);
    if (!product) return;

    useSceneStore.getState().setMode("tryon");
    if (dressId) {
      useWardrobeStore.getState().dressProduct(product);
    } else {
      useWardrobeStore.getState().setTryOnProduct(product);
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("try");
      url.searchParams.delete("dress");
      window.history.replaceState({}, "", url.toString());

      const stage = document.querySelector(".shop-avatar-stage");
      stage?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  return null;
}

export default function ShopPage() {
  const activeMode = useSceneStore((s) => s.activeMode);

  useEffect(() => {
    useCartStore.getState().hydrate();
    loadAvatarConfig();
  }, []);

  return (
    <main className="shop-page mirror-page">
      {/* MIRROR GATE atmosferi — eski shop/merdiven videosu kaldırıldı.
          Karanlık yansıtıcı su zemini, sütun silüetleri, mor ay,
          altın partiküller ve hafif sis. Tamamı CSS katmanı. */}
      <div className="mirror-bg" aria-hidden="true">
        <div className="mirror-moon" />
        <div className="mirror-columns" />
        <div className="mirror-mist" />
        <div className="mirror-particles">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="mirror-particle"
              style={{
                left: `${(i * 7 + 4) % 100}%`,
                animationDelay: `${(i % 7) * 1.3}s`,
                animationDuration: `${9 + (i % 5) * 2}s`,
              }}
            />
          ))}
        </div>
        <div className="mirror-water" />
      </div>

      <Suspense fallback={null}>
        <TryOnLauncher />
      </Suspense>

      <div className="shop-shell mirror-shell">
        {/* MIRROR CONSOLE — aynanın sağ üst kontrol paneli (sticky). */}
        <AvatarBadge />

        <ShopHeader />

        {/* İçeride neler var? — ilk girişte yön bulma rehberi (mod seçici). */}
        <ShopGuide />

        {/* Aynanın kendisi: oval portal + su üstündeki 3 ritüel taşı. */}
        <MirrorGate />

        <section className="shop-main">
          {/* 1. AVATAR STAGE — avatarlar yapımdayken gizli (placeholder gösterilmez) */}
          {!AVATARS_IN_PRODUCTION && <TryOnSection />}

          {/* 2. VIRTUAL TRY-ON MODE */}
          <div className={`shop-section-panel ${activeMode === "tryon" ? "visible" : ""}`}>
            <ProductSection />
            <OutfitBuilder />
          </div>

          {/* 3. AI KOMBIN MODE — Faz 4: catalog-bound stylist + haftalık kombinler */}
          <div className={`shop-section-panel ${activeMode === "ai" ? "visible" : ""}`}>
            <StylistPanel />
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

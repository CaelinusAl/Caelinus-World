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
import TryOnSection from "./_components/TryOnSection";
import ProductSection from "./_components/ProductSection";
import OutfitBuilder from "./_components/OutfitBuilder";
import AiKombinPanel from "./_components/AiKombinPanel";
import StylistPanel from "./_components/StylistPanel";
import LiveShoppingPanel from "./_components/LiveShoppingPanel";
import AvatarBadge from "./_components/AvatarBadge";
import BackgroundVideo from "@/components/media/BackgroundVideo";

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
    <main className="shop-page">
      {/* BG — tüm burçların sahnede yürüdüğü look.mp4 tam sayfa arka plan */}
      <div className="shop-bg" />
      <BackgroundVideo
        className="shop-bg-video"
        src="/play/shop/look.mp4"
        poster="/play/shop/leo-look.jpg"
      />
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

      <Suspense fallback={null}>
        <TryOnLauncher />
      </Suspense>

      <div className="shop-shell">
        <ShopHeader />

        {/* Faz 3.2 — Kullanıcının kayıtlı AI avatarı (yoksa "yarat"
         * daveti) sahnenin üzerinde sticky. Vizyonun "her sayfada
         * benim avatarım" sürekliliği için. */}
        <AvatarBadge />

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

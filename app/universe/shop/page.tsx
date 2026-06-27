"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSceneStore } from "@/stores/scene-store";
import { useCartStore } from "@/stores/cart-store";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { loadAvatarConfig } from "@/lib/avatar-storage";
import { productsExtended } from "@/data/products";
import ShopGuide from "./_components/ShopGuide";
import ProductSection from "./_components/ProductSection";
import AiKombinPanel from "./_components/AiKombinPanel";
import StylistPanel from "./_components/StylistPanel";
import LiveShoppingPanel from "./_components/LiveShoppingPanel";
import BikiniLineup from "./_components/BikiniLineup";
import ShopLuxeHeader from "./_components/ShopLuxeHeader";
import ShopEditorialHero from "./_components/ShopEditorialHero";
import ShopFooter from "./_components/ShopFooter";
import { useReveal } from "./_components/useReveal";
import "./shop-experience.css";
import "./shop-luxe.css";

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
  const mainRef = useRef<HTMLElement>(null);
  useReveal(mainRef);

  useEffect(() => {
    useCartStore.getState().hydrate();
    loadAvatarConfig();
  }, []);

  return (
    <main className="shop-page mirror-page" ref={mainRef}>
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

      {/* LÜKS STICKY CAM HEADER */}
      <ShopLuxeHeader />

      <Suspense fallback={null}>
        <TryOnLauncher />
      </Suspense>

      {/* SİNEMATİK EDİTORYAL HERO */}
      <ShopEditorialHero />

      <div className="shop-shell mirror-shell">
        {/* RUNWAY — sayfa doğrudan 12 mankenin tam-boy, tam-genişlik dizisiyle açılır. */}
        <div className="slx-reveal">
          <BikiniLineup />
        </div>

        {/* İçeride neler var? — Aynaya Gir + AI Kombin + Bazaar & Canlı
            üç mor oval portal. (Eski MirrorGate + ritüel taşları kaldırıldı.) */}
        <div className="slx-reveal">
          <ShopGuide />
        </div>

        <section className="shop-main slx-reveal">
          {/* 1. AVATAR STAGE — 3D avatar şimdilik kaldırıldı, alan boş bırakıldı.
              Geri açmak için: {!AVATARS_IN_PRODUCTION && <TryOnSection />} */}

          {/* 2. VIRTUAL TRY-ON MODE */}
          <div className={`shop-section-panel ${activeMode === "tryon" ? "visible" : ""}`}>
            <ProductSection />
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

        {/* DESIGNERS — editoryal işe alım kampanyası */}
        <section className="shoplux-designer slx-reveal" aria-label="Tasarımcı Programı">
          <div className="shoplux-designer-portrait">
            <span className="cap">Caelinus Atelier · Frekans Evi</span>
          </div>
          <div>
            <p className="shoplux-eyebrow">Tasarımcı Programı</p>
            <h2>Hikâyeni evrene dok.</h2>
            <p>
              Parçaların AI avatar mankenlerde sergilensin, Solfeggio frekansıyla
              doğru ruha ulaşsın. Caelinus, bağımsız tasarımcıları kozmik bir
              vitrine taşır — koleksiyonun bir ritüel olsun.
            </p>
            <ul className="shoplux-timeline">
              <li>Başvur — koleksiyonunu ve frekansını paylaş.</li>
              <li>Küratörlük — Caelinus ekibiyle hikâyeni dok.</li>
              <li>3D Vitrin — parçaların avatarlarda canlansın.</li>
              <li>Sat — evren çapında doğru müşteriye ulaş.</li>
            </ul>
            <Link
              href="/designers"
              className="slx-btn slx-btn-primary"
              style={{ display: "inline-block", marginTop: "26px" }}
            >
              ✦ Başvuru Yap
            </Link>
          </div>
        </section>
      </div>

      {/* LÜKS FOOTER */}
      <ShopFooter />
    </main>
  );
}

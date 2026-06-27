"use client";

/**
 * CaelinusEntryScene — sinematik giriş eşiği (lüks dijital evrene kapı).
 *
 * Kompozisyon her ekranda birebir korunur ve daima 100dvh'ye sığar:
 *   • arka plan (z0): MoonHeroCanvas — prosedürel 3D ay + yıldız alanı + bulutlar
 *     + bloom; ay asla kırpılmaz (görünür alana göre ölçeklenir).
 *   • ön plan (z10): LivingLogo (üst) · başlık + alt başlık + CTA (alt küme).
 *   • eşikten geçiş: ay tık / CTA tık → kamera aya uçar, enerji halkaları,
 *     beyaza fade → /universe.
 *
 * 3D katman next/dynamic ssr:false ile tembel yüklenir (ağır three bundle ilk
 * boyamayı bloklamaz). reduced-motion'da geçiş anında yönlendirir.
 */

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import LivingLogo from "@/components/landing/LivingLogo";
import "@/app/styles/caelinus-entry.css";

const MoonHeroCanvas = dynamic(
  () => import("@/components/landing/hero/MoonHeroCanvas"),
  { ssr: false },
);

export default function CaelinusEntryScene() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const enteringRef = useRef(false);

  const enterUniverse = useCallback(() => {
    if (enteringRef.current) return;
    enteringRef.current = true;

    if (prefersReducedMotion()) {
      router.push("/universe");
      return;
    }

    setEntering(true);
    window.setTimeout(() => router.push("/universe"), 1700);
  }, [router]);

  return (
    <section className={`caelinus-entry${entering ? " is-entering" : ""}`}>
      {/* z0 — yaşayan 3D gökyüzü + ay portalı */}
      <div className="caelinus-canvas-layer" aria-hidden="true">
        <MoonHeroCanvas entering={entering} onEnter={enterUniverse} />
      </div>

      {/* z2 — atmosferik scrim: alt metin için kontrast */}
      <div className="caelinus-scrim" aria-hidden="true" />

      {/* z10 — ön plan içerik */}
      <div className="caelinus-foreground">
        <header className="caelinus-top">
          <LivingLogo />
        </header>

        <div className="caelinus-bottom">
          <h1 className="caelinus-title">Wear Your Frequency</h1>
          <p className="caelinus-subtitle">
            A living universe of fashion, ritual and earth.
          </p>

          <div className="caelinus-cta">
            <button
              type="button"
              className="cta-enter"
              onClick={enterUniverse}
              aria-label="Caelinus evrenine gir"
            >
              <span>Enter When Ready</span>
            </button>
          </div>

          <p className="gate-copy">The gate is open · tap the moon to cross.</p>
        </div>
      </div>

      {/* Geçiş ışık patlaması → beyaza fade */}
      <div className="enter-flash" aria-hidden="true" />
    </section>
  );
}

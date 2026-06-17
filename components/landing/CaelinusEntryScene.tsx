"use client";

/**
 * CaelinusEntryScene — yaşayan eşik (tek-parça görsel DEĞİL; CSS + katman).
 *
 * Sahne tamamen CSS ile kurulur (app/styles/caelinus-entry.css):
 *   • arka plan: deep-black→midnight gradient + sürüklenen yıldızlar + altın toz,
 *   • portal ay: mor-altın aura + sacred-circle halkaları + nefes (CSS),
 *   • ufuk: çizgisel medeniyet + yaşayan kapı (alev ritmi + ışık),
 *   • logo: sahneden doğan SVG kanat + HTML wordmark (LivingLogo),
 *   • CTA: cam eşik butonu; hover'da portal ışığı artar.
 *
 * Eşikten geçiş: tık → .is-entering (ay pulse + kapı açılır) → /universe.
 * Referans görsel yalnızca moodboard; arka plan olarak kullanılmaz.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import LivingLogo from "@/components/landing/LivingLogo";
import "@/app/styles/caelinus-entry.css";

export default function CaelinusEntryScene() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const enteringRef = useRef(false);

  const enterUniverse = () => {
    if (enteringRef.current) return;
    enteringRef.current = true;

    if (prefersReducedMotion()) {
      router.push("/universe");
      return;
    }

    // Eşikten geçiş: portal ay pulse verir + kapı açılır (CSS .is-entering).
    setEntering(true);
    window.setTimeout(() => router.push("/universe"), 1500);
  };

  return (
    <section className={`caelinus-entry${entering ? " is-entering" : ""}`}>
      <div className="caelinus-logo">
        {/* Sahneden doğan SVG sembol — ay-üstü PNG değil. */}
        <LivingLogo />
      </div>

      <h1 className="caelinus-title">Wear Your Frequency</h1>
      <p className="caelinus-subtitle">
        A living universe of fashion, ritual and earth.
      </p>

      <div
        className="portal-moon"
        role="button"
        tabIndex={0}
        aria-label="Caelinus evrenine gir"
        onClick={enterUniverse}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            enterUniverse();
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <img src="/assets/moon.webp" alt="Caelinus living portal" />
      </div>

      <div className="caelinus-horizon" aria-hidden="true">
        <div className="caelinus-gate" />
      </div>

      <p className="gate-copy">The gate is open.</p>

      <div className="caelinus-cta">
        <button type="button" onClick={enterUniverse}>
          Enter When Ready
        </button>
      </div>
    </section>
  );
}

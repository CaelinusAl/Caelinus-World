"use client";

/**
 * ShopEditorialHero — sinematik editoryal giriş.
 * Lüks animasyonlu arka plan + yüzen partiküller + fare paralaksı + editoryal
 * tipografi + birincil/ikincil CTA. CTA'lar mevcut scene-store modlarını
 * tetikler (mimari korunur).
 */

import { useEffect, useMemo, useRef } from "react";
import { useSceneStore } from "@/stores/scene-store";

export default function ShopEditorialHero() {
  const ref = useRef<HTMLElement>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        left: (i * 9 + 5) % 100,
        delay: (i % 6) * 1.4,
        dur: 11 + (i % 5) * 2.4,
        size: 2 + (i % 3),
      })),
    [],
  );

  // Fare paralaksı — arka plan katmanı hafifçe kayar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${nx * 14}px`);
        el.style.setProperty("--py", `${ny * 10}px`);
        raf = 0;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollTo = (selector: string) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openStylist = () => {
    useSceneStore.getState().setMode("ai");
    window.setTimeout(() => scrollTo(".shop-main"), 60);
  };

  return (
    <section className="shoplux-hero" ref={ref} aria-label="Caelinus Bazaar">
      <div
        className="shoplux-hero-bg"
        style={{ transform: "translate3d(var(--px,0), var(--py,0), 0)" }}
        aria-hidden="true"
      />
      <div className="shoplux-hero-grain" aria-hidden="true" />
      <div className="shoplux-particles" aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      <p className="shoplux-hero-kicker">Frekansın Sanatı · 12 Burç Koleksiyonu</p>
      <h1 className="shoplux-hero-title">
        Wear Your <em>Frequency</em>
      </h1>
      <p className="shoplux-hero-story">
        Her parça bir burcun ritmine, bir Solfeggio frekansına ve şiirsel bir
        hikâyeye akort edildi. Kozmik avatarınla aynada dene, ışığını giy —
        evrenle dans et.
      </p>

      <div className="shoplux-hero-ctas">
        <button type="button" className="slx-btn slx-btn-primary" onClick={() => scrollTo(".shop-shell")}>
          Koleksiyonu Keşfet
        </button>
        <button type="button" className="slx-btn slx-btn-ghost" onClick={openStylist}>
          ✦ AI Frekans Stilisti
        </button>
      </div>

      <div className="shoplux-hero-strip">
        <div>
          <span className="n">12</span>
          <span className="l">Burç Koleksiyonu</span>
        </div>
        <div>
          <span className="n">963 Hz</span>
          <span className="l">Solfeggio Akort</span>
        </div>
        <div>
          <span className="n">AI</span>
          <span className="l">Avatar Deneme</span>
        </div>
      </div>
    </section>
  );
}

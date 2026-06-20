"use client";

/**
 * Reveal — scroll ile görünür olunca içeriği yumuşakça belirten sarmalayıcı.
 *
 * Anime.js v4 `onScroll()` ScrollObserver'ını `autoplay` içinde kullanır:
 * element viewport'a girince animasyon bir kez oynar. Site genelinde
 * "canlı/akan" hissi için temel yapı taşı.
 *
 *   <Reveal><h2>Başlık</h2></Reveal>
 *   <Reveal delay={120} y={40}><p>…</p></Reveal>
 *
 * Erişilebilirlik: prefers-reduced-motion açıksa animasyon yok, içerik
 * doğrudan görünür.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { animate, onScroll, utils } from "animejs";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

type Props = {
  children: ReactNode;
  /** Animasyon başlama gecikmesi (ms). */
  delay?: number;
  /** Aşağıdan yukarı kayma miktarı (px). */
  y?: number;
  /** Süre (ms). */
  duration?: number;
  className?: string;
};

export default function Reveal({
  children,
  delay = 0,
  y = 28,
  duration = 900,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      utils.set(el, { opacity: 1, y: 0 });
      return;
    }

    utils.set(el, { opacity: 0, y });
    const anim = animate(el, {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: "out(3)",
      autoplay: onScroll({ target: el, enter: "bottom-=80 top" }),
    });

    return () => {
      anim.revert();
    };
  }, [delay, y, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

"use client";

/**
 * useReveal — IntersectionObserver tabanlı bölüm reveal'ı.
 * `.slx-reveal` taşıyan tüm alt öğeler görünür olunca `.is-in` alır.
 * reduced-motion'da CSS zaten anında gösterir; observer yine de zararsızdır.
 */

import { useEffect } from "react";

export function useReveal(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>(".slx-reveal");
    if (!("IntersectionObserver" in window) || targets.length === 0) {
      targets.forEach((t) => t.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [rootRef]);
}

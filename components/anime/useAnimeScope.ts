"use client";

/**
 * useAnimeScope — Anime.js v4'ü React/Next ile güvenli kullanmanın
 * kanonik yolu (resmi "Using with React" deseni).
 *
 *   const root = useAnimeScope((self) => {
 *     animate(".item", { opacity: [0, 1], delay: stagger(60) });
 *   });
 *   return <div ref={root}>…</div>;
 *
 * • `createScope({ root })` ile tüm animasyonlar bu DOM ağacına scope'lanır.
 * • Unmount'ta `scope.revert()` her şeyi temizler (sızıntı yok).
 * • setup içindeki selector'lar yalnızca root altında eşleşir.
 *
 * Not: reduced-motion guard'ını setup içinde kendin uygula ya da
 * Reveal gibi hazır bileşenleri kullan; bu hook ham scope sağlar.
 */

import { useEffect, useRef } from "react";
import { createScope, type Scope } from "animejs";

export function useAnimeScope<T extends HTMLElement = HTMLDivElement>(
  setup: (self: Scope) => void,
  deps: unknown[] = [],
) {
  const root = useRef<T>(null);
  const scope = useRef<Scope | null>(null);

  useEffect(() => {
    if (!root.current) return;
    scope.current = createScope({ root }).add((self) => {
      if (self) setup(self);
    });
    return () => {
      scope.current?.revert();
      scope.current = null;
    };
    // setup kasıtlı olarak deps dışında — tüketici deps ile kontrol eder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return root;
}

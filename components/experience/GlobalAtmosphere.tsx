"use client";

/**
 * GlobalAtmosphere — tüm sitede "yaşayan ışık" (tek noktadan, global).
 *
 * Layout'a bir kez monte edilir; her sayfaya tek tek eklemeye gerek yoktur.
 * Aktif rotaya göre bir imza rengi seçer (Gaia yeşil, Shop altın, Universe
 * mor…). Fare hareket ettikçe yumuşak ışık o yöne gider; arka plan katmanları
 * için kök öğeye --nx/--ny (parallax) yazar; tıklayınca ışıktan bir dalga
 * yayılır. Sadece atmosferik (karanlık) rotalarda görünür — form/panel
 * sayfaları okunaklı kalsın diye dışarıda bırakılır.
 *
 * Hafif: rAF throttle, pointer-events:none, prefers-reduced-motion'da kapalı.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

type Signature = { color: string; size: number };

/** Rota → imza rengi. Sıralı; ilk eşleşen kazanır. */
const RULES: { match: (p: string) => boolean; sig: Signature }[] = [
  { match: (p) => p.startsWith("/universe/gaia"), sig: { color: "rgba(121, 230, 160, 0.14)", size: 300 } },
  { match: (p) => p.startsWith("/universe/shop"), sig: { color: "rgba(245, 216, 140, 0.14)", size: 300 } },
  { match: (p) => p === "/universe", sig: { color: "rgba(210, 180, 255, 0.14)", size: 320 } },
  { match: (p) => p === "/cosmos", sig: { color: "rgba(127, 227, 255, 0.13)", size: 320 } },
  { match: (p) => p === "/manifesto", sig: { color: "rgba(182, 156, 255, 0.13)", size: 300 } },
  { match: (p) => p === "/archive", sig: { color: "rgba(255, 122, 217, 0.12)", size: 300 } },
  { match: (p) => p === "/atelier", sig: { color: "rgba(255, 122, 217, 0.13)", size: 300 } },
  { match: (p) => p === "/network", sig: { color: "rgba(122, 162, 255, 0.14)", size: 300 } },
  { match: (p) => p === "/", sig: { color: "rgba(245, 216, 140, 0.16)", size: 320 } },
];

function resolve(path: string): Signature | null {
  for (const r of RULES) if (r.match(path)) return r.sig;
  return null;
}

/** rgba(...,a) → aynı renk, dalga için yükseltilmiş alfa. */
function ringColor(rgba: string): string {
  return rgba.replace(/[\d.]+\)\s*$/, "0.55)");
}

function spawnRipple(host: HTMLElement, x: number, y: number, color: string) {
  const r = document.createElement("span");
  r.className = "global-ripple";
  r.style.left = `${x}px`;
  r.style.top = `${y}px`;
  r.style.setProperty("--ripple-color", ringColor(color));
  host.appendChild(r);
  const done = () => r.remove();
  r.addEventListener("animationend", done);
  window.setTimeout(done, 1000);
}

export default function GlobalAtmosphere() {
  const pathname = usePathname() || "/";
  const layerRef = useRef<HTMLDivElement>(null);
  const sig = resolve(pathname);

  useEffect(() => {
    const el = layerRef.current;
    if (!el || !sig) return;
    if (prefersReducedMotion()) {
      el.style.display = "none";
      return;
    }
    el.style.display = "";

    const rootStyle = document.documentElement.style;
    let raf = 0;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight * 0.4;
    let nx = 0;
    let ny = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", `${mx}px`);
      el.style.setProperty("--my", `${my}px`);
      rootStyle.setProperty("--nx", nx.toFixed(3));
      rootStyle.setProperty("--ny", ny.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      nx = (mx / Math.max(1, window.innerWidth)) * 2 - 1;
      ny = (my / Math.max(1, window.innerHeight)) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onDown = (e: PointerEvent) => {
      spawnRipple(el, e.clientX, e.clientY, sig.color);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      if (raf) cancelAnimationFrame(raf);
      rootStyle.removeProperty("--nx");
      rootStyle.removeProperty("--ny");
    };
  }, [sig, pathname]);

  if (!sig) return null;

  return (
    <div
      ref={layerRef}
      className="global-aura"
      aria-hidden="true"
      style={{
        ["--aura-color" as string]: sig.color,
        ["--aura-size" as string]: `${sig.size}px`,
      }}
    />
  );
}

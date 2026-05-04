"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
};

const portals = [
  { label: "Find Your Frequency", href: "/onboarding", symbol: "✦", cls: "gold" },
  // AI Moodboard — Caelinus Stylist'in açılış kapısı (keşif). Kullanıcı
  // bir his yazar (mevsim, renk, hatıra), AI dört editöryel kareyi
  // (atmosfer · doku · figür · nesne) ve beş paragraflık manifesto
  // okumasını üretir. Discovery surface — paletten Shop ürünlerine
  // köprü kurma yolu. (Faz: Caelinus Stylist · AI Moodboard.)
  { label: "AI Moodboard", href: "/universe/moodboard", symbol: "❖", cls: "violet" },
  // 3D Avatar Studio — Caelinus'un primary avatar yolu. Kullanıcı
  // bedenini sliders ile şekillendirir (vücut tipi, boy, kilo, göğüs,
  // ten rengi); opsiyonel olarak selfie yükler ve MediaPipe metrics
  // ile yüz mesh'i deform edilir. Bu avatar Shop'ta 3D ürün try-on'un
  // canvas'ı olur — bone-bound GLB garmentler avatar üzerinde live
  // dener. (Faz 4: 3D Mesh + Bone-Bound Try-On.)
  { label: "3D Avatar Studio", href: "/universe/shop/avatar", symbol: "◉", cls: "magenta" },
  { label: "Gaia's Garden", href: "/universe/gaia", symbol: "✦", cls: "green" },
  { label: "Caelinus Shop", href: "/universe/shop", symbol: "◐", cls: "gold" },
  { label: "Caelinus Play", href: "/play", symbol: "∞", cls: "blue" },
  { label: "Archive / Art", href: "/archive", symbol: "△", cls: "pink" },
  // The "Atelier" portal — formerly "Designers". Same idea (conscious
  // creators), but now wired to the live atelier system. Compass glyph
  // ⌖ matches the Caelinus · Atelier ribbon mark.
  { label: "Atelier", href: "/atelier", symbol: "⌖", cls: "magenta" },
  { label: "Cosmos", href: "/cosmos", symbol: "◌", cls: "cyan" },
  { label: "Manifesto", href: "/manifesto", symbol: "✧", cls: "violet" },
];

export default function UniversePage() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: ((i * 29) % 92) + 4,
        top: ((i * 41) % 82) + 8,
        size: (i % 3) + 10,
        delay: (i % 7) * 0.7,
        duration: 8 + (i % 5) * 2.2,
      })),
    []
  );

  return (
    <main className="cu-scene">
      <div className="cu-bg" />
      <div className="cu-overlay" />
      <div className="cu-nebula cu-nebula-left" />
      <div className="cu-nebula cu-nebula-right" />
      <div className="cu-nebula cu-nebula-bottom" />

      <div className="cu-fairies">
        {particles.map((p) => {
          const style: CSSProperties = {
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          };
          return <span key={p.id} className="cu-fairy-dot" style={style} />;
        })}
      </div>

      <img
        src="/universe/fairy.png"
        alt=""
        className="cu-fairy fairy-a"
        draggable={false}
      />
      <img
        src="/universe/fairy.png"
        alt=""
        className="cu-fairy fairy-b"
        draggable={false}
      />
      <img
        src="/universe/bird-light.png"
        alt=""
        className="cu-bird bird-a"
        draggable={false}
      />
      <img
        src="/universe/bird-light.png"
        alt=""
        className="cu-bird bird-b"
        draggable={false}
      />

      <section className="cu-content">
        <div className="cu-title-wrap">
          <div className="cu-kicker">✦ CAELINUS UNIVERSE ✦</div>
          <h1 className="cu-title">Choose Your Dimension</h1>
          <p className="cu-subtitle">
            Enter the portal world you want to explore.
          </p>
        </div>

        <div className="cu-portal-grid">
          {portals.map((item) => (
            <Link key={item.label} href={item.href} className={`cu-portal ${item.cls}`}>
              <div className="cu-portal-core" />
              <div className="cu-portal-ring ring-one" />
              <div className="cu-portal-ring ring-two" />
              <div className="cu-portal-symbol">{item.symbol}</div>
              <div className="cu-portal-label">{item.label}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
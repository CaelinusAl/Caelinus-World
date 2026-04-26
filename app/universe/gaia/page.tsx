"use client";

import Link from "next/link";

const portals = [
  {
    title: "Konuşan Bitkiler",
    subtitle: "Bitkilerin frekansı, besin değeri ve şifa alanı",
    href: "/universe/gaia/plants",
    icon: "🌸",
    cls: "pink",
  },
  {
    title: "Toprak Atlası",
    subtitle: "81 il, 7 bölge, her toprağın konuşan bitkileri",
    href: "/universe/gaia/atlas",
    icon: "🜃",
    cls: "green",
  },
  {
    title: "Üretici Ağına Katıl",
    subtitle: "Üreticileri ortak pazar ve satış ağına bağla",
    href: "/universe/gaia/producers",
    icon: "🌾",
    cls: "gold",
  },
  {
    title: "Sanctum",
    subtitle: "Kişisel toprak defterin — bitki, mood, frekans hatıraları",
    href: "/universe/sanctum",
    icon: "✦",
    cls: "violet",
  },
  {
    title: "Ask Caelinus",
    subtitle: "Canlı tarım ve bitki danışmanına soru sor",
    href: "/ai",
    icon: "✨",
    cls: "blue",
  },
];

export default function GaiaGardenPage() {
  return (
    <main className="gaia-page">
      <div className="gaia-bg" />
      <div className="gaia-overlay" />
      <div className="gaia-vignette" />

      <div className="gaia-light-rain" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={`gaia-beam beam-${i % 6}`}
            style={{
              left: `${6 + i * 8}%`,
              animationDelay: `${i * 0.55}s`,
            }}
          />
        ))}
      </div>

      <div className="gaia-flight" aria-hidden="true">
        <img
          src="/universe/Fairy.png"
          alt=""
          className="gaia-fly fairy-1"
          draggable={false}
        />
        <img
          src="/universe/Fairy.png"
          alt=""
          className="gaia-fly fairy-2"
          draggable={false}
        />

        <img
          src="/universe/bird-light.png"
          alt=""
          className="gaia-fly bird-1"
          draggable={false}
        />
        <img
          src="/universe/bird-light.png"
          alt=""
          className="gaia-fly bird-2"
          draggable={false}
        />

        <img
          src="/universe/butterfly-light.png"
          alt=""
          className="gaia-fly butterfly-1"
          draggable={false}
        />
        <img
          src="/universe/butterfly-light.png"
          alt=""
          className="gaia-fly butterfly-2"
          draggable={false}
        />
      </div>

      <div className="gaia-rabbits" aria-hidden="true">
        <span className="gaia-rabbit rabbit-1">🐇</span>
        <span className="gaia-rabbit rabbit-2">🐇</span>
        <span className="gaia-rabbit rabbit-3">🐇</span>
      </div>

      <section className="gaia-shell">
        <div className="gaia-hero">
          <div className="gaia-kicker">✦ GAIA’S GARDEN ✦</div>

          <h1 className="gaia-title">
            Toprak Ana’nın Canlı
            <br />
            Frekans Haritası
          </h1>

          <p className="gaia-subtitle">
            Toprak Ana + üretim rehberi + bilinçli tarım + satış ağı +
            Caelinus AI danışmanı.
            <br />
            Gaia’s Garden artık estetik bir alan değil, yaşayan bir ekosistem.
          </p>

          <div className="gaia-top-pills">
            <a href="#gaia-portals" className="gaia-pill">
              Konuşan Bitkiler
            </a>
            <a href="#gaia-portals" className="gaia-pill">
              Toprak Atlası
            </a>
            <a href="#gaia-portals" className="gaia-pill">
              Üretici Ağı
            </a>
            <a href="#gaia-portals" className="gaia-pill">
              Sanctum
            </a>
            <a href="#gaia-portals" className="gaia-pill">
              Ask Caelinus
            </a>
          </div>
        </div>

        <div id="gaia-portals" className="gaia-portals">
          {portals.map((portal) => (
            <Link
              key={portal.title}
              href={portal.href}
              className={`gaia-card ${portal.cls}`}
            >
              <div className="gaia-card-glow" />
              <div className="gaia-card-icon">{portal.icon}</div>
              <div className="gaia-card-title">{portal.title}</div>
              <div className="gaia-card-subtitle">{portal.subtitle}</div>
            </Link>
          ))}
        </div>

        <div className="gaia-bottom">
          <Link href="/universe" className="gaia-back">
            ← Back to Universe
          </Link>

          <div className="gaia-whisper">
            Nature remembers what the human heart forgets.
          </div>
        </div>
      </section>
    </main>
  );
}
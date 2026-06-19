"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { useAnimeScope } from "@/components/anime/useAnimeScope";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import { producers, PRODUCER_KIND_LABELS } from "@/data/gaia";
import JourneyLink from "@/components/journey/JourneyLink";

// Kart sınıfı → dalış veil rengi.
const CARD_COLOR: Record<string, string> = {
  pink: "#ff9ec4",
  green: "#79e6a0",
  gold: "#f5d486",
  violet: "#b69cff",
  blue: "#7aa2ff",
};

// Büyüyen bahçe — cennet alanında yetişen meyveler & sebzeler.
const crops = [
  { e: "🍅", label: "Domates" },
  { e: "🥕", label: "Havuç" },
  { e: "🌽", label: "Mısır" },
  { e: "🍆", label: "Patlıcan" },
  { e: "🫑", label: "Biber" },
  { e: "🥦", label: "Brokoli" },
  { e: "🍓", label: "Çilek" },
  { e: "🍇", label: "Üzüm" },
  { e: "🫐", label: "Yaban mersini" },
  { e: "🍐", label: "Armut" },
];

// Üretici türüne göre dükkân vitrini ikonu.
const KIND_ICON: Record<string, string> = {
  cooperative: "🤝",
  village: "🏡",
  "family-farm": "🌾",
  atelier: "🫙",
};

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
    title: "Bitkini Sor",
    subtitle: "Gaia AI — Plant Oracle: bitki, toprak, ay döngüsü ve ekim rehberi",
    href: "/universe/gaia/ai",
    icon: "✨",
    cls: "green",
  },
];

export default function GaiaGardenPage() {
  // Ürünler topraktan "yetişerek" çıkar, üretici dükkanları sırayla belirir.
  const root = useAnimeScope<HTMLElement>(() => {
    if (prefersReducedMotion()) return;

    // ÖNEMLİ: opacity'yi önceden gizlemiyoruz; [0,1] keyframe'i sürer.
    // Böylece animasyon kaçsa bile içerik gizli takılı kalmaz.
    animate(".gaia-crop", {
      scale: [0, 1],
      y: [16, 0],
      opacity: [0, 1],
      duration: 760,
      delay: stagger(85, { start: 150 }),
      ease: "out(2.6)",
    });

    animate(".gaia-shop", {
      opacity: [0, 1],
      y: [26, 0],
      duration: 700,
      delay: stagger(70, { start: 260 }),
      ease: "out(3)",
    });
  });

  const shops = producers.slice(0, 6);

  // Arka plan videosu — reduced-motion açıksa oynamaz, poster (gaia-garden.png)
  // sabit kalır.
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (prefersReducedMotion()) {
      v.autoplay = false;
      v.pause();
    }
  }, []);

  return (
    <main className="gaia-page" ref={root}>
      <video
        ref={videoRef}
        className="gaia-bg-video"
        src="/universe/gaia-garden.mp4"
        poster="/universe/gaia-garden.png"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
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

          <JourneyLink
            href="/universe/gaia/sahne"
            color="#79e6a0"
            className="gaia-pill gaia-enter-scene"
          >
            ✦ Sahneye in — Gaia’yı 3B gez
          </JourneyLink>

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
              Bitkini Sor
            </a>
          </div>
        </div>

        <div id="gaia-portals" className="gaia-portals">
          {portals.map((portal) => (
            <JourneyLink
              key={portal.title}
              href={portal.href}
              color={CARD_COLOR[portal.cls] ?? "#79e6a0"}
              className={`gaia-card ${portal.cls}`}
            >
              <div className="gaia-card-glow" />
              <div className="gaia-card-icon">{portal.icon}</div>
              <div className="gaia-card-title">{portal.title}</div>
              <div className="gaia-card-subtitle">{portal.subtitle}</div>
            </JourneyLink>
          ))}
        </div>

        <section className="gaia-market" aria-labelledby="gaia-market-title">
          <div className="gaia-market-head">
            <div className="gaia-kicker">✦ GAIA PAZARI ✦</div>
            <h2 id="gaia-market-title" className="gaia-market-title">
              Büyüyen Bahçe
            </h2>
            <p className="gaia-market-sub">
              Cennet toprağında yetişen meyveler, sebzeler — ve onları
              büyüten ellerin dükkanları.
            </p>
          </div>

          <div className="gaia-orchard" aria-hidden="true">
            {crops.map((c) => (
              <span key={c.label} className="gaia-crop" title={c.label}>
                <span className="gaia-crop-fruit">{c.e}</span>
                <span className="gaia-crop-mound" />
              </span>
            ))}
          </div>

          <div className="gaia-shops">
            {shops.map((p) => (
              <JourneyLink
                key={p.id}
                href="/universe/gaia/producers"
                color="#79e6a0"
                className={`gaia-shop kind-${p.kind}`}
              >
                <div className="gaia-shop-glow" />
                <div className="gaia-shop-icon">
                  {KIND_ICON[p.kind] ?? "🌿"}
                </div>
                <div className="gaia-shop-name">{p.name.tr}</div>
                <div className="gaia-shop-meta">
                  {PRODUCER_KIND_LABELS[p.kind]?.tr ?? p.kind} · {p.city}
                  {p.district ? ` · ${p.district}` : ""}
                </div>
                <div className="gaia-shop-foot">
                  <span className="gaia-shop-since">{p.since}’ten beri</span>
                  {p.certifications?.[0] ? (
                    <span className="gaia-shop-chip">
                      {p.certifications[0]}
                    </span>
                  ) : null}
                </div>
              </JourneyLink>
            ))}
          </div>

          <div className="gaia-market-cta">
            <JourneyLink
              href="/universe/gaia/producers"
              color="#79e6a0"
              className="gaia-pill"
            >
              Tüm üreticiler & dükkanlar →
            </JourneyLink>
          </div>
        </section>

        <div className="gaia-bottom">
          <JourneyLink href="/universe" color="#7aa2ff" className="gaia-back">
            ← Back to Universe
          </JourneyLink>

          <div className="gaia-whisper">
            Nature remembers what the human heart forgets.
          </div>
        </div>
      </section>
    </main>
  );
}
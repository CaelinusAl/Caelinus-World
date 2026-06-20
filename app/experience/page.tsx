"use client";

/**
 * /experience — Caelinus'un immersive ana sayfa prototipi.
 *
 * Klasik landing değil: yaşayan bir evrene açılan kapı. Hafif WebGL hero
 * (mouse-reaktif partiküller) + scroll ile açılan "odalar" (kapılar) + üyelik
 * rolleri. Mevcut canlı sistemi bozmadan ayrı rotada durur; onaylanınca
 * ana sayfaya (/) taşınabilir.
 */

import dynamic from "next/dynamic";
import { useRef } from "react";
import Reveal from "@/components/anime/Reveal";
import JourneyLink from "@/components/journey/JourneyLink";

const HeroField = dynamic(() => import("@/components/experience/HeroField"), {
  ssr: false,
});

type Gate = {
  no: string;
  title: string;
  sub: string;
  href: string;
  color: string;
  glyph: string;
};

const GATES: Gate[] = [
  {
    no: "01",
    title: "SANRI Chamber",
    sub: "Bilinç, anlam, rüyalar, günlük — içeriye açılan oda.",
    href: "/universe/sanctum",
    color: "#9b7bff",
    glyph: "◈",
  },
  {
    no: "02",
    title: "Atelier",
    sub: "Moda, avatar ve 3B ürün deneyimi — frekansını giy.",
    href: "/atelier",
    color: "#f5d486",
    glyph: "◐",
  },
  {
    no: "03",
    title: "Gallery",
    sub: "Sanatçılar ve görsel hikâyeler — bakışın evreni.",
    href: "/designers",
    color: "#ff7ad9",
    glyph: "⌖",
  },
  {
    no: "04",
    title: "Library",
    sub: "Yazarlar ve metinler — kelimelerin saklandığı kat.",
    href: "/archive",
    color: "#7fe3ff",
    glyph: "❖",
  },
  {
    no: "05",
    title: "Earth",
    sub: "Üreticiler, toprak ve üretim haritası — Gaia'nın bahçesi.",
    href: "/universe/gaia",
    color: "#79e6a0",
    glyph: "✦",
  },
  {
    no: "06",
    title: "Gate 33",
    sub: "Özel üyelik ve derinleşme alanı — frekans ağı.",
    href: "/network",
    color: "#7aa2ff",
    glyph: "∞",
  },
];

const ROLES: { name: string; desc: string }[] = [
  { name: "Seeker", desc: "Arayan. Evreni gezer, frekansını keşfeder." },
  { name: "Artist", desc: "Yaratan. Görselin ve duygunun dilini taşır." },
  { name: "Designer", desc: "Tasarlayan. Formu ve dokuyu var eder." },
  { name: "Writer", desc: "Yazan. Anlamı kelimelere dokur." },
  { name: "Producer", desc: "Üreten. Toprağı ve emeği dünyaya getirir." },
  { name: "Curator", desc: "Derleyen. Hikâyeleri ve sesleri bir araya getirir." },
];

export default function ExperiencePage() {
  const glowRef = useRef<HTMLDivElement>(null);

  const handlePointer = (e: React.PointerEvent<HTMLElement>) => {
    const el = glowRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const toGates = () => {
    document.getElementById("gates")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="xp">
      {/* ── HERO ── */}
      <section className="xp-hero" onPointerMove={handlePointer}>
        <HeroField />
        <div className="xp-hero-glow" ref={glowRef} aria-hidden="true" />

        <div className="xp-hero-inner">
          <div className="xp-kicker">✦ Caelinus Universe ✦</div>
          <h1 className="xp-title">
            Ait olmak için değil,
            <br />
            <em>birlikte yaratmak</em> için.
          </h1>
          <p className="xp-sub">
            Bir web sitesine değil, yaşayan bir evrene giriyorsun. Frekansını
            bul, kapılarını aç, kendi izini bırak.
          </p>

          <div className="xp-cta-row">
            <button type="button" className="xp-cta" onClick={toGates}>
              Evrene Gir →
            </button>
            <JourneyLink href="/network/katil" className="xp-cta-ghost">
              Ağa Katıl
            </JourneyLink>
          </div>
        </div>

        <div className="xp-scrollcue">↓ keşfet</div>
      </section>

      {/* ── ODALAR / KAPILAR ── */}
      <section className="xp-section" id="gates">
        <Reveal>
          <div className="xp-eyebrow">Odalar</div>
          <h2 className="xp-heading">Evrenin kapıları</h2>
        </Reveal>

        <div className="xp-gates">
          {GATES.map((g, i) => (
            <Reveal key={g.no} delay={i * 70} y={36}>
              <JourneyLink
                href={g.href}
                color={g.color}
                className="xp-gate"
                style={{ ["--xp" as string]: g.color }}
              >
                <span className="xp-gate-no">{g.no}</span>
                <span className="xp-gate-glyph">{g.glyph}</span>
                <span className="xp-gate-body">
                  <span className="xp-gate-title">{g.title}</span>
                  <span className="xp-gate-sub">{g.sub}</span>
                </span>
                <span className="xp-gate-cta">Gir →</span>
              </JourneyLink>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ÜYELİK ROLLERİ ── */}
      <section className="xp-section">
        <Reveal>
          <div className="xp-eyebrow">Roller</div>
          <h2 className="xp-heading">Evrene nasıl katılırsın?</h2>
        </Reveal>

        <div className="xp-roles">
          {ROLES.map((r, i) => (
            <Reveal key={r.name} delay={i * 60} y={30}>
              <div className="xp-role">
                <div className="xp-role-name">{r.name}</div>
                <div className="xp-role-desc">{r.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="xp-closing">
            <p className="xp-closing-line">
              Caelinus, birlikte yazılan canlı bir evren.
            </p>
            <JourneyLink href="/network/katil" className="xp-cta">
              Frekansını bul →
            </JourneyLink>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

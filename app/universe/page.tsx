"use client";

import { useMemo, type CSSProperties } from "react";
import { animate, stagger, utils } from "animejs";
import { useAnimeScope } from "@/components/anime/useAnimeScope";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import JourneyLink from "@/components/journey/JourneyLink";
import BackgroundVideo from "@/components/media/BackgroundVideo";

// Portal sınıfı → dalış veil rengi (o dünyanın imzası).
const PORTAL_COLOR: Record<string, string> = {
  gold: "#f5d486",
  violet: "#b69cff",
  magenta: "#ff7ad9",
  green: "#79e6a0",
  blue: "#7aa2ff",
  pink: "#ff9ec4",
  cyan: "#7fe3ff",
};

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

  // Anime.js v4 giriş koreografisi — başlık bloğu yumuşakça belirir,
  // portal kartları stagger ile sırayla açılır. Kartlardaki inline
  // transform animasyon bitince temizlenir; aksi hâlde CSS :hover
  // transform'u (translateY/scale) inline stile yenik düşerdi.
  const root = useAnimeScope<HTMLElement>(() => {
    // reduced-motion → animasyon yok; içerik zaten default hâliyle görünür.
    if (prefersReducedMotion()) return;

    const headings = [".cu-kicker", ".cu-title", ".cu-subtitle"];

    // ÖNEMLİ: opacity'yi önceden utils.set ile GİZLEMİYORUZ. anime'in
    // [from, to] keyframe'i opacity'yi 0→1 sürer; böylece herhangi bir
    // hata/StrictMode revert durumunda bile kartlar gizli takılı kalmaz.
    animate(headings, {
      opacity: [0, 1],
      y: [18, 0],
      duration: 900,
      delay: stagger(140, { start: 100 }),
      ease: "out(3)",
    });

    animate(".cu-portal", {
      opacity: [0, 1],
      y: [26, 0],
      duration: 760,
      delay: stagger(60, { start: 420 }),
      ease: "out(3)",
      onComplete: () => {
        // CSS :hover transform'u çalışsın diye anime'in bıraktığı inline
        // transform/opacity'yi temizle (stil kontrolü CSS'e geri döner).
        utils.$(".cu-portal").forEach((el) => {
          (el as HTMLElement).style.transform = "";
          (el as HTMLElement).style.opacity = "";
        });
      },
    });
  });

  return (
    <main className="cu-scene" ref={root}>
      <BackgroundVideo
        className="cu-bg-video"
        src="/universe/caelinus-universe.mp4"
        poster="/universe/caelinus-universe.jpg"
        loop={false}
        decorative={false}
      />
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
            <JourneyLink
              key={item.label}
              href={item.href}
              color={PORTAL_COLOR[item.cls] ?? "#8aa0ff"}
              className={`cu-portal ${item.cls}`}
            >
              <div className="cu-portal-core" />
              <div className="cu-portal-ring ring-one" />
              <div className="cu-portal-ring ring-two" />
              <div className="cu-portal-symbol">{item.symbol}</div>
              <div className="cu-portal-label">{item.label}</div>
            </JourneyLink>
          ))}
        </div>
      </section>
    </main>
  );
}
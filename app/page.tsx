"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createTimeline } from "animejs";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

type Star = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  dx: number;
  dy: number;
};

export default function HomePage() {
  const router = useRouter();
  const [flash, setFlash] = useState(false);
  const enteringRef = useRef(false);

  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 160 }).map((_, i) => {
        const left = ((i * 37) % 96) + 2;
        const top = ((i * 61) % 92) + 2;

        return {
          id: i,
          left,
          top,
          size: (i % 3) + 1,
          delay: (i % 9) * 0.28,
          duration: 2.6 + (i % 5) * 0.8,
          dx: 50 - left,
          dy: 51 - top,
        };
      }),
    []
  );

  // "Ayın içine dalış" geçişi: ay (moon-wrap + içindeki backglow/ring/pembe
  // veil) ekranı yutana kadar büyür, yıldızlar dışa savrulur, beyaz bloom
  // patlar ve /universe açılır (orada pembe-ay video dünyası karşılar).
  const enterUniverse = () => {
    if (enteringRef.current) return;
    enteringRef.current = true;

    if (prefersReducedMotion()) {
      router.push("/universe");
      return;
    }

    // Per-frame transform'la CSS transition çakışmasın diye kapat.
    document
      .querySelectorAll<HTMLElement>(".moon-wrap, .stars-layer")
      .forEach((el) => {
        el.style.transition = "none";
      });

    const tl = createTimeline();
    tl.add(
      ".logo-wrap, .subtitle, .tap, .nebula",
      { opacity: 0, duration: 550, ease: "out(2)" },
      0,
    )
      .add(
        ".stars-layer",
        { scale: 2.6, opacity: [1, 0], duration: 1500, ease: "in(2.5)" },
        0,
      )
      .add(
        ".moon-wrap",
        {
          // translate'i sabit tutarak merkezleme korunur; sadece scale büyür.
          translateX: "-50%",
          translateY: "-50%",
          scale: [1, 18],
          duration: 1500,
          ease: "in(2.6)",
        },
        0,
      );

    window.setTimeout(() => setFlash(true), 1150);
    window.setTimeout(() => router.push("/universe"), 1550);
  };

  return (
    <main className="scene">
      <div className="nebula nebula-left" />
      <div className="nebula nebula-right" />
      <div className="nebula nebula-bottom" />

      <div className="stars-parallax">
        <div className="stars-layer">
          {stars.map((star) => {
            const style: CSSProperties = {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              ["--pull-x" as string]: `${star.dx * 1.9}vw`,
              ["--pull-y" as string]: `${star.dy * 1.9}vh`,
            };

            return <span key={star.id} className="star" style={style} />;
          })}
        </div>
      </div>

      <div className="logo-wrap">
        <h1 className="logo-emblem-wrap">
          <img
            src="/logo/frekansin-sanati.jpeg"
            alt="Caelinus — Frekansın Sanatı"
            className="logo-emblem"
            draggable={false}
          />
        </h1>
        <p className="logo-tagline">
          Wear your frequency — a living universe of fashion, ritual &amp; earth.
        </p>
      </div>

      <button
        type="button"
        className="moon-wrap"
        onClick={enterUniverse}
        aria-label="Discover Caelinus"
      >
        <div className="moon-backglow" />
        <div className="moon-ring ring-1" />
        <div className="moon-ring ring-2" />

        <img
          src="/moon/moon-real.png"
          alt="Moon"
          className="moon"
          draggable={false}
        />
        <div className="moon-pink" aria-hidden="true" />
      </button>

      <p className="subtitle">Enter the Caelinus Universe</p>

      <button type="button" className="tap" onClick={enterUniverse}>
        DISCOVER CAELINUS
      </button>

      <div className={`screen-flash ${flash ? "active" : ""}`} />
    </main>
  );
}
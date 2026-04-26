"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

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
  const [warp, setWarp] = useState(false);
  const [flash, setFlash] = useState(false);

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

  const enterUniverse = () => {
    if (warp) return;

    setWarp(true);

    setTimeout(() => {
      setFlash(true);
    }, 1050);

    setTimeout(() => {
      router.push("/universe");
    }, 2050);
  };

  return (
    <main className={`scene ${warp ? "warp" : ""}`}>
      <div className="nebula nebula-left" />
      <div className="nebula nebula-right" />
      <div className="nebula nebula-bottom" />

      <div className={`stars-layer ${warp ? "stars-warp" : ""}`}>
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

          return (
            <span
              key={star.id}
              className={`star ${warp ? "star-warp" : ""}`}
              style={style}
            />
          );
        })}
      </div>

      <div className="logo-wrap">
        <div className="logo-kicker">✦ CAELINUS UNIVERSE ✦</div>
        <h1 className="logo-text">CAELINUS</h1>
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
      </button>

      <p className="subtitle">Enter the Caelinus Universe</p>

      <button type="button" className="tap" onClick={enterUniverse}>
        DISCOVER CAELINUS
      </button>

      <div className={`vortex-field ${warp ? "active" : ""}`}>
        <div className="vortex-core" />
        <div className="vortex-spiral spiral-a" />
        <div className="vortex-spiral spiral-b" />
        <div className="vortex-ring vr-1" />
        <div className="vortex-ring vr-2" />
        <div className="vortex-ring vr-3" />
        <div className="vortex-shock" />
      </div>

      <div className={`screen-flash ${flash ? "active" : ""}`} />
    </main>
  );
}
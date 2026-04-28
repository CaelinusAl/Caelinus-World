"use client";

import Image from "next/image";
import { useMemo } from "react";

/**
 * GoddessVitrine
 *
 * Yuvarlak kozmik bir vitrin (display case). 12 burç monokini kompozisyonunu
 * iki katmanda gösterir:
 *   - Base katman:   tüm 12 model net renkli (zodiac-vitrine.png)
 *   - Spirit katman: bazı figürler ruh hâlinde yarı şeffaf (zodiac-vitrine-spirit.png)
 *
 * Spirit katmanı yavaşça fade-in/out yapar — vitrinin "nefes alması" budur.
 * Etrafta dönen takımyıldız halkası, dış halo glow ve parçacık ışıltısı
 * canlılık katar.
 */
export default function GoddessVitrine() {
  // 14 sparkle parçacığı için sabit konumlar (deterministik, hydration-safe)
  const sparkles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        // Açıyı disk içinde dağıt
        angle: (360 / 14) * i + (i % 3) * 6,
        // Disk merkezinden uzaklık (%) — kenara yakın ama içeride
        radius: 28 + (i % 4) * 8,
        delay: (i * 0.7) % 6,
        duration: 4 + (i % 5) * 0.6,
        size: 2 + (i % 3),
      })),
    []
  );

  return (
    <div className="gw-vitrine" role="img" aria-label="Caelinus 12 Burç Tanrıça Vitrini">
      {/* Dış kozmik halo glow — yavaş nefes */}
      <div className="gw-vitrine-aura" aria-hidden />

      {/* Dönen takımyıldız halkası */}
      <div className="gw-vitrine-stars" aria-hidden />

      {/* Altın/kozmik kenarlık */}
      <div className="gw-vitrine-rim" aria-hidden />

      {/* Disk içeriği */}
      <div className="gw-vitrine-disc">
        {/* Base — vibrant 12 burç */}
        <Image
          src="/universe/avatar/zodiac-vitrine.png"
          alt="Caelinus 12 Burç Monokini Modelleri"
          fill
          priority
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 540px"
          className="gw-vitrine-base"
        />

        {/* Spirit overlay — nefes katmanı */}
        <Image
          src="/universe/avatar/zodiac-vitrine-spirit.png"
          alt=""
          fill
          aria-hidden
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 540px"
          className="gw-vitrine-spirit"
        />

        {/* İç vignette — derinlik */}
        <div className="gw-vitrine-vignette" aria-hidden />

        {/* Yüzeyde gezen ışık şeridi (glint) */}
        <div className="gw-vitrine-glint" aria-hidden />

        {/* Parçacık ışıltıları */}
        <div className="gw-vitrine-sparkles" aria-hidden>
          {sparkles.map((s) => {
            const x = 50 + s.radius * Math.cos((s.angle * Math.PI) / 180);
            const y = 50 + s.radius * Math.sin((s.angle * Math.PI) / 180);
            return (
              <span
                key={s.id}
                className="gw-vitrine-sparkle"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.duration}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Disk altındaki yansıma/zemin parıltısı */}
      <div className="gw-vitrine-pedestal" aria-hidden />
    </div>
  );
}

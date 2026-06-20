"use client";

/**
 * HeroBackgroundVideo — landing'in en arka "nefes alan gökyüzü" katmanı.
 *
 * Atmosfer > performans > efekt. "Bak ne kadar teknolojik" demez; "burada bir
 * şey yaşıyor" hissini verir.
 *
 * Davranış:
 *  - Masaüstü + ince pointer + reduced-motion KAPALI  → autoplay/muted/loop video.
 *  - Mobil / coarse pointer                           → video yok, optimize still.
 *  - prefers-reduced-motion                           → video yok, still.
 *  - Video yüklenemezse (onError / 404)               → otomatik still'e düşer.
 *  - Üstte %35–50 siyah gradient overlay.
 *
 * Lighthouse: SSR'da hafif still (LCP adayı) render edilir; video yalnızca
 * masaüstünde, mount sonrası, preload="metadata" + poster ile devreye girer.
 * Merkezdeki tıklanabilir ay (portal) bu katmanın önünde durur — çift ay olmasın
 * diye video gökyüzü/atmosfer ağırlıklı olmalı (bkz. public/hero/README.md).
 */
import { useEffect, useState } from "react";

type Props = {
  /** Optimize, loop'lu MP4 (örn. /hero/hero-sky.mp4). */
  videoSrc: string;
  /** Video poster'ı (ilk kare) — yüklenirken gösterilir. */
  posterSrc?: string;
  /** Mobil için optimize statik görsel (WebP/JPG). */
  mobileImageSrc?: string;
  /** Video başarısız / reduced-motion fallback görseli. */
  fallbackImageSrc?: string;
  /** Siyah overlay yoğunluğu (0–1). Varsayılan 0.42 (≈%42). */
  overlayOpacity?: number;
};

export default function HeroBackgroundVideo({
  videoSrc,
  posterSrc,
  mobileImageSrc,
  fallbackImageSrc,
  overlayOpacity = 0.42,
}: Props) {
  // SSR + ilk paint: still (mobil/fallback). Mount sonrası masaüstünde video'ya geç.
  const [useVideo, setUseVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (fine.matches && !reduce.matches) setUseVideo(true);
  }, []);

  const showVideo = useVideo && !videoFailed;
  const stillSrc = showVideo
    ? undefined
    : mobileImageSrc ?? fallbackImageSrc ?? posterSrc;

  return (
    <div className="hero-video-layer" aria-hidden="true">
      {showVideo ? (
        <>
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={posterSrc}
            onError={() => setVideoFailed(true)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          {/* Ay = yaşayan portal: screen-blend mor + altın enerji, en parlak
              bölgeyi (ayı) yakalar; koyu gökte görünmez. Yavaş drift + nefes. */}
          <div className="hero-moon-energy">
            <span className="hme-blob hme-violet" />
            <span className="hme-blob hme-gold" />
          </div>
        </>
      ) : stillSrc ? (
        <img
          className="hero-video-img"
          src={stillSrc}
          alt=""
          draggable={false}
        />
      ) : null}

      <div
        className="hero-video-overlay"
        style={{ ["--hero-overlay" as string]: String(overlayOpacity) }}
      />
    </div>
  );
}

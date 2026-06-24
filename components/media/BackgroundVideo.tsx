"use client";

/**
 * BackgroundVideo — uyarlanır (adaptive) tam-ekran arka plan videosu.
 *
 * "Yaşayan evren" hissini güçlü cihazlarda korur, zayıf cihaz/veriyi korur:
 *   • Varsayılan: video otomatik oynar (muted, loop, playsInline) ama
 *     preload="metadata" — tüm dosyayı baştan indirmez, akışla başlar.
 *   • prefers-reduced-motion AÇIK  → oynatma yok, poster karesi durur.
 *   • Save-Data (veri tasarrufu) AÇIK → poster, video hiç indirilmez.
 *   • Çok yavaş ağ (2g / slow-2g) → poster, video hiç indirilmez.
 *   • Ekran dışına kayınca (IntersectionObserver) → oynatma duraklar,
 *     geri görünür olunca devam eder. Görünmeyen video CPU/GPU yakmaz.
 *
 * SSR/hidrasyon güvenli: ilk render herkes için <video> (markup eşleşir),
 * istemcide ölçüm sonrası gerekiyorsa poster <img>'e geçer.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

type Props = {
  src: string;
  poster: string;
  className?: string;
  style?: CSSProperties;
  /** Döngü. false → video bir kez oynar (örn. anasayfa girişi). Varsayılan true. */
  loop?: boolean;
  /** Arka plan dekoru ise true (ekran okuyuculardan gizle). Varsayılan true. */
  decorative?: boolean;
};

export default function BackgroundVideo({
  src,
  poster,
  className,
  style,
  loop = true,
  decorative = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // null = henüz ölçülmedi (SSR + ilk paint) → video göster (markup eşleşsin).
  const [lite, setLite] = useState<boolean | null>(null);
  // Video viewport içinde mi? Ölçülene kadar görünür say (ilk paint oynasın).
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const conn = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;
    const saveData = conn?.saveData === true;
    const slowNet = !!conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType);
    setLite(saveData || slowNet || prefersReducedMotion());
  }, []);

  // Görünürlük takibi: ekran dışındaki videoyu duraklat, geri gelince devam et.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return; // lite modda <img> render edilir, ref boştur.
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [lite]);

  // Oynatma kararı: yalnızca lite değilken VE görünürken oynat.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (lite || !inView) {
      v.pause();
    } else if (lite === false) {
      v.play().catch(() => {
        /* otomatik oynatma engellenirse poster görünür kalır */
      });
    }
  }, [lite, inView]);

  if (lite) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={poster}
        alt=""
        aria-hidden={decorative}
        className={className}
        style={style}
        draggable={false}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      style={style}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop={loop}
      playsInline
      preload="metadata"
      aria-hidden={decorative}
    />
  );
}

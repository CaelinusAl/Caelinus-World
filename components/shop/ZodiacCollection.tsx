"use client";

/**
 * ZodiacCollection — "yaşayan" burç koleksiyonu (12 burç).
 *
 * Her kart kullanıcının faresine göre 3B eğilir (kağıt değil, nesne hissi),
 * burcun element renginde parlar, frekans halkası döner. Görsel olarak
 * data/products.ts'teki 12 burç JPG'i kullanılır.
 *
 * mp4 (isteğe bağlı, ileri aşama): bir burcun kısa döngü videosu üretilince
 * SIGN_VIDEO'ya eklenir — JPG poster kalır, video YALNIZCA üstüne gelince
 * (hover) oynar. Böylece 12 video birden yüklenmez (mobil/performans dostu).
 *
 * reduced-motion: eğim/otomatik oynatma kapanır, içerik düz görünür.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { productsExtended } from "@/data/products";
import {
  elementOf,
  ELEMENT_TONE,
  ZODIAC_LABEL,
  type Zodiac,
} from "@/lib/frequency";
import { useProfileStore } from "@/stores/profile-store";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import JourneyLink from "@/components/journey/JourneyLink";
import PriceDual from "@/components/shop/PriceDual";

type Product = (typeof productsExtended)[number];

/**
 * Her burç için hover videosu. Dosya yolu konvansiyonu:
 *   public/play/shop/<burç>-look.mp4
 * 12 burç da önceden bağlı; dosyayı kaydettiğin an hover'da oynar. Dosya
 * henüz yoksa/yüklenemezse video gizlenir ve poster JPG görünmeye devam eder
 * (asla siyah kare olmaz) — kod düzenlemeye gerek kalmaz.
 */
const SIGN_VIDEO: Record<Zodiac, string> = {
  aries: "/play/shop/aries-look.mp4",
  taurus: "/play/shop/taurus-look.mp4",
  gemini: "/play/shop/gemini-look.mp4",
  cancer: "/play/shop/cancer-look.mp4",
  leo: "/play/shop/leo-look.mp4",
  virgo: "/play/shop/virgo-look.mp4",
  libra: "/play/shop/libra-look.mp4",
  scorpio: "/play/shop/scorpio-look.mp4",
  sagittarius: "/play/shop/sagittarius-look.mp4",
  capricorn: "/play/shop/capricorn-look.mp4",
  aquarius: "/play/shop/aquarius-look.mp4",
  pisces: "/play/shop/pisces-look.mp4",
};

const COLLECTION = productsExtended.filter(
  (p) => p.category === "bikini" && p.zodiac,
);

function ZodiacCard({
  product,
  reduced,
  featured,
}: {
  product: Product;
  reduced: boolean;
  featured: boolean;
}) {
  const sign = product.zodiac as Zodiac;
  const tone = ELEMENT_TONE[elementOf(sign)];
  const label = ZODIAC_LABEL[sign];
  const videoSrc = SIGN_VIDEO[sign];
  const videoRef = useRef<HTMLVideoElement>(null);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduced) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 11}deg) rotateX(${-py * 11}deg) translateY(-5px)`;
  };
  const onEnter = () => {
    if (reduced) return;
    videoRef.current?.play().catch(() => {});
  };
  const onLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = "";
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <JourneyLink
      href={`/universe/shop/urun/${product.id}`}
      color={tone.color}
      className={`zc-card${featured ? " is-featured" : ""}`}
      style={
        {
          ["--zc"]: tone.color,
          ["--zc-glow"]: tone.glow,
        } as React.CSSProperties
      }
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <div className="zc-media">
        {/* Taban: her zaman poster JPG (video gelmese de görsel hep var).
         * next/image fill → AVIF/WebP + responsive srcset. Kutu .zc-media
         * position:relative + aspect-ratio 3/4 olduğu için fill doğru kalıp. */}
        <Image
          className="zc-media-el"
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={80}
          draggable={false}
        />
        {/* Bindirme: hover'da oynayan video; yoksa/yüklenemezse gizlenir */}
        {videoSrc && (
          <video
            ref={videoRef}
            className="zc-media-video"
            src={videoSrc}
            muted
            loop
            playsInline
            preload="none"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <span className="zc-ring" aria-hidden="true" />
        <span className="zc-glyph" aria-hidden="true">
          {label.symbol}
        </span>
        <span className="zc-hz">{product.frequency}</span>
        {featured && <span className="zc-flag">SENİN BURCUN</span>}
      </div>

      <div className="zc-body">
        <div className="zc-name">{product.name}</div>
        {product.story && <div className="zc-story">{product.story}</div>}
        <div className="zc-foot">
          <span className="zc-price"><PriceDual usd={product.numericPrice} /></span>
          <span className="zc-enter">Hikâyeye gir →</span>
        </div>
      </div>
    </JourneyLink>
  );
}

export default function ZodiacCollection() {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const reduced = prefersReducedMotion();

  return (
    <div className="zc-grid">
      {COLLECTION.map((p) => (
        <ZodiacCard
          key={p.id}
          product={p}
          reduced={reduced}
          featured={hydrated && profile?.zodiac === p.zodiac}
        />
      ))}
    </div>
  );
}

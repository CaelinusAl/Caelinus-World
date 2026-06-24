"use client";

/**
 * StoryHero — PDP kahraman alanı + "Hikâyeyi Yaşa" canlanması.
 *
 * Sade tek-sahne: ürünün vitrin görseli durur; "Hikâyeyi Yaşa"ya basınca
 * görselin yerinde o burcun GERÇEK ÇEKİM canlı videosu oynar
 * (`/products/<türkçe-burç>.mp4`, ör. kova.mp4, balik.mp4). Video henüz
 * yoksa buton sessizce /play deneyimine yönlendirir — hiçbir şey kırılmaz.
 *
 * Server component (page.tsx) yalnızca veriyi geçer; oynatma durumu burada.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/play";
import PriceDual from "@/components/shop/PriceDual";
import TryOnCTA from "./TryOnCTA";

type Props = {
  product: Product;
  hasOutfitGlb: boolean;
  isTr: boolean;
  playHref: string;
  videoSrc: string | null;
  /** Modelli galeri (public/products/<burç>/). Boşsa product.image'a düşer. */
  gallery: string[];
  /** USD fiyatı (varsa). null ise product.price metni gösterilir. */
  priceUsd: number | null;
};

export default function StoryHero({
  product,
  hasOutfitGlb,
  isTr,
  playHref,
  videoSrc,
  gallery,
  priceUsd,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [slide, setSlide] = useState(0);

  const canPlay = !!videoSrc && !failed;

  /**
   * Carousel slaytları:
   *   • modelli slaytlar = galeri fotoğrafları (public/products/<burç>/).
   *     Galeri boşsa tek modelli slayt = product.image.
   *   • son slayt = mankensiz izole ürün (yalnız burçlu ürünlerde,
   *     /play/bikinis/<burç>.png).
   * Video/orb yalnız slayt 0'da (ilk modelli kare). Tek slayt kalırsa
   * oklar/noktalar gizlenir.
   */
  const modelliSlides = gallery.length > 0 ? gallery : [product.image];
  const mannequinSrc = product.zodiac ? `/play/bikinis/${product.zodiac}.png` : null;
  const slides: { src: string; kind: "model" | "product" }[] = [
    ...modelliSlides.map((src) => ({ src, kind: "model" as const })),
    ...(mannequinSrc ? [{ src: mannequinSrc, kind: "product" as const }] : []),
  ];
  const slideCount = slides.length;
  const goSlide = (n: number) => {
    const next = (n + slideCount) % slideCount;
    if (next !== 0) stopStory(); // ilk modelli kareden ayrılınca hikâye durur
    setSlide(next);
  };

  const startStory = () => {
    const v = videoRef.current;
    if (!v) return;
    setPlaying(true);
    v.play().catch(() => {
      setFailed(true);
      setPlaying(false);
    });
  };

  const stopStory = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    setPlaying(false);
  };

  const toggleStory = () => (playing ? stopStory() : startStory());

  return (
    <section className="pdp-hero">
      <div className={`pdp-image-wrap ${playing ? "playing" : ""}`}>
        <div
          className="pdp-car-track"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {slides.map((s, idx) => {
            const isProduct = s.kind === "product";
            return (
              <div className="pdp-car-slide" key={`${s.kind}-${s.src}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={
                    isProduct
                      ? `${product.name} — ${isTr ? "ürün" : "product"}`
                      : product.name
                  }
                  className={`pdp-image${isProduct ? " pdp-image--contain" : ""}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
                {isProduct && (
                  <span className="pdp-slide-tag">
                    {isTr ? "Ürün" : "Product"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {videoSrc && slide === 0 && (
          <video
            ref={videoRef}
            className="pdp-video"
            src={videoSrc}
            poster={product.image}
            muted
            loop
            playsInline
            preload="none"
            onError={() => {
              setFailed(true);
              setPlaying(false);
            }}
          />
        )}

        {/* Görsele tıklayınca da hikâye canlanır (yalnız modelli slaytta) */}
        {canPlay && !playing && slide === 0 && (
          <button
            type="button"
            className="pdp-play-orb"
            onClick={startStory}
            aria-label={isTr ? "Hikâyeyi yaşa" : "Live the story"}
          >
            <span className="pdp-play-glyph">▶</span>
            <span className="pdp-play-label">
              {isTr ? "Hikâyeyi Yaşa" : "Live the Story"}
            </span>
          </button>
        )}

        {playing && (
          <button
            type="button"
            className="pdp-stop-orb"
            onClick={stopStory}
            aria-label={isTr ? "Durdur" : "Stop"}
          >
            ✕
          </button>
        )}

        {product.frequency ? (
          <div className="pdp-freq-tag">{product.frequency}</div>
        ) : null}
        {product.zodiac ? (
          <div className="pdp-zodiac-tag">{product.zodiac}</div>
        ) : null}

        {/* Carousel kontrolleri — yalnız mankensiz slayt mevcutsa */}
        {slideCount > 1 && (
          <>
            <button
              type="button"
              className="pdp-car-arrow left"
              onClick={() => goSlide(slide - 1)}
              aria-label={isTr ? "Önceki görsel" : "Previous image"}
            >
              ‹
            </button>
            <button
              type="button"
              className="pdp-car-arrow right"
              onClick={() => goSlide(slide + 1)}
              aria-label={isTr ? "Sonraki görsel" : "Next image"}
            >
              ›
            </button>
            <div className="pdp-car-dots" role="tablist">
              {Array.from({ length: slideCount }).map((_, d) => (
                <button
                  key={d}
                  type="button"
                  className={`pdp-car-dot ${d === slide ? "is-on" : ""}`}
                  onClick={() => goSlide(d)}
                  aria-label={
                    slides[d].kind === "product"
                      ? isTr ? "Ürün görünümü" : "Product view"
                      : isTr ? `Modelli görünüm ${d + 1}` : `On-model view ${d + 1}`
                  }
                  aria-selected={d === slide}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pdp-info">
        <div className="pdp-kicker">
          ✦ {isTr ? "Caelinus · Hikâyeli Parça" : "Caelinus · Storied Piece"}
        </div>
        <h1 className="pdp-title">{product.name}</h1>
        <div className="pdp-designer">
          {isTr ? "Tasarımcı" : "Designer"}: <strong>{product.designer}</strong>
          <span style={{ opacity: 0.5, padding: "0 8px" }}>·</span>
          {product.brand}
        </div>

        {product.story ? <p className="pdp-story-lead">{product.story}</p> : null}

        <div className="pdp-price">
          {priceUsd != null ? <PriceDual usd={priceUsd} /> : product.price}
        </div>

        <div className="pdp-cta-row">
          <TryOnCTA
            productId={product.id}
            hasOutfitGlb={hasOutfitGlb}
            isTr={isTr}
          />

          {canPlay ? (
            <button
              type="button"
              className={`pdp-cta pdp-cta--primary ${playing ? "is-playing" : ""}`}
              onClick={toggleStory}
            >
              {playing
                ? isTr
                  ? "Hikâye Oynuyor — Durdur"
                  : "Playing — Stop"
                : isTr
                  ? "Hikâyeyi Yaşa"
                  : "Live the Story"}
            </button>
          ) : (
            <Link href={playHref} className="pdp-cta">
              {isTr ? "Hikâyeyi Yaşa" : "Live the Story"}
            </Link>
          )}

          <Link href="/manifesto" className="pdp-cta pdp-cta--ghost">
            {isTr ? "Manifesto" : "Manifesto"}
          </Link>
        </div>
      </div>
    </section>
  );
}

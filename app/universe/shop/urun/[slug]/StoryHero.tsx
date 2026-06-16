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
import TryOnCTA from "./TryOnCTA";

type Props = {
  product: Product;
  hasOutfitGlb: boolean;
  isTr: boolean;
  playHref: string;
  videoSrc: string | null;
};

export default function StoryHero({
  product,
  hasOutfitGlb,
  isTr,
  playHref,
  videoSrc,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const canPlay = !!videoSrc && !failed;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="pdp-image"
          loading="eager"
        />

        {videoSrc && (
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

        {/* Görsele tıklayınca da hikâye canlanır */}
        {canPlay && !playing && (
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

        <div className="pdp-price">{product.price}</div>

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

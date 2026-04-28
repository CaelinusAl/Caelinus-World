"use client";

/**
 * Stylist Caelinus AI — outfit try-on rail.
 *
 * Sits beneath the AI scene preview once a render is ready. Surfaces a
 * curated 4-tile carousel of shop products (zodiac-matched bikini +
 * pareo + jewellery + accessory). Tapping a tile fires the render
 * route again with the outfit fragment appended to the prompt — the
 * canvas paints the same goddess wearing the selected piece.
 *
 * Cache strategy: each outfit click adds an `-o<productId>` suffix to
 * the cache key, so the second time anyone picks the same look + same
 * outfit, the image is served from the existing Storage object.
 *
 * Buy CTA: "Hemen Al" routes into `/universe/shop?product=<id>` so
 * the existing checkout flow takes over from there.
 */

import { useMemo } from "react";

import { findZodiac, type ZodiacId } from "@/data/play-assets";
import { curatedForZodiac, findOutfit, PLAY_OUTFITS } from "@/data/play-outfits";

type Lang = "tr" | "en";

type Props = {
  lang: Lang;
  zodiacId: ZodiacId | null;
  /** Currently active outfit id (from the store). `null` = canonical
   *  no-outfit render is on screen. */
  selectedOutfitId: string | null;
  /** Render is mid-flight — used to disable tile interactions so the
   *  user can't queue six outfit changes in two seconds. */
  rendering: boolean;
  onSelectOutfit: (outfitId: string | null) => void;
};

const CATEGORY_BADGE_TR: Record<string, string> = {
  bikini: "Bikini",
  pareo: "Pareo",
  jewelry: "Takı",
  bag: "Çanta",
  heels: "Ayakkabı",
};
const CATEGORY_BADGE_EN: Record<string, string> = {
  bikini: "Bikini",
  pareo: "Pareo",
  jewelry: "Jewelry",
  bag: "Bag",
  heels: "Heels",
};

export default function StylistPanel({
  lang,
  zodiacId,
  selectedOutfitId,
  rendering,
  onSelectOutfit,
}: Props) {
  const zodiac = findZodiac(zodiacId);
  const selected = findOutfit(selectedOutfitId);

  // Curate four tiles based on the active zodiac. Re-runs only when
  // the zodiac changes — the catalogue itself is module-static.
  const tiles = useMemo(() => curatedForZodiac(zodiacId), [zodiacId]);

  const T = {
    kicker:
      lang === "tr"
        ? "── STYLIST CAELINUS AI ──"
        : "── STYLIST CAELINUS AI ──",
    leadWithZodiac:
      lang === "tr"
        ? `${zodiac?.label.tr ?? "Burcuna"} özel seçtim`
        : `Curated for ${zodiac?.label.en ?? "your sign"}`,
    leadFallback:
      lang === "tr"
        ? "Avatarına bir parça seç"
        : "Pick a piece for your goddess",
    hintIdle:
      lang === "tr"
        ? "Tıkla — Caelinus avatarına giydirsin."
        : "Tap a piece — Caelinus dresses your goddess.",
    hintRendering:
      lang === "tr"
        ? "Caelinus giydiriyor…"
        : "Caelinus is dressing your goddess…",
    clear: lang === "tr" ? "Çıplak Görünüm" : "Bare Look",
    buyNow: lang === "tr" ? "Hemen Al" : "Buy Now",
    seeAll: lang === "tr" ? "Tüm Koleksiyon" : "Full Collection",
  };

  // Empty catalogue is impossible in practice (we ship 27 products),
  // but the panel should still render gracefully if curatedForZodiac
  // ever returns nothing.
  if (tiles.length === 0) return null;

  const lead = zodiac ? T.leadWithZodiac : T.leadFallback;
  const categoryLabel = lang === "tr" ? CATEGORY_BADGE_TR : CATEGORY_BADGE_EN;

  return (
    <section
      className="play-stylist-panel"
      aria-labelledby="play-stylist-h"
    >
      <header className="play-stylist-head">
        <p className="play-stylist-kicker" id="play-stylist-h">
          {T.kicker}
        </p>
        <p className="play-stylist-lead">{lead}</p>
      </header>

      <div
        className="play-stylist-rail"
        role="radiogroup"
        aria-label={lead}
      >
        {tiles.map((outfit) => {
          const active = selectedOutfitId === outfit.id;
          return (
            <button
              key={outfit.id}
              type="button"
              className={
                "play-stylist-tile" +
                (active ? " is-active" : "") +
                (rendering ? " is-pending" : "")
              }
              onClick={() => onSelectOutfit(active ? null : outfit.id)}
              disabled={rendering}
              aria-pressed={active}
              aria-label={`${outfit.name} — ${outfit.price}`}
            >
              <span className="play-stylist-tile-badge">
                {categoryLabel[outfit.category] ?? outfit.category}
              </span>
              <span className="play-stylist-tile-name">{outfit.name}</span>
              <span className="play-stylist-tile-price">{outfit.price}</span>
              {active ? (
                <span className="play-stylist-tile-active" aria-hidden="true">
                  ✦
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <footer className="play-stylist-foot">
        <p className="play-stylist-hint" aria-live="polite">
          {rendering ? T.hintRendering : T.hintIdle}
        </p>
        <div className="play-stylist-actions">
          {selected ? (
            <>
              <button
                type="button"
                className="play-stylist-clear-btn"
                onClick={() => onSelectOutfit(null)}
                disabled={rendering}
              >
                {T.clear}
              </button>
              <a
                className="play-stylist-buy-btn"
                href={selected.buyHref}
                aria-label={`${T.buyNow} — ${selected.name} ${selected.price}`}
              >
                {T.buyNow} · {selected.price}
              </a>
            </>
          ) : (
            <a
              className="play-stylist-collection-link"
              href={`/universe/shop${zodiacId ? `?zodiac=${zodiacId}` : ""}`}
            >
              {T.seeAll} · {PLAY_OUTFITS.length}
              {lang === "tr" ? " parça" : " pieces"} →
            </a>
          )}
        </div>
      </footer>
    </section>
  );
}

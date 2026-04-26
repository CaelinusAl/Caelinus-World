"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { productsExtended } from "@/data/products";
import { ELEMENT_TONE, FREQUENCY_LABELS, ZODIAC_LABEL } from "@/lib/frequency";
import type { CSSProperties } from "react";

/**
 * "Senin frekansın" personalization strip rendered at the top of the shop.
 *
 * - When the user has a frequency profile, we surface every product whose
 *   frequency matches their Solfeggio Hz, with the zodiac signature item
 *   highlighted first.
 * - When there's no profile, we render a soft invitation back to /onboarding.
 */
export default function FrequencyShelf() {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const matches = useMemo(() => {
    if (!profile) return [];
    const hzString = `${profile.frequency} Hz`;

    const exact = productsExtended.filter((p) => p.frequency === hzString);
    // Sort: signature zodiac product first, then own-zodiac matches, then rest.
    return [...exact].sort((a, b) => {
      if (a.id === profile.productId) return -1;
      if (b.id === profile.productId) return 1;
      const az = a.zodiac === profile.zodiac ? 0 : 1;
      const bz = b.zodiac === profile.zodiac ? 0 : 1;
      return az - bz;
    });
  }, [profile]);

  if (!hydrated) return null;

  if (!profile) {
    return (
      <section className="freq-shelf is-cta" aria-label="Find your frequency">
        <div className="freq-shelf-cta">
          <div className="freq-shelf-kicker">✦ FREKANS BULMA RİTÜELİ</div>
          <h3 className="freq-shelf-cta-title">
            Henüz frekansını bulmadın.
          </h3>
          <p className="freq-shelf-cta-text">
            Caelinus Shop'un sana göre kişiselleşmesi için önce eşikten geç.
            3 dakika, 3 adım, sadece sana ait bir Hz.
          </p>
          <Link href="/onboarding" className="freq-shelf-cta-btn">
            Frekansını Bul ✦
          </Link>
        </div>
      </section>
    );
  }

  const tone = ELEMENT_TONE[profile.element];
  const motto = FREQUENCY_LABELS[profile.frequency].tr;

  return (
    <section
      className="freq-shelf is-tuned"
      aria-label="Senin frekansına göre seçilenler"
      style={{
        ["--shelf-color" as string]: tone.color,
        ["--shelf-glow" as string]: tone.glow,
      } as CSSProperties}
    >
      <header className="freq-shelf-header">
        <div className="freq-shelf-id">
          <span className="freq-shelf-symbol" aria-hidden="true">
            {ZODIAC_LABEL[profile.zodiac].symbol}
          </span>
          <div className="freq-shelf-id-text">
            <div className="freq-shelf-kicker">SENİN FREKANSIN</div>
            <div className="freq-shelf-hz">
              {profile.frequency}<span>Hz</span>
            </div>
            <div className="freq-shelf-motto">"{motto}"</div>
          </div>
        </div>
        <div className="freq-shelf-actions">
          <Link href="/onboarding" className="freq-shelf-action">
            Yeniden akort ol ↻
          </Link>
        </div>
      </header>

      {matches.length > 0 && (
        <div className="freq-shelf-rail">
          {matches.slice(0, 8).map((p) => (
            <article
              key={p.id}
              className={`freq-shelf-card ${p.id === profile.productId ? "is-signature" : ""}`}
            >
              <div className="freq-shelf-card-image">
                <img src={p.image} alt={p.name} draggable={false} />
                <span className="freq-shelf-card-hz">{p.frequency}</span>
                {p.id === profile.productId && (
                  <span className="freq-shelf-card-flag">SENİN İMZAN</span>
                )}
              </div>
              <div className="freq-shelf-card-name">{p.name}</div>
              <div className="freq-shelf-card-meta">
                <span>{p.price}</span>
                {p.zodiac && (
                  <span className="freq-shelf-card-zodiac">
                    {(ZODIAC_LABEL as Record<string, { symbol: string }>)[p.zodiac]?.symbol}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

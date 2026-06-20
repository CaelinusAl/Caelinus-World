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
/** Kod-yağmuru sütunları — her biri farklı hızda akar (Matrix hissi). */
const FLOW_COLUMNS = ["24s", "31s", "27s"];

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
            Caelinus Shop&apos;un sana göre kişiselleşmesi için önce eşikten geç.
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
            <div className="freq-shelf-motto">&quot;{motto}&quot;</div>
          </div>
        </div>
        <div className="freq-shelf-actions">
          <Link href="/onboarding" className="freq-shelf-action">
            Yeniden akort ol ↻
          </Link>
        </div>
      </header>

      {matches.length > 0 && (
        <div className="freq-flow" aria-label="Frekansına akan parçalar">
          {FLOW_COLUMNS.map((dur, c) => {
            // Her sütun tüm havuzu içerir (sütuna göre kaydırılmış) →
            // seyrek eşleşmede bile yoğun, çeşitli akış. 2x render = kusursuz döngü.
            const pool = matches.slice(0, 8);
            const rotated = [...pool.slice(c % pool.length), ...pool.slice(0, c % pool.length)];
            const items = [...rotated, ...rotated];
            return (
              <div
                key={c}
                className="freq-flow-col"
                style={{ ["--dur" as string]: dur } as CSSProperties}
              >
                <div className="freq-flow-track">
                  {items.map((p, i) => {
                    const original = i < rotated.length;
                    return (
                      <Link
                        key={`${p.id}-${c}-${i}`}
                        href={`/universe/shop/urun/${p.id}`}
                        className={`freq-rain ${p.id === profile.productId ? "is-signature" : ""}`}
                        aria-hidden={original ? undefined : true}
                        tabIndex={original ? undefined : -1}
                        prefetch={false}
                      >
                        <img src={p.image} alt={p.name} draggable={false} />
                        <span className="freq-rain-hz">{p.frequency}</span>
                        <span className="freq-rain-name">{p.name}</span>
                        {p.id === profile.productId && (
                          <span className="freq-rain-flag">SENİN İMZAN</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

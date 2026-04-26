"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useLangStore } from "@/stores/lang-store";
import { plants, getPlant } from "@/data/gaia";
import { ZODIAC_LABEL, FREQUENCY_LABELS } from "@/lib/frequency";

const COPY = {
  ariaCta:       { tr: "Frekansını bul",          en: "Find your frequency" },
  ariaTuned:     { tr: "Senin frekansın",         en: "Your frequency" },
  eyebrow:       { tr: "Caelinus · Senin Frekansın", en: "Caelinus · Your Frequency" },
  ctaHeadlineA:  { tr: "Bu bahçe henüz",          en: "This garden does not" },
  ctaHeadlineB:  { tr: "seni tanımıyor.",         en: "know you yet." },
  ctaBody: {
    tr: "Doğum tarihin ve niyetin bir Solfeggio frekansına dönüşür. Bahçe sana hangi bitkinin yoldaş olduğunu o zaman söyler.",
    en: "Your birth date and intent become a Solfeggio frequency. Then the garden tells you which plant walks beside you.",
  },
  ctaAction:     { tr: "Frekansını Bul",          en: "Find Your Frequency" },
  tunedHeadlineA:{ tr: "Sana yoldaş bitki:",      en: "Your kindred plant:" },
  tunedAction:   { tr: "Bitkini Tanı",            en: "Meet Your Plant" },
} as const;

/**
 * "Senin Frekansın" — pure typography card.
 *
 * No plant photograph. The card is the message: a hairline-bordered
 * editorial block that pins the visitor's frequency to the page in the
 * same Cormorant / mono-spec rhythm used across Caelinus.
 */
export default function PlantsPersonalCard() {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);

  const lang = useLangStore((s) => s.lang);
  const langHydrated = useLangStore((s) => s.hydrated);
  const hydrateLang = useLangStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!langHydrated) hydrateLang();
  }, [langHydrated, hydrateLang]);

  const yourPlant = useMemo(() => {
    if (!profile) return null;
    const exact = plants.find((p) => p.solfeggioMatch === profile.frequency);
    return exact ?? getPlant("lavanta") ?? null;
  }, [profile]);

  if (!hydrated) return null;

  if (!profile || !yourPlant) {
    return (
      <section className="freq-card freq-card--cta" aria-label={COPY.ariaCta[lang]}>
        <div className="freq-card-frame">
          <div className="freq-card-corner freq-card-corner--tl" aria-hidden="true" />
          <div className="freq-card-corner freq-card-corner--tr" aria-hidden="true" />
          <div className="freq-card-corner freq-card-corner--bl" aria-hidden="true" />
          <div className="freq-card-corner freq-card-corner--br" aria-hidden="true" />

          <div className="freq-card-inner">
            <div className="freq-card-eyebrow">
              <span>{COPY.eyebrow[lang]}</span>
            </div>

            <h2 className="freq-card-headline">
              {COPY.ctaHeadlineA[lang]} <em>{COPY.ctaHeadlineB[lang]}</em>
            </h2>

            <p className="freq-card-body">{COPY.ctaBody[lang]}</p>

            <Link href="/onboarding" className="freq-card-action">
              <span>{COPY.ctaAction[lang]}</span>
              <span className="freq-card-arrow" aria-hidden="true">✦</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const tone = pickColor(yourPlant.id);
  const motto = FREQUENCY_LABELS[profile.frequency]?.[lang] ?? "";
  const style: CSSProperties = {
    ["--freq-color" as string]: tone,
    ["--freq-glow" as string]: `${tone}55`,
  } as CSSProperties;

  return (
    <section
      className="freq-card freq-card--tuned"
      style={style}
      aria-label={COPY.ariaTuned[lang]}
    >
      <div className="freq-card-frame">
        <div className="freq-card-corner freq-card-corner--tl" aria-hidden="true" />
        <div className="freq-card-corner freq-card-corner--tr" aria-hidden="true" />
        <div className="freq-card-corner freq-card-corner--bl" aria-hidden="true" />
        <div className="freq-card-corner freq-card-corner--br" aria-hidden="true" />

        <div className="freq-card-inner">
          <div className="freq-card-eyebrow">
            <span className="freq-card-zodiac" aria-hidden="true">
              {ZODIAC_LABEL[profile.zodiac].symbol}
            </span>
            <span>{COPY.eyebrow[lang]}</span>
          </div>

          <div className="freq-card-hz">
            <span className="freq-card-hz-num">{profile.frequency}</span>
            <span className="freq-card-hz-unit">Hz</span>
          </div>

          {motto && <div className="freq-card-motto">{motto}</div>}

          <h2 className="freq-card-headline">
            {COPY.tunedHeadlineA[lang]} <em>{yourPlant.name[lang]}</em>
          </h2>

          <p className="freq-card-body">&ldquo;{yourPlant.poetic[lang]}&rdquo;</p>

          <div className="freq-card-meta">
            <span className="freq-card-meta-item">
              {ZODIAC_LABEL[profile.zodiac][lang]}
            </span>
            <span className="freq-card-meta-sep" aria-hidden="true">·</span>
            <span className="freq-card-meta-item">{yourPlant.scientific}</span>
            <span className="freq-card-meta-sep" aria-hidden="true">·</span>
            <span className="freq-card-meta-item">{yourPlant.frequency} Hz</span>
          </div>

          <Link
            href={`/universe/gaia/plants/${yourPlant.id}`}
            className="freq-card-action"
          >
            <span>{COPY.tunedAction[lang]}</span>
            <span className="freq-card-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function pickColor(id: string): string {
  switch (id) {
    case "lavanta":  return "#a08aff";
    case "gul":      return "#ff8ad9";
    case "zeytin":   return "#9aaa6a";
    case "biberiye": return "#6ec3ff";
    case "adacayi":  return "#7fc6a4";
    case "melisa":   return "#c8e26e";
    case "yasemin":  return "#f0d9a8";
    case "defne":    return "#5da378";
    case "nane":     return "#6effb6";
    case "cay":      return "#b6d27d";
    case "isirgan":  return "#7fb87a";
    case "sumak":    return "#ff7a5a";
    default:         return "#d4b78a";
  }
}

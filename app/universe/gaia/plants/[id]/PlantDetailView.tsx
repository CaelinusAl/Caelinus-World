"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  MOOD_LABELS,
  PRODUCER_KIND_LABELS,
  plants,
  type GaiaPlant,
  type Producer,
  type Region,
} from "@/data/gaia";
import { useProfileStore } from "@/stores/profile-store";
import { useLangStore } from "@/stores/lang-store";
import { ZODIAC_LABEL } from "@/lib/frequency";
import type { ProductExtended } from "@/types/play";
import PlantVoice from "@/components/plants/PlantVoice";
import { getPlantVoice } from "@/data/plant-voices";

type Tab = "voice" | "story" | "healing" | "growers" | "ritual";

type Props = {
  plant: GaiaPlant;
  producers: Producer[];
  region: Region | null;
  matchedProduct: ProductExtended | null;
};

const TAB_LABELS: Record<Tab, { tr: string; en: string }> = {
  voice:   { tr: "Sesi",       en: "Voice" },
  story:   { tr: "Hikâye",     en: "Story" },
  healing: { tr: "Şifa",       en: "Healing" },
  growers: { tr: "Üreticiler", en: "Growers" },
  ritual:  { tr: "Ritüel",     en: "Ritual" },
};

const D_TEXT = {
  back:           { tr: "← Bahçeye Dön",          en: "← Back to the garden" },
  speakingPlant:  { tr: "✦ KONUŞAN BİTKİ ✦",      en: "✦ SPEAKING PLANT ✦" },
  yourFreq:       { tr: "SENİN FREKANSIN",        en: "YOUR FREQUENCY" },
  yourFreqLine:   { tr: "Bu bitki sana yoldaş.",  en: "This plant walks beside you." },
  mythology:      { tr: "Mitoloji",                en: "Mythology" },
  soilOf:         { tr: "Toprağı",                 en: "Soil" },
  poetic:         { tr: "Şiirsel Anlatım",         en: "Poetic Voice" },
  nutrition:      { tr: "Besin Değeri",            en: "Nutrition" },
  healing:        { tr: "Şifa Alanı",              en: "Healing Field" },
  effects:        { tr: "Etki Alanları",           en: "Effects" },
  growersEmpty: {
    tr: "Bu bitkinin Caelinus ağında henüz kayıtlı bir üreticisi yok. Ağa katılmak ister misin?",
    en: "This plant has no producer in the Caelinus network yet. Would you like to join?",
  },
  growersNet:     { tr: "Üretici Ağı →",          en: "Producer Network →" },
  method:         { tr: "Yöntem:",                 en: "Method:" },
  meetGrower:     { tr: "Üreticiyi tanı →",       en: "Meet the grower →" },
  ritual:         { tr: "Ritüel",                  en: "Ritual" },
  meetBody:       { tr: "Bedenle Buluş",           en: "Meet the Body" },
  sameFreqGarment:{ tr: "ile aynı frekansta dokunan kıyafet", en: "the garment woven at the same frequency as" },
  wearFreq:       { tr: "Frekansı Giy →",         en: "Wear the Frequency →" },
  prevPlant:      { tr: "← Önceki bitki",          en: "← Previous plant" },
  allPlants:      { tr: "Tüm Bitkiler",            en: "All Plants" },
  nextPlant:      { tr: "Sonraki bitki →",         en: "Next plant →" },
  langSwitchAria: { tr: "Dil seçimi",               en: "Language switch" },
} as const;

export default function PlantDetailView({
  plant,
  producers,
  region,
  matchedProduct,
}: Props) {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);

  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const langHydrated = useLangStore((s) => s.hydrated);
  const hydrateLang = useLangStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!langHydrated) hydrateLang();
  }, [langHydrated, hydrateLang]);

  const voiceScript = useMemo(() => getPlantVoice(plant.id), [plant.id]);
  const [tab, setTab] = useState<Tab>(voiceScript ? "voice" : "story");

  const isYours = useMemo(
    () => Boolean(profile && plant.solfeggioMatch === profile.frequency),
    [profile, plant.solfeggioMatch]
  );

  const ringStyle: CSSProperties = {
    ["--p-color" as string]: pickPlantColor(plant.id),
    ["--p-glow" as string]: pickPlantGlow(plant.id),
  } as CSSProperties;

  return (
    <main className="pdetail-root" style={ringStyle}>
      {/* Background */}
      <div className="pdetail-bg" aria-hidden="true" />
      <div className="pdetail-vignette" aria-hidden="true" />

      {/* Top ribbon */}
      <header className="pdetail-ribbon">
        <Link href="/universe/gaia/plants" className="pdetail-ribbon-back">
          {D_TEXT.back[lang]}
        </Link>
        <div className="pdetail-ribbon-mark">CAELINUS · GAIA · {plant.name[lang].toUpperCase()}</div>
        <div className="pdetail-ribbon-right">
          <div
            className="pdetail-lang-switch"
            role="group"
            aria-label={D_TEXT.langSwitchAria[lang]}
          >
            <button
              type="button"
              className={`pdetail-lang-btn ${lang === "tr" ? "is-active" : ""}`}
              aria-pressed={lang === "tr"}
              onClick={() => setLang("tr")}
            >
              TR
            </button>
            <span className="pdetail-lang-divider" aria-hidden="true">·</span>
            <button
              type="button"
              className={`pdetail-lang-btn ${lang === "en" ? "is-active" : ""}`}
              aria-pressed={lang === "en"}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
          <Link href="/universe/gaia" className="pdetail-ribbon-link">
            Gaia
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="pdetail-hero">
        <div className="pdetail-hero-image-wrap">
          <div className="pdetail-orb-ring pdetail-orb-ring-1" aria-hidden="true" />
          <div className="pdetail-orb-ring pdetail-orb-ring-2" aria-hidden="true" />
          <div className="pdetail-orb-ring pdetail-orb-ring-3" aria-hidden="true" />
          <img
            src={plant.image}
            alt={plant.name[lang]}
            className="pdetail-hero-image"
            draggable={false}
          />
        </div>

        <div className="pdetail-hero-info">
          <div className="pdetail-kicker">
            {D_TEXT.speakingPlant[lang]}{region && <> &nbsp;·&nbsp; {region.name[lang]}</>}
          </div>
          <h1 className="pdetail-title">{plant.name[lang]}</h1>
          <div className="pdetail-scientific">{plant.scientific}</div>

          <div className="pdetail-hz">
            <span className="pdetail-hz-num">{plant.frequency}</span>
            <span className="pdetail-hz-unit">Hz</span>
          </div>

          <p className="pdetail-poetic">&ldquo;{plant.poetic[lang]}&rdquo;</p>

          <div className="pdetail-mood-row">
            {plant.moods.map((m) => (
              <span key={m} className="pdetail-mood">
                {MOOD_LABELS[m].symbol} {MOOD_LABELS[m][lang]}
              </span>
            ))}
          </div>

          {isYours && profile && (
            <div className="pdetail-yours-badge">
              <span className="pdetail-yours-symbol">
                {ZODIAC_LABEL[profile.zodiac].symbol}
              </span>
              <div>
                <div className="pdetail-yours-kicker">{D_TEXT.yourFreq[lang]}</div>
                <div className="pdetail-yours-text">
                  {profile.frequency} Hz · {D_TEXT.yourFreqLine[lang]}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TABS */}
      <div className="pdetail-tabs" role="tablist">
        {(Object.keys(TAB_LABELS) as Tab[])
          .filter((t) => t !== "voice" || voiceScript)
          .map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`pdetail-tab ${tab === t ? "is-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t][lang]}
            </button>
          ))}
      </div>

      <section className="pdetail-content">
        {tab === "voice" && voiceScript && (
          <div className="pdetail-pane">
            <PlantVoice
              script={voiceScript}
              lang={lang}
              plantName={plant.name[lang]}
              frequency={plant.frequency}
              tone={pickPlantColor(plant.id)}
            />
          </div>
        )}

        {tab === "story" && (
          <div className="pdetail-pane">
            <div className="pdetail-section">
              <div className="pdetail-section-kicker">{D_TEXT.mythology[lang]}</div>
              <p className="pdetail-text">{plant.mythology[lang]}</p>
            </div>

            {region && (
              <div className="pdetail-section">
                <div className="pdetail-section-kicker">{region.name[lang]} {D_TEXT.soilOf[lang]}</div>
                <p className="pdetail-text">{region.signature[lang]}</p>
                <div className="pdetail-cities">
                  {region.cities.map((c) => (
                    <span key={c} className="pdetail-city">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pdetail-section">
              <div className="pdetail-section-kicker">{D_TEXT.poetic[lang]}</div>
              <p className="pdetail-poetic-large">&ldquo;{plant.poetic[lang]}&rdquo;</p>
            </div>
          </div>
        )}

        {tab === "healing" && (
          <div className="pdetail-pane">
            <div className="pdetail-section">
              <div className="pdetail-section-kicker">{D_TEXT.nutrition[lang]}</div>
              <p className="pdetail-text">{plant.nutrition[lang]}</p>
            </div>
            <div className="pdetail-section">
              <div className="pdetail-section-kicker">{D_TEXT.healing[lang]}</div>
              <p className="pdetail-text">{plant.healing[lang]}</p>
            </div>
            <div className="pdetail-section">
              <div className="pdetail-section-kicker">{D_TEXT.effects[lang]}</div>
              <div className="pdetail-mood-grid">
                {plant.moods.map((m) => (
                  <article key={m} className="pdetail-mood-card">
                    <span className="pdetail-mood-symbol">{MOOD_LABELS[m].symbol}</span>
                    <span className="pdetail-mood-name">{MOOD_LABELS[m][lang]}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "growers" && (
          <div className="pdetail-pane">
            {producers.length === 0 && (
              <p className="pdetail-text pdetail-empty">
                {D_TEXT.growersEmpty[lang]}{" "}
                <Link href="/universe/gaia/producers" className="pdetail-inline-link">
                  {D_TEXT.growersNet[lang]}
                </Link>
              </p>
            )}
            <div className="pdetail-producers-grid">
              {producers.map((producer) => (
                <article key={producer.id} className="pdetail-producer-card">
                  <div className="pdetail-producer-head">
                    <div>
                      <div className="pdetail-producer-kicker">
                        {PRODUCER_KIND_LABELS[producer.kind][lang]} · {producer.since}
                      </div>
                      <h3 className="pdetail-producer-name">
                        {producer.name[lang]}
                      </h3>
                      <div className="pdetail-producer-place">
                        {producer.city}
                        {producer.district && <> · {producer.district}</>}
                      </div>
                    </div>
                    {producer.certifications && producer.certifications.length > 0 && (
                      <div className="pdetail-producer-certs">
                        {producer.certifications.map((c) => (
                          <span key={c} className="pdetail-producer-cert">
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="pdetail-producer-story">{producer.story[lang]}</p>

                  <div className="pdetail-producer-method">
                    <strong>{D_TEXT.method[lang]}</strong> {producer.method[lang]}
                  </div>

                  <Link
                    href={`/universe/gaia/producers/${producer.id}`}
                    className="pdetail-producer-link"
                  >
                    {D_TEXT.meetGrower[lang]}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "ritual" && (
          <div className="pdetail-pane">
            <div className="pdetail-section pdetail-ritual-card">
              <div className="pdetail-section-kicker">{D_TEXT.ritual[lang]}</div>
              <p className="pdetail-ritual-text">{plant.ritual[lang]}</p>
            </div>

            {matchedProduct && (
              <div className="pdetail-section">
                <div className="pdetail-section-kicker">{D_TEXT.meetBody[lang]}</div>
                <article className="pdetail-product-card">
                  <div className="pdetail-product-image">
                    <img
                      src={matchedProduct.image}
                      alt={matchedProduct.name}
                      draggable={false}
                    />
                    <span className="pdetail-product-hz">{matchedProduct.frequency}</span>
                  </div>
                  <div className="pdetail-product-info">
                    <div className="pdetail-product-kicker">
                      {lang === "tr"
                        ? <>{plant.name[lang]} {D_TEXT.sameFreqGarment[lang]}</>
                        : <>{D_TEXT.sameFreqGarment[lang]} {plant.name[lang]}</>}
                    </div>
                    <h4 className="pdetail-product-name">{matchedProduct.name}</h4>
                    <p className="pdetail-product-story">
                      &ldquo;{matchedProduct.story}&rdquo;
                    </p>
                    <div className="pdetail-product-foot">
                      <span className="pdetail-product-price">{matchedProduct.price}</span>
                      <Link
                        href="/universe/shop"
                        className="pdetail-product-cta"
                      >
                        {D_TEXT.wearFreq[lang]}
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer nav between plants */}
      <PlantNav currentId={plant.id} lang={lang} />
    </main>
  );
}

/** Prev / next plant ribbon footer. */
function PlantNav({ currentId, lang }: { currentId: string; lang: "tr" | "en" }) {
  const idx = nameOrder.indexOf(currentId);
  const prev = nameOrder[(idx - 1 + nameOrder.length) % nameOrder.length];
  const next = nameOrder[(idx + 1) % nameOrder.length];

  return (
    <footer className="pdetail-foot">
      <Link href={`/universe/gaia/plants/${prev}`} className="pdetail-foot-link">
        {D_TEXT.prevPlant[lang]}
      </Link>
      <Link href="/universe/gaia/plants" className="pdetail-foot-mid">
        {D_TEXT.allPlants[lang]}
      </Link>
      <Link href={`/universe/gaia/plants/${next}`} className="pdetail-foot-link">
        {D_TEXT.nextPlant[lang]}
      </Link>
    </footer>
  );
}

const nameOrder: string[] = plants.map((p) => p.id);

function pickPlantColor(id: string): string {
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

function pickPlantGlow(id: string): string {
  return pickPlantColor(id) + "55";
}

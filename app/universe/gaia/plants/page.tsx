"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { plants, MOOD_LABELS, type Mood, type GaiaPlant } from "@/data/gaia";
import {
  FLORA_STATS,
  PHYTOGEOGRAPHIES,
  FLORA_GROUPS,
  FLORA_PULL_QUOTE,
  type FloraGroup,
} from "@/data/anatolia-flora";
import { useProfileStore } from "@/stores/profile-store";
import { useLangStore } from "@/stores/lang-store";
import PlantsPersonalCard from "./_components/PlantsPersonalCard";

const UI_TEXT = {
  kicker:        { tr: "Anadolu · Toprak Hafızası", en: "Anatolia · Soil Memory" },
  titleA:        { tr: "Bin yıl bekleyen", en: "A garden waiting" },
  titleB:        { tr: "bir bahçe.", en: "a thousand years." },
  lede: {
    tr: "Türkiye, üç bitki bölgesinin tek bir toprakta kesiştiği, on bini aşkın türle nefes alan ender bir coğrafyadır. Bunların binlercesi yalnızca burada doğar — başka hiçbir yerde değil.",
    en: "Turkey is a rare geography where three plant regions meet on a single soil, breathing through more than ten thousand species. Thousands of them are born only here — nowhere else.",
  },
  zonesMark:     { tr: "Üç ekosistem · tek toprak", en: "Three ecosystems · one soil" },
  zoneOpenHint:  { tr: "bitki gruplarını aç", en: "open plant groups" },
  zoneCloseHint: { tr: "kapat", en: "close" },
  arrow:         { tr: "↓ Sana fısıldayan bitkiyi tanı ↓", en: "↓ Meet the plant that whispers to you ↓" },
  filtersAria:   { tr: "Etki filtreleri", en: "Mood filters" },
  filterAll:     { tr: "Tümü", en: "All" },
  yourPlant:     { tr: "SENİN BİTKİN", en: "YOUR PLANT" },
  meetPlant:     { tr: "Bu bitkiyi tanı", en: "Meet this plant" },
  back:          { tr: "← Gaia's Garden'a Dön", en: "← Back to Gaia's Garden" },
  langTr:        { tr: "TR", en: "TR" },
  langEn:        { tr: "EN", en: "EN" },
  langSwitchAria:{ tr: "Dil seçimi", en: "Language switch" },
} as const;

const REGION_LABEL: Record<GaiaPlant["region"], { tr: string; en: string }> = {
  "ege":          { tr: "Ege",          en: "Aegean" },
  "akdeniz":      { tr: "Akdeniz",      en: "Mediterranean" },
  "ic-anadolu":   { tr: "İç Anadolu",   en: "Central Anatolia" },
  "karadeniz":    { tr: "Karadeniz",    en: "Black Sea" },
  "guneydogu":    { tr: "Güneydoğu",    en: "Southeast Anatolia" },
  "dogu-anadolu": { tr: "Doğu Anadolu", en: "Eastern Anatolia" },
  "marmara":      { tr: "Marmara",      en: "Marmara" },
};

const REGION_FALLBACK = { tr: "Anadolu", en: "Anatolia" } as const;

const MOOD_ORDER: (Mood | "all")[] = [
  "all",
  "sleep",
  "focus",
  "heart",
  "cleansing",
  "awakening",
  "clarity",
  "grounding",
  "joy",
];

export default function GaiaPlantsPage() {
  const profile = useProfileStore((s) => s.profile);

  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const langHydrated = useLangStore((s) => s.hydrated);
  const hydrateLang = useLangStore((s) => s.hydrate);

  // Read persisted language preference once on mount.
  useEffect(() => {
    if (!langHydrated) hydrateLang();
  }, [langHydrated, hydrateLang]);

  const [filter, setFilter] = useState<Mood | "all">("all");

  const filtered = useMemo<GaiaPlant[]>(() => {
    const list =
      filter === "all" ? plants : plants.filter((p) => p.moods.includes(filter));
    if (!profile) return list;
    // Place the user's matched plant first for a personalized feel.
    return [...list].sort((a, b) => {
      if (a.solfeggioMatch === profile.frequency && b.solfeggioMatch !== profile.frequency) return -1;
      if (b.solfeggioMatch === profile.frequency && a.solfeggioMatch !== profile.frequency) return 1;
      return 0;
    });
  }, [filter, profile]);

  const yourPlantId = useMemo(() => {
    if (!profile) return null;
    const exact = plants.find((p) => p.solfeggioMatch === profile.frequency);
    return exact?.id ?? null;
  }, [profile]);

  return (
    <main className="plants-page plants-page--cosmic">
      <div className="plants-cosmic-bg" aria-hidden="true" />
      <div className="plants-overlay" />
      <div className="plants-vignette" />

      <div className="plants-rain" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={`plants-beam beam-${i % 6}`}
            style={{
              left: `${3 + i * 6}%`,
              animationDelay: `${i * 0.45}s`,
              animationDuration: `${7 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <section className="plants-shell">
        {/* Language switch (TR / EN) — inline, right-aligned, never overlaps the header */}
        <div className="plants-lang-row">
          <div
            className="plants-lang-switch"
            role="group"
            aria-label={UI_TEXT.langSwitchAria[lang]}
          >
            <button
              type="button"
              className={`plants-lang-btn ${lang === "tr" ? "is-active" : ""}`}
              aria-pressed={lang === "tr"}
              onClick={() => setLang("tr")}
            >
              TR
            </button>
            <span className="plants-lang-divider" aria-hidden="true">·</span>
            <button
              type="button"
              className={`plants-lang-btn ${lang === "en" ? "is-active" : ""}`}
              aria-pressed={lang === "en"}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
        </div>

        {/* SENİN FREKANSIN — kişiselleştirme kartı */}
        <PlantsPersonalCard />

        {/* MOOD FILTERS */}
        <div className="plants-filters" role="tablist" aria-label={UI_TEXT.filtersAria[lang]}>
          {MOOD_ORDER.map((m) => {
            const isAll = m === "all";
            const label = isAll ? UI_TEXT.filterAll[lang] : MOOD_LABELS[m][lang];
            const symbol = isAll ? "✦" : MOOD_LABELS[m].symbol;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={filter === m}
                className={`plants-filter ${filter === m ? "is-active" : ""}`}
                onClick={() => setFilter(m)}
              >
                <span className="plants-filter-symbol" aria-hidden="true">{symbol}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <section className="plants-list-section">
          <div className="plants-vertical-list">
            {filtered.map((plant) => {
              const isYours = plant.id === yourPlantId;
              return (
                <Link
                  key={plant.id}
                  href={`/universe/gaia/plants/${plant.id}`}
                  className={`plants-row-card ${isYours ? "is-yours" : ""}`}
                  aria-label={`${plant.name[lang]} — ${UI_TEXT.meetPlant[lang]}`}
                >
                  <div className="plants-row-image-wrap">
                    <img
                      src={plant.image}
                      alt={plant.name[lang]}
                      className="plants-row-image"
                      draggable={false}
                    />
                  </div>

                  <div className="plants-row-content">
                    <div className="plants-row-top">
                      <h3>{plant.name[lang]}</h3>
                      <span className="plants-row-freq">{plant.frequency} Hz</span>
                    </div>

                    <div className="plants-row-region">
                      {plant.scientific} · <em>{(REGION_LABEL[plant.region] ?? REGION_FALLBACK)[lang]}</em>
                    </div>
                    <p className="plants-row-poetic">{plant.poetic[lang]}</p>

                    <div className="plants-row-moods">
                      {plant.moods.map((mood) => {
                        const lbl = MOOD_LABELS[mood];
                        if (!lbl) return null;
                        return (
                          <span key={mood} className="plants-row-mood">
                            {lbl.symbol} {lbl[lang]}
                          </span>
                        );
                      })}
                    </div>

                    <span className="plants-row-cta" aria-hidden="true">
                      {UI_TEXT.meetPlant[lang]} <span className="plants-row-cta-arrow">→</span>
                    </span>
                  </div>

                  {isYours && (
                    <span className="plants-row-flag">{UI_TEXT.yourPlant[lang]}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── ANADOLU TOPRAK HAFIZASI — sayfa sonu manifestosu ─── */}
        <section className="anatolia-hero anatolia-hero--footer" aria-labelledby="anatolia-heading">
          <div className="anatolia-kicker">
            <span className="anatolia-kicker-dot">✦</span>
            <span>{UI_TEXT.kicker[lang]}</span>
            <span className="anatolia-kicker-dot">✦</span>
          </div>

          <h2 id="anatolia-heading" className="anatolia-title">
            {UI_TEXT.titleA[lang]}<br />
            <em>{UI_TEXT.titleB[lang]}</em>
          </h2>

          <p className="anatolia-lede">{UI_TEXT.lede[lang]}</p>

          {/* Big numbers */}
          <div className="anatolia-stats">
            {FLORA_STATS.map((stat) => (
              <article key={stat.number} className="anatolia-stat">
                <div className="anatolia-stat-number">{stat.number}</div>
                <div className="anatolia-stat-label">{stat.label[lang]}</div>
                <p className="anatolia-stat-whisper">{stat.whisper[lang]}</p>
              </article>
            ))}
          </div>

          {/* Three phytogeographic regions */}
          <div className="anatolia-zones-head">
            <span className="anatolia-zones-line" aria-hidden="true" />
            <span className="anatolia-zones-mark">{UI_TEXT.zonesMark[lang]}</span>
            <span className="anatolia-zones-line" aria-hidden="true" />
          </div>

          <div className="anatolia-zones">
            {PHYTOGEOGRAPHIES.map((zone) => {
              const zoneGroups: FloraGroup[] = zone.groupIds
                .map((id) => FLORA_GROUPS.find((g) => g.id === id))
                .filter((g): g is FloraGroup => Boolean(g));
              return (
                <details
                  key={zone.id}
                  className={`anatolia-zone zone-${zone.id}`}
                >
                  <summary className="anatolia-zone-summary">
                    <div className="anatolia-zone-symbol" aria-hidden="true">
                      {zone.symbol}
                    </div>
                    <div className="anatolia-zone-name">{zone.name[lang]}</div>
                    <div className="anatolia-zone-zone">{zone.zone[lang]}</div>
                    <p className="anatolia-zone-signature">{zone.signature[lang]}</p>
                    <span className="anatolia-zone-toggle" aria-hidden="true">
                      <span className="anatolia-zone-toggle-label anatolia-zone-toggle-label--open">
                        {UI_TEXT.zoneOpenHint[lang]}
                      </span>
                      <span className="anatolia-zone-toggle-label anatolia-zone-toggle-label--close">
                        {UI_TEXT.zoneCloseHint[lang]}
                      </span>
                      <span className="anatolia-zone-toggle-icon">+</span>
                    </span>
                  </summary>

                  <div className="anatolia-zone-groups">
                    {zoneGroups.map((group) => (
                      <div key={group.id} className="anatolia-zone-group">
                        <div className="anatolia-zone-group-head">
                          <span className="anatolia-zone-group-symbol" aria-hidden="true">
                            {group.symbol}
                          </span>
                          <span className="anatolia-zone-group-kicker">
                            {group.kicker[lang]}
                          </span>
                          <span className="anatolia-zone-group-name">
                            {group.name[lang]}
                          </span>
                        </div>
                        <div className="anatolia-zone-group-examples">
                          {group.examples.map((ex) => (
                            <span key={ex} className="anatolia-zone-group-example">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>

          {/* Pull quote */}
          <blockquote className="anatolia-quote">
            {FLORA_PULL_QUOTE[lang].split("\n").map((line, i) => (
              <span key={i} className="anatolia-quote-line">
                {line}
              </span>
            ))}
          </blockquote>
        </section>

        <div className="plants-bottom">
          <Link href="/universe/gaia" className="plants-back">
            {UI_TEXT.back[lang]}
          </Link>
        </div>
      </section>
    </main>
  );
}


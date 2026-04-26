"use client";

/**
 * CAELINUS — Toprak Atlası
 *
 * 81 Turkish provinces, grouped by 7 phytogeographic regions, each
 * speaking with the Caelinus plants most native to it.
 *
 * "Toprak = hafıza. Bitki = ifade."
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { useLangStore } from "@/stores/lang-store";
import {
  PROVINCES,
  PROVINCE_REGIONS,
  type Province,
  type ProvinceRegionId,
  getProvinceRegion,
} from "@/data/provinces";
import { plants as ALL_PLANTS } from "@/data/gaia";
import HologramTurkey from "./_components/HologramTurkey";
import MatrixRain from "./_components/MatrixRain";
import StarField from "./_components/StarField";

/**
 * The interactive 81-province map carries ~72 KB of pre-projected SVG
 * path data. We lazy-load it so the rest of the atlas page stays light
 * and the map only enters the bundle when this route is hit.
 */
const TurkeyMapInteractive = dynamic(
  () => import("./_components/TurkeyMapInteractive"),
  {
    ssr: false,
    loading: () => (
      <div className="atlas-map-loading" aria-hidden>
        <span className="atlas-map-loading-pulse" />
        <span className="atlas-map-loading-text">Toprak yükleniyor…</span>
      </div>
    ),
  },
);

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

/** "#9aaa6a" -> "154, 170, 106" — used as a CSS rgba() triplet. */
function hexToRgbTriple(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/* ─────────────────────────────────────────────
   COPY
   ───────────────────────────────────────────── */

const UI = {
  tr: {
    eyebrow: "TOPRAK ATLASI",
    title: "81 il, tek bahçe.",
    manifesto:
      "Türkiye, 10.000+ bitki türünün buluştuğu üç farklı doğa sisteminin kesişimidir. Burada her toprak başka bir hatırlama biçimi — her bitki o toprağın ifadesi.",
    pillFreq: "396 Hz · Yer Frekansı",
    backToGaia: "Gaia'ya dön",
    plantsLink: "Konuşan Bitkiler",
    statProvince: "İl",
    statRegion: "Fitocoğrafi Bölge",
    statPlant: "Bitki",
    statSpecies: "Bitki Türü",
    filterAll: "Tüm Türkiye",
    filterCount: (n: number) => `${n} il`,
    showing: (visible: number, total: number) =>
      `${visible} / ${total} il görünüyor`,
    panelEyebrow: "TOPRAK · KARAKTER",
    panelSoil: "Toprak",
    panelClimate: "İklim",
    panelMicroclimate: "Mikro-iklim",
    panelPhilosophy: "Toprak felsefesi",
    panelLandmarks: "Coğrafi izler",
    panelSignature: "Bölgenin imza bitkileri",
    panelWhisper: "Bu il fısıldıyor",
    panelPlants: "Burada konuşan bitkiler",
    panelClose: "Paneli kapat",
    panelCta: "Bitkiyi dinle",
    panelPlantCount: (n: number) => `${n} bitki`,
    selectHint: "Bir il seç — toprağı ve bitkileri sana fısıldasın.",
    region: "Bölge",
    badgeSignature: "★ İmza",
    badgeStudio: "♪ Stüdyo sesi",
    badgeSpeech: "◐ Geçici ses",
    badgeStudioTip: "ElevenLabs ile kayıt edilmiş profesyonel ses.",
    badgeSpeechTip: "Geçici Web Speech sesi — stüdyo kaydı yolda.",
    mapEyebrow: "CANLI HARİTA",
    mapTitle: "Toprak üzerinden dokun.",
    mapHint:
      "İlin üstüne gel — fısıltısı duyulsun. Dokun — toprağı seninle konuşsun.",
    mapLegendActive: "Seçili",
    mapLegendDimmed: "Diğer bölgeler",
    gridEyebrow: "PLAKA SIRASI",
    gridTitle: "İlleri liste olarak gez",
    gridHint: "Harita üzerinde aramak istemiyorsan plakaya göre seçim yapabilirsin.",
  },
  en: {
    eyebrow: "SOIL ATLAS",
    title: "81 provinces, one garden.",
    manifesto:
      "Turkey is the meeting of three botanical systems and 10,000+ plant species. Each soil is a different way of remembering — each plant the voice of that soil.",
    pillFreq: "396 Hz · Earth Frequency",
    backToGaia: "Back to Gaia",
    plantsLink: "Speaking Plants",
    statProvince: "Provinces",
    statRegion: "Phytogeographic Regions",
    statPlant: "Plants",
    statSpecies: "Plant Species",
    filterAll: "All Türkiye",
    filterCount: (n: number) => `${n} provinces`,
    showing: (visible: number, total: number) =>
      `${visible} of ${total} provinces shown`,
    panelEyebrow: "SOIL · CHARACTER",
    panelSoil: "Soil",
    panelClimate: "Climate",
    panelMicroclimate: "Microclimate",
    panelPhilosophy: "Soil philosophy",
    panelLandmarks: "Geographic traces",
    panelSignature: "Region's signature plants",
    panelWhisper: "What this province whispers",
    panelPlants: "Plants speaking here",
    panelClose: "Close panel",
    panelCta: "Listen to the plant",
    panelPlantCount: (n: number) => `${n} plants`,
    selectHint: "Choose a province — let its soil and plants whisper to you.",
    region: "Region",
    badgeSignature: "★ Signature",
    badgeStudio: "♪ Studio voice",
    badgeSpeech: "◐ Live voice",
    badgeStudioTip: "Professional voice recorded with ElevenLabs.",
    badgeSpeechTip: "Temporary Web Speech voice — studio recording on the way.",
    mapEyebrow: "LIVE MAP",
    mapTitle: "Touch the soil itself.",
    mapHint:
      "Hover a province — let its whisper rise. Click — let its soil speak with you.",
    mapLegendActive: "Selected",
    mapLegendDimmed: "Other regions",
    gridEyebrow: "BY PLATE NUMBER",
    gridTitle: "Browse provinces as a list",
    gridHint: "Prefer not to search on the map? Pick by plate number below.",
  },
} as const;

/**
 * Shared shape for either-language UI copy.
 *
 * `UI` is `as const`, so `UI.tr` and `UI.en` end up as two structurally
 * identical but nominally distinct literal types. `t = UI[lang]` widens
 * to their union, but sub-components were typed as just `UI.tr`, which
 * TypeScript rejects ("Two different types with this name"). This alias
 * captures the union explicitly so panels accept either language.
 */
type AtlasCopy = (typeof UI)[keyof typeof UI];

/**
 * Plants that already have ElevenLabs MP3 audio under
 * `/audio/plants/{id}.{lang}.mp3`. Anything else falls back to
 * the Web Speech API in <PlantVoice />.
 */
const VOICED_PLANTS = new Set<string>([
  "lavanta", "gul", "zeytin", "biberiye", "adacayi", "melisa", "yasemin",
  "defne", "nane", "cay", "isirgan", "sumak", "kekik", "safran", "kantaron",
  "rezene", "geven", "mese", "sedir", "ladin", "ceviz", "findik",
  "antepfistigi", "murdum-erigi", "yesilerik", "enginar", "kereviz",
  "fasulye", "kudretnari",
]);

/* ─────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────── */

export default function AtlasPage() {
  const { lang, hydrate } = useLangStore();
  const [activeRegion, setActiveRegion] = useState<ProvinceRegionId | "all">(
    "all"
  );
  const [activeProvinceId, setActiveProvinceId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Force the cosmic void onto html/body while this page is mounted.
  useEffect(() => {
    document.documentElement.classList.add("atlas-host");
    document.body.classList.add("atlas-host");
    return () => {
      document.documentElement.classList.remove("atlas-host");
      document.body.classList.remove("atlas-host");
    };
  }, []);

  // Deep-link support: incoming `#plate-XX` hash auto-selects the
  // province with that plate. Used by the AI frequency reading page
  // to highlight the region's signature province on arrival.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function selectFromHash() {
      const m = /^#plate-(\d{2})$/.exec(window.location.hash);
      if (!m) return;
      const plate = m[1];
      const target = PROVINCES.find((p) => p.plate === plate);
      if (target) {
        setActiveProvinceId(target.id);
        // also pin the region filter to the province's region so the
        // map glows the same biome the AI reading hinted at
        setActiveRegion(target.regionId);
        window.requestAnimationFrame(() => {
          document
            .getElementById("atlas-panel")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  const t = UI[lang];

  const visibleProvinces = useMemo(() => {
    if (activeRegion === "all") return PROVINCES;
    return PROVINCES.filter((p) => p.regionId === activeRegion);
  }, [activeRegion]);

  const activeProvince = useMemo<Province | null>(
    () => PROVINCES.find((p) => p.id === activeProvinceId) ?? null,
    [activeProvinceId]
  );

  function selectProvince(id: string) {
    setActiveProvinceId(id);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document
          .getElementById("atlas-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  return (
    <main className="atlas-page">
      {/* cosmic backdrop ─────────────────────────── */}
      <div className="atlas-void" aria-hidden />
      <StarField count={260} />
      <MatrixRain opacity={0.18} fontSize={16} />
      <HologramTurkey
        activeRegion={activeRegion}
        activeProvinceId={activeProvinceId}
      />

      {/* hero ───────────────────────────────────── */}
      <section className="atlas-hero">
        <div className="atlas-hero-head">
          <Link href="/universe/gaia" className="atlas-back">
            ← {t.backToGaia}
          </Link>
          <LangSwitch />
        </div>

        <p className="atlas-eyebrow">{t.eyebrow}</p>
        <h1 className="atlas-title">{t.title}</h1>
        <p className="atlas-manifesto">{t.manifesto}</p>

        <div className="atlas-pillrow">
          <span className="atlas-pill atlas-pill-freq">{t.pillFreq}</span>
          <Link href="/universe/gaia/plants" className="atlas-pill atlas-pill-link">
            ↗ {t.plantsLink}
          </Link>
        </div>
      </section>

      {/* stats strip ────────────────────────────── */}
      <section className="atlas-stats" aria-label="Atlas overview">
        <div className="atlas-stat">
          <span className="atlas-stat-num">81</span>
          <span className="atlas-stat-label">{t.statProvince}</span>
        </div>
        <span className="atlas-stat-sep" aria-hidden />
        <div className="atlas-stat">
          <span className="atlas-stat-num">7</span>
          <span className="atlas-stat-label">{t.statRegion}</span>
        </div>
        <span className="atlas-stat-sep" aria-hidden />
        <div className="atlas-stat">
          <span className="atlas-stat-num">{ALL_PLANTS.length}</span>
          <span className="atlas-stat-label">{t.statPlant}</span>
        </div>
        <span className="atlas-stat-sep" aria-hidden />
        <div className="atlas-stat">
          <span className="atlas-stat-num">10K+</span>
          <span className="atlas-stat-label">{t.statSpecies}</span>
        </div>
      </section>

      {/* region filters ─────────────────────────── */}
      <section className="atlas-filters">
        <button
          type="button"
          className={
            "atlas-region-chip" + (activeRegion === "all" ? " is-active" : "")
          }
          onClick={() => setActiveRegion("all")}
          style={{ ["--chip-tone" as string]: hexToRgbTriple("#cfa6ff") }}
        >
          <span className="atlas-region-chip-name">{t.filterAll}</span>
          <span className="atlas-region-chip-count">
            {t.filterCount(PROVINCES.length)}
          </span>
        </button>

        {PROVINCE_REGIONS.map((region) => {
          const count = PROVINCES.filter((p) => p.regionId === region.id).length;
          const isActive = activeRegion === region.id;
          return (
            <button
              key={region.id}
              type="button"
              className={
                "atlas-region-chip" + (isActive ? " is-active" : "")
              }
              onClick={() =>
                setActiveRegion(isActive ? "all" : region.id)
              }
              style={{ ["--chip-tone" as string]: hexToRgbTriple(region.tone) }}
            >
              <span className="atlas-region-chip-name">{region.name[lang]}</span>
              <span className="atlas-region-chip-count">
                {t.filterCount(count)}
              </span>
            </button>
          );
        })}
      </section>

      {/* visible counter ────────────────────────── */}
      <p className="atlas-counter" aria-live="polite">
        <span className="atlas-counter-dot" aria-hidden />
        {t.showing(visibleProvinces.length, PROVINCES.length)}
      </p>

      {/* INTERACTIVE MAP — primary surface ───────── */}
      <section className="atlas-map-section" aria-label={t.mapTitle}>
        <header className="atlas-map-header">
          <p className="atlas-eyebrow">{t.mapEyebrow}</p>
          <h2 className="atlas-map-title">{t.mapTitle}</h2>
          <p className="atlas-map-hint">{t.mapHint}</p>
        </header>

        <TurkeyMapInteractive
          lang={lang}
          activeRegion={activeRegion}
          activeProvinceId={activeProvinceId}
          onSelect={selectProvince}
          t={{ region: t.region }}
        />

        <div className="atlas-map-legend" aria-hidden>
          <span className="atlas-map-legend-item is-active">
            <span className="atlas-map-legend-swatch" />
            {t.mapLegendActive}
          </span>
          <span className="atlas-map-legend-item is-dimmed">
            <span className="atlas-map-legend-swatch" />
            {t.mapLegendDimmed}
          </span>
        </div>
      </section>

      {/* provinces grid — secondary, plate-ordered ── */}
      <section className="atlas-grid-section" aria-label={t.gridTitle}>
        <header className="atlas-grid-header">
          <p className="atlas-eyebrow">{t.gridEyebrow}</p>
          <h2 className="atlas-grid-title">{t.gridTitle}</h2>
          <p className="atlas-grid-hint">{t.gridHint}</p>
        </header>

        <div className="atlas-grid">
          {visibleProvinces.map((province) => {
            const region = getProvinceRegion(province.regionId);
            const isActive = province.id === activeProvinceId;
            return (
              <button
                key={province.id}
                type="button"
                className={"atlas-cell" + (isActive ? " is-active" : "")}
                style={{
                  ["--cell-tone" as string]: hexToRgbTriple(region.tone),
                }}
                onClick={() => selectProvince(province.id)}
                aria-pressed={isActive}
              >
                <span className="atlas-cell-plate">{province.plate}</span>
                <span className="atlas-cell-name">{province.name[lang]}</span>
                <span className="atlas-cell-region">{region.name[lang]}</span>
                <span className="atlas-cell-dots">
                  {Array.from({
                    length: Math.min(province.plantIds.length, 5),
                  }).map((_, i) => (
                    <span key={i} className="atlas-cell-dot" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* panel ──────────────────────────────────── */}
      <section id="atlas-panel" className="atlas-panel-wrap">
        {activeProvince ? (
          <ProvincePanel
            province={activeProvince}
            lang={lang}
            t={t}
            onClose={() => setActiveProvinceId(null)}
          />
        ) : (
          <div className="atlas-panel-empty">
            <span className="atlas-panel-empty-glow" aria-hidden />
            <p>{t.selectHint}</p>
          </div>
        )}
      </section>
    </main>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────── */

function LangSwitch() {
  const { lang, setLang } = useLangStore();
  return (
    <div className="atlas-lang-switch" role="group" aria-label="Language">
      <button
        type="button"
        className={"atlas-lang-btn" + (lang === "tr" ? " is-active" : "")}
        onClick={() => setLang("tr")}
      >
        TR
      </button>
      <button
        type="button"
        className={"atlas-lang-btn" + (lang === "en" ? " is-active" : "")}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}

type PanelProps = {
  province: Province;
  lang: "tr" | "en";
  t: AtlasCopy;
  onClose: () => void;
};

function ProvincePanel({ province, lang, t, onClose }: PanelProps) {
  const region = getProvinceRegion(province.regionId);

  const soil = region.soil[lang];
  const climate = region.climate[lang];
  const microclimate = region.microclimate[lang];
  const philosophy = region.philosophy[lang];
  const landmarks = region.landmarks[lang];
  const whisper = (province.signature ?? region.whisper)[lang];
  const signaturePlantIds = new Set(region.signaturePlants);

  const provincePlants = useMemo(() => {
    const lookup = new Map(ALL_PLANTS.map((p) => [p.id, p]));
    const enriched = province.plantIds
      .map((id) => lookup.get(id))
      .filter((p): p is (typeof ALL_PLANTS)[number] => Boolean(p));
    // Signature plants of the region float to the top of the chip list.
    return enriched.slice().sort((a, b) => {
      const aSig = signaturePlantIds.has(a.id) ? 0 : 1;
      const bSig = signaturePlantIds.has(b.id) ? 0 : 1;
      if (aSig !== bSig) return aSig - bSig;
      return 0;
    });
  }, [province, signaturePlantIds]);

  // Region's signature plants — always shown even if the province
  // doesn't list them, so visitors learn what *defines* the region.
  const signaturePlants = useMemo(() => {
    const lookup = new Map(ALL_PLANTS.map((p) => [p.id, p]));
    return region.signaturePlants
      .map((id) => lookup.get(id))
      .filter((p): p is (typeof ALL_PLANTS)[number] => Boolean(p));
  }, [region.signaturePlants]);

  return (
    <article
      className="atlas-panel"
      style={{ ["--panel-tone" as string]: hexToRgbTriple(region.tone) }}
    >
      <header className="atlas-panel-head">
        <div>
          <p className="atlas-panel-eyebrow">{t.panelEyebrow}</p>
          <h2 className="atlas-panel-title">
            <span className="atlas-panel-plate">{province.plate}</span>
            {province.name[lang]}
          </h2>
          <p className="atlas-panel-region">
            {t.region} · <em>{region.name[lang]}</em>
          </p>
        </div>
        <button
          type="button"
          className="atlas-panel-close"
          onClick={onClose}
          aria-label={t.panelClose}
        >
          ×
        </button>
      </header>

      <dl className="atlas-panel-grid">
        <div className="atlas-panel-cell">
          <dt>{t.panelSoil}</dt>
          <dd>{soil}</dd>
        </div>
        <div className="atlas-panel-cell">
          <dt>{t.panelClimate}</dt>
          <dd>{climate}</dd>
        </div>
        <div className="atlas-panel-cell atlas-panel-cell-wide">
          <dt>{t.panelMicroclimate}</dt>
          <dd>{microclimate}</dd>
        </div>
      </dl>

      <blockquote className="atlas-panel-whisper">
        <span className="atlas-panel-whisper-mark" aria-hidden>
          “
        </span>
        <p>{whisper}</p>
      </blockquote>

      {/* Region signature plants ─ always 3 ─ */}
      <section className="atlas-panel-signature">
        <h3 className="atlas-panel-section-title">{t.panelSignature}</h3>
        <div className="atlas-panel-plants-list">
          {signaturePlants.map((plant) => (
            <PlantChip
              key={plant.id}
              plant={plant}
              lang={lang}
              t={t}
              isSignature
              hasStudioVoice={VOICED_PLANTS.has(plant.id)}
            />
          ))}
        </div>
      </section>

      {/* Province-specific plants ─ */}
      <section className="atlas-panel-plants">
        <h3 className="atlas-panel-plants-title">
          {t.panelPlants}
          <span className="atlas-panel-plants-count">
            {t.panelPlantCount(provincePlants.length)}
          </span>
        </h3>
        <div className="atlas-panel-plants-list">
          {provincePlants.map((plant) => (
            <PlantChip
              key={plant.id}
              plant={plant}
              lang={lang}
              t={t}
              isSignature={signaturePlantIds.has(plant.id)}
              hasStudioVoice={VOICED_PLANTS.has(plant.id)}
            />
          ))}
        </div>
      </section>

      {/* Landmarks ─ */}
      {landmarks.length > 0 && (
        <section className="atlas-panel-landmarks">
          <h3 className="atlas-panel-section-title">{t.panelLandmarks}</h3>
          <ul className="atlas-panel-landmark-list">
            {landmarks.map((mark) => (
              <li key={mark} className="atlas-panel-landmark">
                {mark}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Philosophy ─ a closing voice ─ */}
      <p className="atlas-panel-philosophy">
        <span className="atlas-panel-philosophy-eyebrow">
          {t.panelPhilosophy}
        </span>
        {philosophy}
      </p>
    </article>
  );
}

/* ─────────────────────────────────────────────
   PLANT CHIP — used by signature & province lists
   ───────────────────────────────────────────── */

type ChipProps = {
  plant: (typeof ALL_PLANTS)[number];
  lang: "tr" | "en";
  t: AtlasCopy;
  isSignature: boolean;
  hasStudioVoice: boolean;
};

function PlantChip({ plant, lang, t, isSignature, hasStudioVoice }: ChipProps) {
  const voiceBadge = hasStudioVoice ? t.badgeStudio : t.badgeSpeech;
  const voiceTip = hasStudioVoice ? t.badgeStudioTip : t.badgeSpeechTip;
  const voiceClass = hasStudioVoice ? "is-studio" : "is-speech";

  return (
    <Link
      href={`/universe/gaia/plants/${plant.id}`}
      className={
        "atlas-plant-chip" + (isSignature ? " is-signature" : "")
      }
    >
      <span className="atlas-plant-chip-dot" aria-hidden />
      <span className="atlas-plant-chip-name">{plant.name[lang]}</span>
      <span className="atlas-plant-chip-freq">{plant.frequency} Hz</span>
      <span className="atlas-plant-chip-badges">
        {isSignature && (
          <span className="atlas-plant-badge is-signature">
            {t.badgeSignature}
          </span>
        )}
        <span
          className={`atlas-plant-badge ${voiceClass}`}
          title={voiceTip}
        >
          {voiceBadge}
        </span>
      </span>
      <span className="atlas-plant-chip-cta">↗</span>
    </Link>
  );
}

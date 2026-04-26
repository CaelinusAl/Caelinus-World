"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useLangStore } from "@/stores/lang-store";
import { useSanctumStore } from "@/stores/sanctum-store";
import {
  plants,
  regions,
  MOOD_LABELS,
  type Mood,
  type RegionId,
} from "@/data/gaia";
import { SOLFEGGIO, type SolfeggioHz } from "@/lib/frequency";
import {
  buildMemoryReading,
  poeticSummary,
  type DailyDot,
  type MemoryReading,
} from "@/lib/sanctum/memory";

/* ───── i18n ───── */
const T = {
  ribbonMark: { tr: "CAELINUS · SANCTUM · HAFIZA HATTI", en: "CAELINUS · SANCTUM · MEMORY LINE" },
  back: { tr: "Sanctum'a dön", en: "Back to Sanctum" },
  langAria: { tr: "Dil", en: "Language" },

  kicker: { tr: "✦ DESEN OKUMASI ✦", en: "✦ THE PATTERN READING ✦" },
  title: { tr: "Hafıza Hattı", en: "Memory Line" },
  subtitle: {
    tr: "Toprak senin gündelik nefesini desenler halinde tutar — son haftaların mood'u, frekansı, bölgesi, en sık ziyaret edilen bitkin.",
    en: "The soil keeps your daily breath in patterns — the mood, frequency, region and most-met plant of your recent weeks.",
  },

  windowLabel: { tr: "zaman penceresi", en: "time window" },
  win7: { tr: "7 gün", en: "7 days" },
  win30: { tr: "30 gün", en: "30 days" },
  win90: { tr: "90 gün", en: "90 days" },

  /* daily ring */
  ringTitle: {
    tr: (n: number) => `Son ${n} günün halkası`,
    en: (n: number) => `The ring of the last ${n} days`,
  },
  ringHint: {
    tr: "Altın nokta · sayfa yazıldı   ✦   Yeşil halka · ritüel yapıldı   ✦   Sönük · sessiz gün",
    en: "Gold dot · a page was written   ✦   Green ring · a ritual was practised   ✦   Dim · a silent day",
  },
  activeDays: {
    tr: (active: number, total: number) => `${active} / ${total} gün konuştun`,
    en: (active: number, total: number) => `${active} / ${total} days you spoke`,
  },

  /* mood card */
  moodCardTitle: { tr: "Mood haritası", en: "Mood map" },
  moodCardEmpty: { tr: "Henüz mood izi yok.", en: "No mood trace yet." },

  /* hz card */
  hzCardTitle: { tr: "Solfeggio bantları", en: "Solfeggio bands" },
  hzCardEmpty: { tr: "Henüz frekans izi yok.", en: "No frequency trace yet." },

  /* region card */
  regionCardTitle: { tr: "Toprak bağı", en: "Soil bond" },
  regionCardEmpty: {
    tr: "Henüz bölge izi yok — bir bitki seç, defterine yaz.",
    en: "No region trace yet — pick a plant, write a page.",
  },

  /* plants card */
  topPlantsTitle: { tr: "En sık buluştukların", en: "Whom you met the most" },
  topPlantsEmpty: {
    tr: "Henüz bir bitki ile yeterince oturmadın.",
    en: "You haven't sat with a plant enough yet.",
  },
  metTimes: {
    tr: (n: number) => `${n} kez`,
    en: (n: number) => `${n} times`,
  },

  /* totals strip */
  pages: { tr: "yazılı sayfa", en: "written pages" },
  rituals: { tr: "ritüel", en: "rituals" },
  active: { tr: "aktif gün", en: "active day(s)" },
};

/* ───── Region labels (single source of truth: gaia.regions) ───── */
const REGION_NAMES: Record<RegionId, { tr: string; en: string }> = (() => {
  const out = {} as Record<RegionId, { tr: string; en: string }>;
  for (const r of regions) out[r.id] = r.name;
  return out;
})();

const ALL_MOODS: Mood[] = [
  "sleep",
  "focus",
  "heart",
  "cleansing",
  "awakening",
  "clarity",
  "grounding",
  "joy",
];

const PLANTS_BY_ID = new Map(plants.map((p) => [p.id, p]));

type WindowKey = 7 | 30 | 90;

/* ───── DAILY RING SVG ─────
   Renders N dots arranged on a circle. Newest at top (12 o'clock),
   walking clockwise back through history. */

function DailyRing({
  dots,
  size = 320,
  lang,
}: {
  dots: DailyDot[];
  size?: number;
  lang: "tr" | "en";
}) {
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const N = dots.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="memory-ring-svg"
      role="img"
      aria-label={T.ringTitle[lang](N)}
    >
      <defs>
        <radialGradient id="memory-ring-bg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(228,184,116,0.16)" />
          <stop offset="55%" stopColor="rgba(228,184,116,0.05)" />
          <stop offset="100%" stopColor="rgba(8,6,16,0)" />
        </radialGradient>
        <radialGradient id="memory-dot-on" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffe2a8" />
          <stop offset="60%" stopColor="#e4b874" />
          <stop offset="100%" stopColor="#a8865a" />
        </radialGradient>
        <radialGradient id="memory-dot-both" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff5d2" />
          <stop offset="50%" stopColor="#e4b874" />
          <stop offset="100%" stopColor="#6db26d" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={r + 6} fill="url(#memory-ring-bg)" />

      {/* Faint guiding circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(228,184,116,0.18)"
        strokeWidth={1}
        strokeDasharray="2 4"
      />

      {/* Center glyph */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize={42}
        fill="rgba(228,184,116,0.85)"
        style={{ filter: "drop-shadow(0 0 16px rgba(228,184,116,0.45))" }}
      >
        ☼
      </text>

      {dots.map((d, i) => {
        // Newest (last index) at the top, going clockwise back in time.
        const angle = ((N - 1 - i) / N) * 2 * Math.PI - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        const both = d.hasEntry && d.hasRitual;
        const onlyEntry = d.hasEntry && !d.hasRitual;
        const onlyRitual = !d.hasEntry && d.hasRitual;

        const radius = both ? 7 : onlyEntry ? 5.5 : onlyRitual ? 5.5 : 3;
        const fill = both
          ? "url(#memory-dot-both)"
          : onlyEntry
            ? "url(#memory-dot-on)"
            : onlyRitual
              ? "rgba(168,226,168,0.15)"
              : "rgba(244,236,223,0.10)";
        const stroke = onlyRitual
          ? "rgba(168,226,168,0.85)"
          : both
            ? "rgba(168,226,168,0.7)"
            : onlyEntry
              ? "rgba(228,184,116,0.7)"
              : "rgba(244,236,223,0.18)";
        const filter =
          both || onlyEntry || onlyRitual
            ? "drop-shadow(0 0 6px rgba(228,184,116,0.55))"
            : undefined;

        return (
          <g key={d.date}>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={fill}
              stroke={stroke}
              strokeWidth={onlyRitual ? 1.5 : 1}
              style={{ filter }}
            >
              <title>
                {`${d.date} · ${d.entries} ${
                  lang === "tr" ? "sayfa" : "page(s)"
                } · ${d.rituals} ${lang === "tr" ? "ritüel" : "ritual(s)"}`}
              </title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

/* ───── MOOD BARS ───── */

function MoodBars({
  reading,
  lang,
}: {
  reading: MemoryReading;
  lang: "tr" | "en";
}) {
  const total = ALL_MOODS.reduce((acc, m) => acc + reading.moodDist[m], 0);
  if (total === 0) {
    return <div className="memory-empty">{T.moodCardEmpty[lang]}</div>;
  }
  return (
    <ul className="memory-mood-list">
      {ALL_MOODS.map((m) => {
        const n = reading.moodDist[m];
        const pct = total > 0 ? Math.round((n / total) * 100) : 0;
        const lbl = MOOD_LABELS[m];
        return (
          <li key={m} className={`memory-mood-row ${n === 0 ? "is-zero" : ""}`}>
            <div className="memory-mood-name">
              <span className="memory-mood-sym" aria-hidden="true">
                {lbl.symbol}
              </span>
              <span>{lbl[lang]}</span>
            </div>
            <div className="memory-mood-bar">
              <div
                className="memory-mood-bar-fill"
                style={{ width: `${Math.max(pct, n > 0 ? 4 : 0)}%` }}
              />
            </div>
            <div className="memory-mood-count">
              {n > 0 ? `${n}` : "—"}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ───── HZ BANDS ───── */

function HzBands({
  reading,
  lang,
}: {
  reading: MemoryReading;
  lang: "tr" | "en";
}) {
  const max = Math.max(...SOLFEGGIO.map((s) => reading.hzDist[s]));
  const total = SOLFEGGIO.reduce((acc, s) => acc + reading.hzDist[s], 0);
  if (total === 0) {
    return <div className="memory-empty">{T.hzCardEmpty[lang]}</div>;
  }
  return (
    <div className="memory-hz">
      <div className="memory-hz-bands">
        {SOLFEGGIO.map((s) => {
          const n = reading.hzDist[s];
          const h = max > 0 ? (n / max) * 100 : 0;
          const isDom = reading.dominantHz === s;
          return (
            <div
              key={s}
              className={`memory-hz-col ${isDom ? "is-dom" : ""} ${
                n === 0 ? "is-zero" : ""
              }`}
              title={`${s} Hz · ${n}`}
            >
              <div className="memory-hz-track">
                <div
                  className="memory-hz-fill"
                  style={{ height: `${Math.max(h, n > 0 ? 8 : 0)}%` }}
                />
              </div>
              <div className="memory-hz-label">
                {s}
                <span className="memory-hz-unit">Hz</span>
              </div>
              <div className="memory-hz-n">{n > 0 ? n : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───── REGION BARS ───── */

const REGION_ORDER: RegionId[] = [
  "ege",
  "akdeniz",
  "ic-anadolu",
  "karadeniz",
  "guneydogu",
  "dogu-anadolu",
  "marmara",
];

function RegionBars({
  reading,
  lang,
}: {
  reading: MemoryReading;
  lang: "tr" | "en";
}) {
  const total = REGION_ORDER.reduce((acc, r) => acc + reading.regionDist[r], 0);
  if (total === 0) {
    return <div className="memory-empty">{T.regionCardEmpty[lang]}</div>;
  }
  /* Sort descending by count for poetry */
  const sorted = [...REGION_ORDER].sort(
    (a, b) => reading.regionDist[b] - reading.regionDist[a]
  );
  return (
    <ul className="memory-region-list">
      {sorted.map((id) => {
        const n = reading.regionDist[id];
        const pct = total > 0 ? Math.round((n / total) * 100) : 0;
        const isDom = reading.dominantRegion === id;
        return (
          <li
            key={id}
            className={`memory-region-row ${n === 0 ? "is-zero" : ""} ${
              isDom ? "is-dom" : ""
            }`}
          >
            <div className="memory-region-name">{REGION_NAMES[id][lang]}</div>
            <div className="memory-region-bar">
              <div
                className="memory-region-bar-fill"
                style={{ width: `${Math.max(pct, n > 0 ? 4 : 0)}%` }}
              />
            </div>
            <div className="memory-region-count">
              {n > 0 ? `${n}` : "—"}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ───── TOP PLANTS ───── */

function TopPlants({
  reading,
  lang,
}: {
  reading: MemoryReading;
  lang: "tr" | "en";
}) {
  if (reading.topPlants.length === 0) {
    return <div className="memory-empty">{T.topPlantsEmpty[lang]}</div>;
  }
  return (
    <ul className="memory-top-list">
      {reading.topPlants.map((row) => {
        const p = PLANTS_BY_ID.get(row.id);
        if (!p) return null;
        return (
          <li key={row.id} className="memory-top-row">
            <div className="memory-top-img" aria-hidden="true">
              <Image
                src={p.image}
                alt=""
                width={56}
                height={56}
                unoptimized
              />
            </div>
            <div className="memory-top-info">
              <Link
                href={`/universe/gaia/plants/${p.id}`}
                className="memory-top-name"
              >
                {p.name[lang]}
              </Link>
              <div className="memory-top-meta">
                <span>{p.frequency} Hz</span>
                <span aria-hidden="true">·</span>
                <span>{REGION_NAMES[p.region][lang]}</span>
              </div>
            </div>
            <div className="memory-top-count">
              ✦ {T.metTimes[lang](row.count)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ───── PAGE ───── */

export default function HafizaPage() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const langHydrate = useLangStore((s) => s.hydrate);

  const entries = useSanctumStore((s) => s.entries);
  const rituals = useSanctumStore((s) => s.rituals);
  const sanctumHydrated = useSanctumStore((s) => s.hydrated);
  const sanctumHydrate = useSanctumStore((s) => s.hydrate);

  useEffect(() => {
    langHydrate();
    sanctumHydrate();
  }, [langHydrate, sanctumHydrate]);

  const [windowDays, setWindowDays] = useState<WindowKey>(30);

  const reading = useMemo(
    () =>
      buildMemoryReading(
        { version: 1, entries, rituals },
        windowDays
      ),
    [entries, rituals, windowDays]
  );

  const summary = poeticSummary(reading, lang);

  return (
    <main className="sanctum-page">
      <div className="sanctum-bg" aria-hidden="true" />
      <div className="sanctum-overlay" aria-hidden="true" />
      <div className="sanctum-vignette" aria-hidden="true" />
      <div className="sanctum-glow sanctum-glow-a" aria-hidden="true" />
      <div className="sanctum-glow sanctum-glow-b" aria-hidden="true" />

      <header className="sanctum-ribbon">
        <Link href="/universe/sanctum" className="sanctum-ribbon-back">
          ← {T.back[lang]}
        </Link>
        <div className="sanctum-ribbon-mark">{T.ribbonMark[lang]}</div>
        <div
          className="sanctum-lang-switch"
          role="group"
          aria-label={T.langAria[lang]}
        >
          <button
            type="button"
            className={`sanctum-lang-btn ${lang === "tr" ? "is-active" : ""}`}
            aria-pressed={lang === "tr"}
            onClick={() => setLang("tr")}
          >
            TR
          </button>
          <span className="sanctum-lang-divider" aria-hidden="true">·</span>
          <button
            type="button"
            className={`sanctum-lang-btn ${lang === "en" ? "is-active" : ""}`}
            aria-pressed={lang === "en"}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
      </header>

      <section className="sanctum-shell sanctum-shell-wide">
        <div className="sanctum-hero">
          <div className="sanctum-kicker">{T.kicker[lang]}</div>
          <h1 className="sanctum-title">{T.title[lang]}</h1>
          <p className="sanctum-subtitle">{T.subtitle[lang]}</p>
        </div>

        {/* WINDOW PICKER */}
        <div className="memory-window">
          <div className="memory-window-label">{T.windowLabel[lang]}</div>
          <div className="memory-window-pills" role="tablist">
            {([7, 30, 90] as WindowKey[]).map((w) => {
              const lbl = w === 7 ? T.win7[lang] : w === 30 ? T.win30[lang] : T.win90[lang];
              return (
                <button
                  key={w}
                  type="button"
                  role="tab"
                  aria-selected={windowDays === w}
                  className={`memory-window-pill ${
                    windowDays === w ? "is-active" : ""
                  }`}
                  onClick={() => setWindowDays(w)}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        {/* POETIC SUMMARY */}
        <p className="memory-summary">
          {sanctumHydrated ? summary : "…"}
        </p>

        {/* TOTALS STRIP */}
        <div className="memory-totals">
          <div className="memory-total">
            <div className="memory-total-num">
              {sanctumHydrated ? reading.totalEntries : "·"}
            </div>
            <div className="memory-total-lbl">{T.pages[lang]}</div>
          </div>
          <div className="memory-total">
            <div className="memory-total-num">
              {sanctumHydrated ? reading.totalRituals : "·"}
            </div>
            <div className="memory-total-lbl">{T.rituals[lang]}</div>
          </div>
          <div className="memory-total">
            <div className="memory-total-num">
              {sanctumHydrated ? reading.activeDays : "·"}
            </div>
            <div className="memory-total-lbl">{T.active[lang]}</div>
          </div>
        </div>

        {/* DAILY RING */}
        <section className="memory-ring-block">
          <div className="memory-section-head">
            <div className="memory-section-title">
              {T.ringTitle[lang](windowDays)}
            </div>
            <div className="memory-section-meta">
              {sanctumHydrated
                ? T.activeDays[lang](reading.activeDays, windowDays)
                : "…"}
            </div>
          </div>
          <div className="memory-ring-frame">
            <DailyRing
              dots={reading.daily}
              size={
                windowDays === 90 ? 380 : windowDays === 30 ? 320 : 260
              }
              lang={lang}
            />
          </div>
          <div className="memory-ring-hint">{T.ringHint[lang]}</div>
        </section>

        {/* GRID 2x2 */}
        <div className="memory-grid">
          <article className="memory-card">
            <div className="memory-card-head">
              <div className="memory-card-title">{T.moodCardTitle[lang]}</div>
              {reading.dominantMood ? (
                <div className="memory-card-tag">
                  {MOOD_LABELS[reading.dominantMood].symbol}{" "}
                  {MOOD_LABELS[reading.dominantMood][lang]}
                </div>
              ) : null}
            </div>
            <MoodBars reading={reading} lang={lang} />
          </article>

          <article className="memory-card">
            <div className="memory-card-head">
              <div className="memory-card-title">{T.hzCardTitle[lang]}</div>
              {reading.dominantHz ? (
                <div className="memory-card-tag">{reading.dominantHz} Hz</div>
              ) : null}
            </div>
            <HzBands reading={reading} lang={lang} />
          </article>

          <article className="memory-card">
            <div className="memory-card-head">
              <div className="memory-card-title">{T.regionCardTitle[lang]}</div>
              {reading.dominantRegion ? (
                <div className="memory-card-tag">
                  {REGION_NAMES[reading.dominantRegion][lang]}
                </div>
              ) : null}
            </div>
            <RegionBars reading={reading} lang={lang} />
          </article>

          <article className="memory-card">
            <div className="memory-card-head">
              <div className="memory-card-title">
                {T.topPlantsTitle[lang]}
              </div>
            </div>
            <TopPlants reading={reading} lang={lang} />
          </article>
        </div>
      </section>
    </main>
  );
}

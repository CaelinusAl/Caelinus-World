"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useLangStore } from "@/stores/lang-store";
import { useSanctumStore } from "@/stores/sanctum-store";
import {
  plants,
  MOOD_LABELS,
  type Mood,
  type GaiaPlant,
} from "@/data/gaia";
import {
  practisedOn,
  totalForPlant,
  streakForPlant,
  streakAcrossAll,
  thresholdFor,
  nextThreshold,
  namedThreshold,
  logsNewestFirst,
} from "@/lib/sanctum/rituals";
import { todayDate } from "@/lib/sanctum/selectors";
import type { RitualLog } from "@/lib/sanctum/types";

/* ───── i18n ───── */
const T = {
  ribbonMark: { tr: "CAELINUS · SANCTUM · RİTÜEL", en: "CAELINUS · SANCTUM · RITUAL" },
  back: { tr: "Sanctum'a dön", en: "Back to Sanctum" },
  langAria: { tr: "Dil", en: "Language" },

  kicker: { tr: "✦ RİTÜEL HALKASI ✦", en: "✦ THE RITUAL RING ✦" },
  title: { tr: "Ritüel", en: "Ritual" },
  subtitle: {
    tr: "Bitkilerin sana öğrettiği küçük gündelik adımlar — yaptıklarını işaretle, halka kapansın.",
    en: "Small daily acts the plants taught you — mark what you practised, let the ring close.",
  },

  /* streak strip */
  streakLabel: { tr: "günlük seri", en: "day streak" },
  totalLabel: { tr: "toplam ritüel", en: "rituals practised" },
  thresholdLabel: { tr: "şu an taşıdığın eşik", en: "threshold you carry" },
  nextLabel: { tr: "sıradaki eşik", en: "next threshold" },
  daysAway: {
    tr: (n: number) => `${n} gün sonra`,
    en: (n: number) => `in ${n} days`,
  },
  thresholdNone: { tr: "henüz eşik yok", en: "no threshold yet" },
  thresholdDone: { tr: "tüm eşikler senin", en: "all thresholds claimed" },

  /* filters */
  filterAll: { tr: "Hepsi", en: "All" },
  searchPlaceholder: { tr: "Bitki ara…", en: "Search plant…" },

  /* card */
  practisedToday: { tr: "bugün yapıldı", en: "done today" },
  ritualHeading: { tr: "Bugünün adımı", en: "Today's step" },
  practiseCta: { tr: "Yaptım", en: "I practised" },
  alreadyToday: { tr: "Bugün işaretledin", en: "Marked for today" },
  cancel: { tr: "Vazgeç", en: "Cancel" },
  save: { tr: "Kaydet", en: "Save" },
  depthLabel: { tr: "Derinlik", en: "Depth" },
  depthHint: {
    tr: "1 = hafifçe geçtin · 5 = bütün bedenle",
    en: "1 = lightly grazed · 5 = whole-body",
  },
  reflectionLabel: { tr: "Hatıra (opsiyonel)", en: "Reflection (optional)" },
  reflectionPlaceholder: {
    tr: "Bir cümle yeter — beden ne dedi, hava nasıldı, ne kaldı.",
    en: "One sentence is enough — what did the body say, the air, what stayed.",
  },

  perPlantStreak: {
    tr: (n: number) => `${n} gün üst üste`,
    en: (n: number) => `${n} days in a row`,
  },
  perPlantTotal: {
    tr: (n: number) => `${n} kez`,
    en: (n: number) => `${n} times`,
  },

  /* logs */
  logsTitle: { tr: "Yapılanlar", en: "Practised" },
  logsEmpty: {
    tr: "Henüz hiçbir ritüel işaretlenmedi. İlk halka her zaman en küçüğüdür.",
    en: "No rituals yet. The first ring is always the smallest one.",
  },
  logRemove: { tr: "Geri al", en: "Undo" },
  logRemoveConfirm: {
    tr: "Bu kaydı silmek istediğinden emin misin?",
    en: "Are you sure you want to remove this log?",
  },

  emptyCatalog: {
    tr: "Bu mood'da bir bitki bulunamadı.",
    en: "No plant found for this mood.",
  },
};

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

/* ───── Composer state ─────
   Inline composer per card: when active, we show depth + reflection,
   otherwise just the "Yaptım" button. */

type ComposerState = {
  open: boolean;
  depth: 1 | 2 | 3 | 4 | 5;
  reflection: string;
};

const EMPTY_COMPOSER: ComposerState = {
  open: false,
  depth: 3,
  reflection: "",
};

/* Sort plants alphabetically per locale */
function sortedPlantsFor(lang: "tr" | "en"): GaiaPlant[] {
  return [...plants].sort((a, b) =>
    a.name[lang].localeCompare(b.name[lang], lang === "tr" ? "tr" : "en")
  );
}

export default function RituelerPage() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const langHydrate = useLangStore((s) => s.hydrate);

  const rituals = useSanctumStore((s) => s.rituals);
  const sanctumHydrated = useSanctumStore((s) => s.hydrated);
  const sanctumHydrate = useSanctumStore((s) => s.hydrate);
  const addRitual = useSanctumStore((s) => s.addRitual);
  const removeRitual = useSanctumStore((s) => s.removeRitual);

  useEffect(() => {
    langHydrate();
    sanctumHydrate();
  }, [langHydrate, sanctumHydrate]);

  const [filter, setFilter] = useState<"all" | Mood>("all");
  const [query, setQuery] = useState("");
  const [composers, setComposers] = useState<Record<string, ComposerState>>({});

  const today = todayDate();

  const sorted = useMemo(() => sortedPlantsFor(lang), [lang]);
  const filtered = useMemo(() => {
    let list = sorted;
    if (filter !== "all") list = list.filter((p) => p.moods.includes(filter));
    const q = query.trim().toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US");
    if (q) {
      list = list.filter((p) => {
        const tr = p.name.tr.toLocaleLowerCase("tr-TR");
        const en = p.name.en.toLocaleLowerCase("en-US");
        return tr.includes(q) || en.includes(q);
      });
    }
    return list;
  }, [sorted, filter, query, lang]);

  const totalCount = sanctumHydrated ? rituals.length : 0;
  const overallStreak = useMemo(
    () => (sanctumHydrated ? streakAcrossAll(rituals) : 0),
    [rituals, sanctumHydrated]
  );

  /* The lead-mood for the threshold name = the most-practised plant's first mood */
  const leadMood: Mood | null = useMemo(() => {
    if (!sanctumHydrated || rituals.length === 0) return null;
    const counts = new Map<string, number>();
    for (const r of rituals)
      counts.set(r.plantId, (counts.get(r.plantId) ?? 0) + 1);
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const plant = PLANTS_BY_ID.get(top[0]);
    return plant?.moods[0] ?? null;
  }, [rituals, sanctumHydrated]);

  const currentThreshold = thresholdFor(overallStreak);
  const nextStep = nextThreshold(overallStreak);
  const recentLogs = useMemo(
    () => (sanctumHydrated ? logsNewestFirst(rituals).slice(0, 30) : []),
    [rituals, sanctumHydrated]
  );

  function getComposer(id: string): ComposerState {
    return composers[id] ?? EMPTY_COMPOSER;
  }
  function setComposer(id: string, patch: Partial<ComposerState>) {
    setComposers((cur) => ({
      ...cur,
      [id]: { ...(cur[id] ?? EMPTY_COMPOSER), ...patch },
    }));
  }
  function openComposer(id: string) {
    setComposer(id, { open: true });
  }
  function closeComposer(id: string) {
    setComposer(id, { open: false, reflection: "", depth: 3 });
  }

  function handleSave(id: string) {
    const c = getComposer(id);
    addRitual({
      date: today,
      plantId: id,
      depth: c.depth,
      reflection: c.reflection.trim() || undefined,
    });
    closeComposer(id);
  }

  function handleRemoveLog(logId: string) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(T.logRemoveConfirm[lang]);
      if (!ok) return;
    }
    removeRitual(logId);
  }

  /* Format day for log row */
  function formatDay(d: string): string {
    try {
      return new Date(`${d}T00:00:00`).toLocaleDateString(
        lang === "tr" ? "tr-TR" : "en-US",
        { weekday: "short", month: "short", day: "numeric" }
      );
    } catch {
      return d;
    }
  }

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

        {/* STREAK STRIP */}
        <div className="rt-strip">
          <div className="rt-strip-stat">
            <div className="rt-strip-num">
              {sanctumHydrated ? overallStreak : "·"}
            </div>
            <div className="rt-strip-lbl">{T.streakLabel[lang]}</div>
          </div>

          <div className="rt-strip-stat">
            <div className="rt-strip-num">
              {sanctumHydrated ? totalCount : "·"}
            </div>
            <div className="rt-strip-lbl">{T.totalLabel[lang]}</div>
          </div>

          <div className="rt-strip-stat rt-strip-stat-wide">
            <div className="rt-strip-num rt-strip-num-text">
              {currentThreshold
                ? namedThreshold(currentThreshold, leadMood, lang)
                : T.thresholdNone[lang]}
            </div>
            <div className="rt-strip-lbl">{T.thresholdLabel[lang]}</div>
          </div>

          <div className="rt-strip-stat rt-strip-stat-wide">
            <div className="rt-strip-num rt-strip-num-text">
              {nextStep
                ? `${namedThreshold(nextStep, leadMood, lang)} · ${T.daysAway[lang](
                    nextStep.days - overallStreak
                  )}`
                : T.thresholdDone[lang]}
            </div>
            <div className="rt-strip-lbl">{T.nextLabel[lang]}</div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="rt-controls">
          <div className="rt-filters" role="tablist">
            {(["all", ...ALL_MOODS] as const).map((m) => {
              const isAll = m === "all";
              const label = isAll ? T.filterAll[lang] : MOOD_LABELS[m][lang];
              const symbol = isAll ? "✦" : MOOD_LABELS[m].symbol;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={filter === m}
                  className={`rt-filter ${filter === m ? "is-active" : ""}`}
                  onClick={() => setFilter(m)}
                >
                  <span className="rt-filter-sym" aria-hidden="true">{symbol}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <input
            type="search"
            className="sanctum-input rt-search"
            placeholder={T.searchPlaceholder[lang]}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* CATALOG */}
        {filtered.length === 0 ? (
          <div className="sanctum-empty">
            <div className="sanctum-empty-glyph" aria-hidden="true">○</div>
            <div className="sanctum-empty-body">{T.emptyCatalog[lang]}</div>
          </div>
        ) : (
          <div className="rt-grid">
            {filtered.map((p) => {
              const c = getComposer(p.id);
              const doneToday = sanctumHydrated && practisedOn(rituals, p.id, today);
              const plantStreak = sanctumHydrated
                ? streakForPlant(rituals, p.id)
                : 0;
              const plantTotal = sanctumHydrated
                ? totalForPlant(rituals, p.id)
                : 0;
              const plantThreshold = thresholdFor(plantStreak);
              const plantLeadMood = p.moods[0] ?? null;
              const heroMood = MOOD_LABELS[p.moods[0]];

              return (
                <article
                  key={p.id}
                  className={`rt-card ${doneToday ? "is-done" : ""}`}
                >
                  <header className="rt-card-head">
                    <div className="rt-card-img" aria-hidden="true">
                      <Image
                        src={p.image}
                        alt=""
                        width={64}
                        height={64}
                        unoptimized
                      />
                    </div>
                    <div className="rt-card-id">
                      <Link
                        href={`/universe/gaia/plants/${p.id}`}
                        className="rt-card-name"
                      >
                        {p.name[lang]}
                      </Link>
                      <div className="rt-card-tags">
                        {heroMood ? (
                          <span className="rt-tag">
                            {heroMood.symbol} {heroMood[lang]}
                          </span>
                        ) : null}
                        <span className="rt-tag rt-tag-hz">
                          {p.frequency} Hz
                        </span>
                      </div>
                    </div>
                    {doneToday ? (
                      <div className="rt-card-done" aria-label={T.practisedToday[lang]}>
                        ✓
                      </div>
                    ) : null}
                  </header>

                  <div className="rt-card-section">
                    <div className="rt-card-section-label">
                      {T.ritualHeading[lang]}
                    </div>
                    <p className="rt-card-ritual">
                      {p.ritual[lang]}
                    </p>
                  </div>

                  {plantStreak > 0 || plantTotal > 0 ? (
                    <div className="rt-card-stats">
                      {plantStreak > 0 ? (
                        <span className="rt-card-stat">
                          ✦ {T.perPlantStreak[lang](plantStreak)}
                        </span>
                      ) : null}
                      {plantTotal > 0 ? (
                        <span className="rt-card-stat">
                          ◐ {T.perPlantTotal[lang](plantTotal)}
                        </span>
                      ) : null}
                      {plantThreshold ? (
                        <span className="rt-card-stat rt-card-stat-glow">
                          ☾ {namedThreshold(plantThreshold, plantLeadMood, lang)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {!c.open ? (
                    <div className="rt-card-cta-row">
                      <button
                        type="button"
                        className={`rt-cta ${doneToday ? "is-soft" : ""}`}
                        onClick={() => openComposer(p.id)}
                      >
                        {doneToday
                          ? T.alreadyToday[lang] + " · " + T.practiseCta[lang]
                          : T.practiseCta[lang]}
                      </button>
                    </div>
                  ) : (
                    <div className="rt-composer">
                      <label className="rt-field">
                        <span className="rt-field-label">
                          {T.depthLabel[lang]} · {c.depth}
                        </span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={c.depth}
                          onChange={(e) =>
                            setComposer(p.id, {
                              depth: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                            })
                          }
                          className="rt-range"
                        />
                        <div className="rt-field-hint">{T.depthHint[lang]}</div>
                      </label>
                      <label className="rt-field">
                        <span className="rt-field-label">
                          {T.reflectionLabel[lang]}
                        </span>
                        <textarea
                          className="sanctum-input sanctum-textarea rt-reflection"
                          rows={3}
                          value={c.reflection}
                          onChange={(e) =>
                            setComposer(p.id, { reflection: e.target.value })
                          }
                          placeholder={T.reflectionPlaceholder[lang]}
                        />
                      </label>
                      <div className="rt-composer-actions">
                        <button
                          type="button"
                          className="sanctum-btn sanctum-btn-primary rt-save"
                          onClick={() => handleSave(p.id)}
                        >
                          {T.save[lang]}
                        </button>
                        <button
                          type="button"
                          className="sanctum-btn sanctum-btn-ghost rt-cancel"
                          onClick={() => closeComposer(p.id)}
                        >
                          {T.cancel[lang]}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* RECENT LOGS */}
        <section className="rt-logs">
          <div className="rt-logs-head">
            <div className="rt-logs-title">{T.logsTitle[lang]}</div>
          </div>
          {recentLogs.length === 0 ? (
            <div className="sanctum-empty">
              <div className="sanctum-empty-glyph" aria-hidden="true">∞</div>
              <div className="sanctum-empty-body">{T.logsEmpty[lang]}</div>
            </div>
          ) : (
            <ul className="rt-log-list">
              {recentLogs.map((log: RitualLog) => {
                const plant = PLANTS_BY_ID.get(log.plantId);
                if (!plant) return null;
                return (
                  <li key={log.id} className="rt-log-row">
                    <div className="rt-log-date">{formatDay(log.date)}</div>
                    <Link
                      href={`/universe/gaia/plants/${plant.id}`}
                      className="rt-log-plant"
                    >
                      {plant.name[lang]}
                    </Link>
                    {typeof log.depth === "number" ? (
                      <div
                        className="rt-log-depth"
                        aria-label={`${T.depthLabel[lang]}: ${log.depth}/5`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`rt-log-dot ${
                              i < (log.depth ?? 0) ? "is-on" : ""
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rt-log-depth" />
                    )}
                    <div className="rt-log-reflection">
                      {log.reflection ?? ""}
                    </div>
                    <button
                      type="button"
                      className="rt-log-remove"
                      onClick={() => handleRemoveLog(log.id)}
                    >
                      {T.logRemove[lang]}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

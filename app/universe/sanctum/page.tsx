"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

import WorldShell from "@/components/world/WorldShell";
import { useLangStore } from "@/stores/lang-store";
import { useProfileStore } from "@/stores/profile-store";
import { useSanctumStore } from "@/stores/sanctum-store";
import { ZODIAC_LABEL } from "@/lib/frequency";
import { plants, type Mood } from "@/data/gaia";
import { buildMoodTrace } from "@/lib/sanctum/selectors";
import {
  streakAcrossAll,
  thresholdFor,
  namedThreshold,
} from "@/lib/sanctum/rituals";
import { buildMemoryReading, poeticSummary } from "@/lib/sanctum/memory";

/* ───── i18n strings (UI scaffold) ───── */
const T = {
  ribbonMark: { tr: "CAELINUS · SANCTUM", en: "CAELINUS · SANCTUM" },
  back: { tr: "Gaia'ya dön", en: "Back to Gaia" },
  langAria: { tr: "Dil", en: "Language" },

  kicker: { tr: "✦ KİŞİSEL TOPRAK DEFTERİ ✦", en: "✦ PERSONAL SOIL JOURNAL ✦" },
  title: {
    tr: "Sanctum",
    en: "Sanctum",
  },
  subtitle: {
    tr: "Burası senin sessiz odan. Toprak ne fısıldadıysa, hangi bitki seni durdurduysa, hangi nefes seni eve getirdiyse — hepsini bu defter hatırlar.",
    en: "This is your quiet room. Whatever the soil whispered, whichever plant stopped you, whichever breath brought you home — this journal remembers it all.",
  },

  greetingTuned: {
    tr: (z: string) => `Hoş geldin, ${z} çocuğu.`,
    en: (z: string) => `Welcome, child of ${z}.`,
  },
  greetingPlain: {
    tr: "Hoş geldin.",
    en: "Welcome.",
  },
  attuneCta: {
    tr: "Kendi frekansını henüz okumadın — başlamak ister misin?",
    en: "You haven't read your frequency yet — would you like to begin?",
  },
  attuneCtaButton: {
    tr: "Frekansını oku",
    en: "Tune your frequency",
  },

  /* Today's whisper */
  todayWhisper: { tr: "Bugünün fısıltısı", en: "Today's whisper" },
  whisperFooter: {
    tr: "— toprak böyle hatırlar.",
    en: "— this is how the soil remembers.",
  },

  /* Stats strip */
  statsTitle: { tr: "Defterinin nabzı", en: "The pulse of your journal" },
  totalEntries: { tr: "yazılı sayfa", en: "written pages" },
  streakDays: { tr: "günlük seri", en: "day streak" },
  dominantPlant: { tr: "en sık bitki", en: "most-met plant" },
  dominantHz: { tr: "baskın frekans", en: "dominant frequency" },
  emptyDash: { tr: "—", en: "—" },

  /* Cards */
  cardDefter: {
    title: { tr: "Defter", en: "Journal" },
    subtitle: {
      tr: "Bugün hangi bitkiyle, hangi mood'la, hangi Hz'le buluştun? Yaz, kalsın.",
      en: "Which plant today, which mood, which Hz did you meet? Write it, let it stay.",
    },
    cta: { tr: "Sayfa aç", en: "Open page" },
  },
  cardRitual: {
    title: { tr: "Ritüel", en: "Ritual" },
    subtitle: {
      tr: "Bitkilerin sana öğrettiği ritüellerin günlüğü. Yaptıklarını işaretle, seri tut.",
      en: "The log of rituals plants taught you. Mark what you practised, keep your streak.",
    },
    cta: { tr: "Halkayı aç", en: "Open the ring" },
    streakHint: {
      tr: (n: number) => `${n} gün üst üste`,
      en: (n: number) => `${n} days in a row`,
    },
  },
  cardHafiza: {
    title: { tr: "Hafıza Hattı", en: "Memory Line" },
    subtitle: {
      tr: "Son 30 günün desen okuması — hangi mood baskın, hangi toprak, hangi Hz.",
      en: "A pattern reading of the last 30 days — dominant mood, soil, Hz.",
    },
    cta: { tr: "Deseni oku", en: "Read the pattern" },
  },

  vow: {
    tr: "Hiçbir kelime sunucuya gitmez. Bu defter senin cihazında durur.",
    en: "No word leaves your device. This journal lives only on your machine.",
  },
};

const PLANTS_BY_ID = new Map(plants.map((p) => [p.id, p]));

/* A small deterministic-by-day picker for the whisper.
   Uses the local date so it changes silently every midnight. */
function pickWhisperPlant(): { id: string; line: { tr: string; en: string } } | null {
  if (plants.length === 0) return null;
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  const p = plants[seed % plants.length];
  // Prefer the poetic line; fallback to the ritual.
  const line = p.poetic ?? p.ritual ?? p.healing;
  return { id: p.id, line };
}

export default function SanctumHubPage() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const langHydrate = useLangStore((s) => s.hydrate);

  const profile = useProfileStore((s) => s.profile);
  const profileHydrate = useProfileStore((s) => s.hydrate);

  const entries = useSanctumStore((s) => s.entries);
  const rituals = useSanctumStore((s) => s.rituals);
  const sanctumHydrated = useSanctumStore((s) => s.hydrated);
  const sanctumHydrate = useSanctumStore((s) => s.hydrate);

  useEffect(() => {
    langHydrate();
    profileHydrate();
    sanctumHydrate();
  }, [langHydrate, profileHydrate, sanctumHydrate]);

  const trace = useMemo(
    () =>
      buildMoodTrace(
        { version: 1, entries, rituals: [] },
        30
      ),
    [entries]
  );

  const memoryReading = useMemo(
    () =>
      buildMemoryReading(
        { version: 1, entries, rituals },
        30
      ),
    [entries, rituals]
  );
  const memoryLine = useMemo(
    () => poeticSummary(memoryReading, lang),
    [memoryReading, lang]
  );

  const ritualStreak = useMemo(
    () => (sanctumHydrated ? streakAcrossAll(rituals) : 0),
    [rituals, sanctumHydrated]
  );
  const ritualLeadMood: Mood | null = useMemo(() => {
    if (!sanctumHydrated || rituals.length === 0) return null;
    const counts = new Map<string, number>();
    for (const r of rituals)
      counts.set(r.plantId, (counts.get(r.plantId) ?? 0) + 1);
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const plant = PLANTS_BY_ID.get(top[0]);
    return plant?.moods[0] ?? null;
  }, [rituals, sanctumHydrated]);
  const ritualThreshold = thresholdFor(ritualStreak);

  const whisper = useMemo(pickWhisperPlant, []);
  const whisperPlant = whisper ? PLANTS_BY_ID.get(whisper.id) ?? null : null;

  const dominantPlantName = trace.dominantPlantId
    ? PLANTS_BY_ID.get(trace.dominantPlantId)?.name[lang] ?? T.emptyDash[lang]
    : T.emptyDash[lang];

  const greeting = profile
    ? T.greetingTuned[lang](ZODIAC_LABEL[profile.zodiac][lang])
    : T.greetingPlain[lang];

  const langSwitch = (
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
  );

  return (
    <WorldShell
      world="sanri"
      locale={lang}
      back={{ href: "/universe/gaia", label: T.back[lang] }}
      aside={langSwitch}
      kicker={T.kicker[lang]}
      title={T.title[lang]}
      subtitle={T.subtitle[lang]}
    >
      <section className="sanctum-shell">
        <p className="sanctum-greeting">{greeting}</p>
        {!profile ? (
          <Link href="/onboarding" className="sanctum-attune-cta">
            <span className="sanctum-attune-text">{T.attuneCta[lang]}</span>
            <span className="sanctum-attune-button">
              {T.attuneCtaButton[lang]} →
            </span>
          </Link>
        ) : null}

        {whisper && whisperPlant ? (
          <Link
            href={`/universe/gaia/plants/${whisperPlant.id}`}
            className="sanctum-whisper"
          >
            <div className="sanctum-whisper-label">{T.todayWhisper[lang]}</div>
            <div className="sanctum-whisper-plant">
              {whisperPlant.name[lang]}
            </div>
            <div className="sanctum-whisper-line">
              “{whisper.line[lang]}”
            </div>
            <div className="sanctum-whisper-footer">
              {T.whisperFooter[lang]}
            </div>
          </Link>
        ) : null}

        <div className="sanctum-stats">
          <div className="sanctum-stats-title">{T.statsTitle[lang]}</div>
          <div className="sanctum-stats-grid">
            <div className="sanctum-stat">
              <div className="sanctum-stat-num">
                {sanctumHydrated ? entries.length : "·"}
              </div>
              <div className="sanctum-stat-lbl">{T.totalEntries[lang]}</div>
            </div>
            <div className="sanctum-stat">
              <div className="sanctum-stat-num">
                {sanctumHydrated ? trace.streakDays : "·"}
              </div>
              <div className="sanctum-stat-lbl">{T.streakDays[lang]}</div>
            </div>
            <div className="sanctum-stat">
              <div className="sanctum-stat-num sanctum-stat-num-text">
                {sanctumHydrated ? dominantPlantName : "·"}
              </div>
              <div className="sanctum-stat-lbl">{T.dominantPlant[lang]}</div>
            </div>
            <div className="sanctum-stat">
              <div className="sanctum-stat-num">
                {sanctumHydrated && trace.dominantHz
                  ? `${trace.dominantHz} Hz`
                  : T.emptyDash[lang]}
              </div>
              <div className="sanctum-stat-lbl">{T.dominantHz[lang]}</div>
            </div>
          </div>
        </div>

        <div className="sanctum-cards">
          <Link href="/universe/sanctum/defter" className="sanctum-card is-active">
            <div className="sanctum-card-glyph" aria-hidden="true">✦</div>
            <div className="sanctum-card-title">{T.cardDefter.title[lang]}</div>
            <div className="sanctum-card-subtitle">
              {T.cardDefter.subtitle[lang]}
            </div>
            <div className="sanctum-card-cta">
              {T.cardDefter.cta[lang]} →
            </div>
          </Link>

          <Link
            href="/universe/sanctum/ritueller"
            className="sanctum-card is-active"
          >
            <div className="sanctum-card-glyph" aria-hidden="true">◐</div>
            <div className="sanctum-card-title">{T.cardRitual.title[lang]}</div>
            <div className="sanctum-card-subtitle">
              {T.cardRitual.subtitle[lang]}
            </div>
            <div className="sanctum-card-cta">
              {T.cardRitual.cta[lang]} →
            </div>
            {sanctumHydrated && ritualStreak > 0 ? (
              <div className="sanctum-card-badge">
                ✦ {T.cardRitual.streakHint[lang](ritualStreak)}
                {ritualThreshold ? (
                  <>
                    {" · "}
                    {namedThreshold(ritualThreshold, ritualLeadMood, lang)}
                  </>
                ) : null}
              </div>
            ) : null}
          </Link>

          <Link
            href="/universe/sanctum/hafiza"
            className="sanctum-card is-active"
          >
            <div className="sanctum-card-glyph" aria-hidden="true">∞</div>
            <div className="sanctum-card-title">{T.cardHafiza.title[lang]}</div>
            <div className="sanctum-card-subtitle">
              {T.cardHafiza.subtitle[lang]}
            </div>
            <div className="sanctum-card-cta">
              {T.cardHafiza.cta[lang]} →
            </div>
            {sanctumHydrated &&
            (memoryReading.totalEntries > 0 ||
              memoryReading.totalRituals > 0) ? (
              <div className="sanctum-card-line">
                {memoryLine}
              </div>
            ) : null}
          </Link>
        </div>

        <div className="sanctum-vow">
          ✦ {T.vow[lang]}
        </div>
      </section>
    </WorldShell>
  );
}

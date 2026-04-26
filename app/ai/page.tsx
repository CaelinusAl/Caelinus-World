"use client";

/**
 * CAELINUS — AI Frequency Reader (`/ai`)
 *
 * "Toprak Ana sana hangi sesle sesleniyor?
 *  Senin frekansın bu sorunun cevabıdır."
 *
 * The page lives in three states:
 *
 *   intro    → hero with start CTA
 *   quiz     → 5-question ritual
 *   reading  → reveal: frequency + plant voice + region + ritual
 *
 * No external AI/LLM call is required — the matching engine in
 * `lib/frequency-reading.ts` is pure and deterministic. The "AI" in
 * the route name refers to Caelinus's vision of *consciousness design
 * intelligence* — soil-aware, body-aware, language-aware.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useLangStore } from "@/stores/lang-store";
import { readFrequency, type FrequencyReading } from "@/lib/frequency-reading";

import FrequencyQuiz from "./_components/FrequencyQuiz";
import Reading from "./_components/Reading";

type Phase = "intro" | "quiz" | "reading";

const HERO_COPY = {
  tr: {
    eyebrow: "CAELINUS · BİLİNÇ TASARIMI",
    title: "Senin frekansın.",
    subtitle:
      "Toprak Ana sana hangi sesle sesleniyor? Beş yumuşak soruyla beden seni dinler — sonra bir bitki sana fısıldar.",
    cta: "Okumayı başlat",
    safety:
      "Bu bir tıbbi tanı değildir — bir nefes ve bir hatırlama ritüelidir.",
    backHome: "← Ana sayfa",
    durationHint: "Yaklaşık 90 saniye · 5 soru",
  },
  en: {
    eyebrow: "CAELINUS · CONSCIOUSNESS DESIGN",
    title: "Your frequency.",
    subtitle:
      "What voice is the soil using to speak to you today? Five soft questions, then a plant whispers back.",
    cta: "Begin the reading",
    safety:
      "This is not medical advice — it is a breath and a remembering.",
    backHome: "← Home",
    durationHint: "About 90 seconds · 5 questions",
  },
} as const;

export default function AIPage() {
  const { lang, hydrate } = useLangStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [reading, setReading] = useState<FrequencyReading | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Bring the void onto html/body while this page is mounted.
  // Re-uses the `atlas-host` class so the cosmic backdrop is consistent
  // between Atlas and AI pages.
  useEffect(() => {
    document.documentElement.classList.add("atlas-host");
    document.body.classList.add("atlas-host");
    return () => {
      document.documentElement.classList.remove("atlas-host");
      document.body.classList.remove("atlas-host");
    };
  }, []);

  const t = HERO_COPY[lang];

  const handleQuizComplete = (answers: Record<string, string>) => {
    try {
      const r = readFrequency(answers);
      setReading(r);
      setPhase("reading");
      // gentle scroll to top so the reveal lands at the top of the viewport
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    } catch (err) {
      console.error("readFrequency failed", err);
    }
  };

  const handleAgain = () => {
    setReading(null);
    setPhase("intro");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const phaseClass = useMemo(
    () => `ai-page is-phase-${phase}`,
    [phase],
  );

  return (
    <main className={phaseClass}>
      {/* shared cosmic backdrop ─ */}
      <div className="atlas-void" aria-hidden />

      {/* top bar ─ */}
      <header className="ai-topbar">
        <Link href="/" className="ai-topbar-home">
          {t.backHome}
        </Link>
        <LangSwitch />
      </header>

      {phase === "intro" && (
        <section className="ai-hero">
          <p className="ai-hero-eyebrow">{t.eyebrow}</p>
          <h1 className="ai-hero-title">{t.title}</h1>
          <p className="ai-hero-subtitle">{t.subtitle}</p>

          <button
            type="button"
            className="ai-hero-cta"
            onClick={() => {
              setPhase("quiz");
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <span className="ai-hero-cta-symbol" aria-hidden>◯</span>
            {t.cta}
            <span className="ai-hero-cta-arrow" aria-hidden>→</span>
          </button>

          <p className="ai-hero-duration">{t.durationHint}</p>
          <p className="ai-hero-safety">{t.safety}</p>
        </section>
      )}

      {phase === "quiz" && (
        <section className="ai-quiz-stage">
          <FrequencyQuiz lang={lang} onComplete={handleQuizComplete} />
        </section>
      )}

      {phase === "reading" && reading && (
        <Reading reading={reading} lang={lang} onAgain={handleAgain} />
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────
   Lang switch (mirrors /atlas styling)
   ───────────────────────────────────────────── */

function LangSwitch() {
  const { lang, setLang } = useLangStore();
  return (
    <div className="ai-lang-switch" role="group" aria-label="Language">
      <button
        type="button"
        className={"ai-lang-btn" + (lang === "tr" ? " is-active" : "")}
        onClick={() => setLang("tr")}
      >
        TR
      </button>
      <button
        type="button"
        className={"ai-lang-btn" + (lang === "en" ? " is-active" : "")}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}

"use client";

/**
 * FrequencyQuiz
 * ─────────────
 * A five-question ritual that reads the user's current frequency.
 * One question at a time, soft transitions, deliberately calm pacing —
 * this is meant to feel like *being asked by the soil*, not like a
 * marketing form.
 *
 * Behaviour
 *   • Auto-advances on answer selection (no "Next" button).
 *   • Back button reveals from question 2 onward.
 *   • On the final answer, the parent receives the full answer map.
 *   • Progress dots show position in the ritual.
 */

import { useState, useCallback, useMemo, useEffect } from "react";

import { FREQUENCY_QUIZ } from "@/lib/frequency-reading";
import type { Lang } from "@/stores/lang-store";

type Props = {
  lang: Lang;
  onComplete: (answers: Record<string, string>) => void;
};

const Q_COPY = {
  tr: {
    step: (n: number, total: number) => `${n} / ${total}`,
    back: "← geri",
    skipForNow: "Sezgine güven — birini seç.",
  },
  en: {
    step: (n: number, total: number) => `${n} / ${total}`,
    back: "← back",
    skipForNow: "Trust your instinct — choose one.",
  },
} as const;

export default function FrequencyQuiz({ lang, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLeaving, setIsLeaving] = useState(false);

  const total = FREQUENCY_QUIZ.length;
  const question = FREQUENCY_QUIZ[step];
  const t = Q_COPY[lang];

  // Reset the leaving flag when the new question mounts so the
  // entrance animation plays cleanly.
  useEffect(() => {
    setIsLeaving(false);
  }, [step]);

  const choose = useCallback(
    (optionId: string) => {
      const next = { ...answers, [question.id]: optionId };
      setAnswers(next);
      // Soft-fade the question out before advancing so the change
      // feels intentional, not jarring.
      setIsLeaving(true);
      window.setTimeout(() => {
        if (step + 1 >= total) {
          onComplete(next);
        } else {
          setStep((s) => s + 1);
        }
      }, 220);
    },
    [answers, question.id, step, total, onComplete],
  );

  const goBack = useCallback(() => {
    if (step === 0) return;
    setIsLeaving(true);
    window.setTimeout(() => setStep((s) => s - 1), 180);
  }, [step]);

  const progressPct = useMemo(
    () => Math.round(((step + 1) / total) * 100),
    [step, total],
  );

  return (
    <div className="ai-quiz" aria-live="polite">
      {/* Progress rail */}
      <div
        className="ai-quiz-progress"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Frequency reading progress"
      >
        <div
          className="ai-quiz-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
        <div className="ai-quiz-progress-dots">
          {FREQUENCY_QUIZ.map((q, i) => (
            <span
              key={q.id}
              className={
                "ai-quiz-progress-dot" +
                (i < step ? " is-past" : "") +
                (i === step ? " is-current" : "")
              }
              aria-hidden
            />
          ))}
        </div>
      </div>

      <div className="ai-quiz-meta">
        <span className="ai-quiz-step">{t.step(step + 1, total)}</span>
        {step > 0 && (
          <button
            type="button"
            className="ai-quiz-back"
            onClick={goBack}
            aria-label={t.back}
          >
            {t.back}
          </button>
        )}
      </div>

      <div
        key={question.id}
        className={"ai-quiz-card" + (isLeaving ? " is-leaving" : "")}
      >
        {question.hint && (
          <p className="ai-quiz-hint">{question.hint[lang]}</p>
        )}
        <h2 className="ai-quiz-prompt">{question.prompt[lang]}</h2>

        <div className="ai-quiz-options">
          {question.options.map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={
                  "ai-quiz-option" + (selected ? " is-selected" : "")
                }
                style={
                  {
                    ["--opt-tone" as string]: option.tone,
                  } as React.CSSProperties
                }
                onClick={() => choose(option.id)}
              >
                <span className="ai-quiz-option-symbol" aria-hidden>
                  {option.symbol}
                </span>
                <span className="ai-quiz-option-body">
                  <span className="ai-quiz-option-label">
                    {option.label[lang]}
                  </span>
                  {option.caption && (
                    <span className="ai-quiz-option-caption">
                      {option.caption[lang]}
                    </span>
                  )}
                </span>
                <span className="ai-quiz-option-arrow" aria-hidden>
                  →
                </span>
              </button>
            );
          })}
        </div>

        <p className="ai-quiz-instinct">{t.skipForNow}</p>
      </div>
    </div>
  );
}

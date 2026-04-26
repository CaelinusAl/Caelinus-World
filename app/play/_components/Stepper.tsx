"use client";

/**
 * Stepper — fixed-position breadcrumb across the play studio.
 * Lets users see how far they've come and click back to a previous
 * step without losing prior selections (the store keeps everything).
 */

import { usePlayStore, type PlayStep } from "@/stores/play-store";

type StepDef = { id: PlayStep; label: { tr: string; en: string } };

const STEPS: StepDef[] = [
  { id: "archetype", label: { tr: "Figür", en: "Figure" } },
  { id: "zodiac",    label: { tr: "Avatar", en: "Avatar" } },
  { id: "scene",     label: { tr: "Sahne",  en: "Scene" } },
  { id: "result",    label: { tr: "Görünüm", en: "Look" } },
];

const ORDER: PlayStep[] = ["archetype", "zodiac", "scene", "render", "result"];

export default function Stepper({ lang }: { lang: "tr" | "en" }) {
  const step = usePlayStore((s) => s.step);
  const archetype = usePlayStore((s) => s.archetype);
  const zodiac = usePlayStore((s) => s.zodiac);
  const scene = usePlayStore((s) => s.scene);
  const setStep = usePlayStore((s) => s.setStep);

  // current step's index in the linear ORDER. "result" sits at the
  // end; "render" is collapsed into the same dot as "result" so we
  // don't blink the breadcrumb during generation.
  const collapsed = step === "render" ? "result" : step;
  const currentIdx = ORDER.indexOf(collapsed);

  const canVisit = (target: PlayStep): boolean => {
    if (target === "archetype") return true;
    if (target === "zodiac") return !!archetype;
    if (target === "scene") return !!archetype && !!zodiac;
    if (target === "result") return !!archetype && !!zodiac && !!scene;
    return false;
  };

  return (
    <nav className="play-stepper" aria-label={lang === "tr" ? "Adımlar" : "Steps"}>
      {STEPS.map((s, i) => {
        const idx = ORDER.indexOf(s.id);
        const reached = idx <= currentIdx;
        const here = step === s.id || (step === "render" && s.id === "result");
        const enabled = canVisit(s.id);
        return (
          <button
            key={s.id}
            type="button"
            className={
              "play-stepper-step" +
              (here ? " is-here" : "") +
              (reached ? " is-reached" : "") +
              (enabled ? "" : " is-disabled")
            }
            onClick={() => enabled && setStep(s.id)}
            disabled={!enabled}
          >
            <span className="play-stepper-num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="play-stepper-label">{s.label[lang]}</span>
          </button>
        );
      })}
    </nav>
  );
}

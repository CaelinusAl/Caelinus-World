"use client";

/**
 * RenderCanvas — the giant centred portrait under a NebulaPortal halo.
 * Switches between three states based on the store's `render`:
 *
 *   • loading  — shimmer with an estimated time hint,
 *   • ready    — finished image with a subtle ken-burns drift,
 *   • error    — error message + retry CTA (caller wires it up).
 *
 * The canvas itself is responsive: a big portal (~min(560px, 70vw))
 * over a glow platform. Aria-live is "polite" so screen readers
 * announce the result without interrupting.
 */

import { GlowPlatform, NebulaPortal } from "@/app/_stage";
import {
  findArchetype,
  findScene,
  findZodiac,
} from "@/data/play-assets";
import { usePlayStore } from "@/stores/play-store";

type Props = {
  lang: "tr" | "en";
  onRetry: () => void;
};

export default function RenderCanvas({ lang, onRetry }: Props) {
  const render = usePlayStore((s) => s.render);
  const archetype = findArchetype(usePlayStore((s) => s.archetype));
  const zodiac = findZodiac(usePlayStore((s) => s.zodiac));
  const scene = findScene(usePlayStore((s) => s.scene));

  const tone = zodiac?.tone ?? archetype?.tone ?? "magenta";

  return (
    <div className="play-render">
      <header className="play-step-head">
        <p className="play-step-eyebrow">
          {lang === "tr" ? "Görünümün" : "Your look"}
        </p>
        <h2 className="play-step-title">
          {zodiac
            ? zodiac.label[lang]
            : lang === "tr"
              ? "Sahnede"
              : "On stage"}
        </h2>
        <p className="play-step-lead">
          {[archetype?.label[lang], scene?.label[lang]]
            .filter(Boolean)
            .join(" · ") || ""}
        </p>
      </header>

      <div
        className="play-render-stage"
        aria-live="polite"
        aria-busy={render.kind === "loading"}
      >
        <NebulaPortal size={520} tone={tone} pulse>
          {render.kind === "ready" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={render.url}
              alt={
                zodiac
                  ? `${zodiac.label[lang]} — ${scene?.label[lang] ?? ""}`
                  : "Caelinus play look"
              }
              className="play-render-image"
            />
          ) : render.kind === "loading" ? (
            <div className="play-render-shimmer" aria-hidden="true">
              <span className="play-render-shimmer-glyph">{zodiac?.glyph ?? "✦"}</span>
            </div>
          ) : render.kind === "error" ? (
            <div className="play-render-error" role="alert">
              <p className="play-render-error-glyph" aria-hidden="true">⚠</p>
              <p className="play-render-error-msg">{render.message}</p>
            </div>
          ) : (
            <span className="play-render-placeholder">{zodiac?.glyph ?? "✦"}</span>
          )}
        </NebulaPortal>
        <GlowPlatform
          width={520}
          tone={tone}
          intensity="rich"
          className="play-render-platform"
        />
      </div>

      {render.kind === "loading" ? (
        <p className="play-render-hint">
          {lang === "tr"
            ? "Caelinus tanrıçanı çiziyor… genelde 10–25 saniye."
            : "Caelinus is painting your goddess… usually 10–25 seconds."}
        </p>
      ) : null}

      {render.kind === "error" ? (
        <button
          type="button"
          className="play-render-retry"
          onClick={onRetry}
        >
          {lang === "tr" ? "Tekrar dene" : "Try again"}
        </button>
      ) : null}
    </div>
  );
}

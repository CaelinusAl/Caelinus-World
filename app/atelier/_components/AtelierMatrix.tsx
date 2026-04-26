"use client";

/**
 * AtelierMatrix — Caelinus / Atelier edition.
 *
 * A slow rain of mystical glyphs falling behind the page content. Same
 * idea as `app/universe/gaia/atlas/_components/MatrixRain.tsx`, but:
 *
 *   • palette is the atelier nebula — magenta heads, violet bodies,
 *     deep purple tails on a near-black indigo backdrop,
 *   • ~6% of streams flip to a soft cyan tint — that's the "AI" thread
 *     crossing the magenta "IA" (intelligenza artigiana) majority,
 *   • glyphs blend cosmic (✦ ◊ ☉ ☽), botanical (❀ ✿ ☘) and frequency
 *     (Hz, ~, /\\) hints — the "AI ⨯ IA" cross we keep returning to,
 *   • flow is a touch slower and more sparse, so it reads as ambience,
 *     not noise.
 *
 * Drawn on a fixed full-bleed canvas. Honors `prefers-reduced-motion`
 * (renders one static frame) and freezes when the tab is hidden.
 */

import { useEffect, useRef } from "react";

const GLYPHS =
  // cosmic
  "✦✧✶✷✵⌖◯◌◉◊◇⏣☉☽" +
  // botanical
  "❀❁✿☘" +
  // frequency / signal
  "Hz~/\\∿∞≈" +
  // greek (mystic / signal)
  "αβγδεζηθλμπφψω" +
  // anatolian-feeling latin extras
  "ÆØÅÞÐ" +
  // simple binaries — Caelinus DNA
  "0101101010";

export type AtelierMatrixProps = {
  /**
   * Visual richness of the rain.
   *   • "rich" — hero / landing pages (denser, brighter heads)
   *   • "soft" — secondary pages (background hint, ~half the density)
   */
  intensity?: "rich" | "soft";
  /**
   * Override base opacity. If omitted, derived from `intensity`.
   */
  opacity?: number;
  /** Glyph cell size in CSS pixels. Default 18. */
  fontSize?: number;
};

export default function AtelierMatrix({
  intensity = "rich",
  opacity,
  fontSize = 18,
}: AtelierMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // The "rich" preset is visible enough to be the hero atmosphere; the
  // "soft" preset is a whisper, suitable behind dense form UI.
  const layerOpacity =
    opacity ?? (intensity === "rich" ? 0.32 : 0.16);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // Static fallback — paint atelier midnight indigo and bail. The
      // aura and other static atmospheric layers do the rest.
      ctx.fillStyle = "#0a0816";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssWidth = 0;
    let cssHeight = 0;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    // Mint-tinted accent flag per column. ~5% of columns become a soft
    // mint stream — that's the AI side of the AI ⨯ IA pair, peeking
    // through the bronze.
    let accents: boolean[] = [];

    // Arrow-functions to preserve closure-level null narrowing of
    // `canvas` and `ctx`. (Same pattern as atlas MatrixRain.)
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sparser columns for "soft", standard for "rich".
      const step = intensity === "rich" ? fontSize : fontSize * 1.4;
      columns = Math.floor(cssWidth / step);

      drops = new Array(columns)
        .fill(0)
        .map(() => Math.random() * -cssHeight);
      speeds = new Array(columns)
        .fill(0)
        // Slower than atlas — atelier is contemplative, not arcade-y.
        .map(() => 0.35 + Math.random() * 0.55);
      accents = new Array(columns)
        .fill(false)
        .map(() => Math.random() < 0.06);

      ctx.fillStyle = "#0a0816";
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;

    const pickGlyph = (): string =>
      GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));

    const step = intensity === "rich" ? fontSize : fontSize * 1.4;

    const draw = () => {
      if (!running) return;

      // Soft fade towards atelier midnight indigo leaves a magenta
      // trail. The alpha controls how long the trail is visible —
      // lower = longer / more dreamy.
      ctx.fillStyle = "rgba(10, 8, 22, 0.085)";
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      ctx.font = `${fontSize}px ui-monospace, "JetBrains Mono", "Iosevka", monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < columns; i++) {
        const x = i * step;
        const y = drops[i] * fontSize;
        const glyph = pickGlyph();
        const isAccent = accents[i];

        if (isAccent) {
          // cyan accent stream — the "AI" thread peeking through
          if (drops[i] > 1) {
            ctx.fillStyle = "rgba(80, 160, 220, 0.30)";
            ctx.fillText(glyph, x, y - fontSize);
          }
          if (drops[i] > 0.5) {
            ctx.fillStyle = "rgba(140, 210, 255, 0.55)";
            ctx.fillText(glyph, x, y - 0.6 * fontSize);
          }
          ctx.fillStyle = "rgba(220, 245, 255, 0.92)";
          ctx.fillText(glyph, x, y);
        } else {
          // magenta / rose stream — the "IA" thread (intelligenza
          // artigiana / handcraft intelligence)
          if (drops[i] > 1) {
            ctx.fillStyle = "rgba(91, 40, 112, 0.42)";
            ctx.fillText(glyph, x, y - fontSize);
          }
          if (drops[i] > 0.5) {
            ctx.fillStyle = "rgba(201, 124, 214, 0.70)";
            ctx.fillText(glyph, x, y - 0.6 * fontSize);
          }
          ctx.fillStyle = "rgba(255, 200, 235, 0.96)";
          ctx.fillText(glyph, x, y);
        }

        // Recycle: when a stream falls off, give it a chance to restart.
        // The probabilistic restart keeps streams from synchronising
        // into a visible "pulse" line across the screen.
        if (y > cssHeight && Math.random() > 0.978) {
          drops[i] = 0;
          speeds[i] = 0.35 + Math.random() * 0.55;
          accents[i] = Math.random() < 0.06;
        }
        drops[i] += speeds[i];
      }

      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fontSize, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="atelier-matrix"
      style={{ opacity: layerOpacity }}
      aria-hidden="true"
    />
  );
}

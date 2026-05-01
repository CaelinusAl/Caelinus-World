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
  /**
   * Colour theme of the rain.
   *   • "magenta" — default Caelinus Atelier nebula (magenta/violet,
   *     cyan accent stream).
   *   • "frost"   — mavi/beyaz su şelalesi: ice-blue gövde, beyaz
   *     başlar, derin koyu mavi kuyruklar. Launch designer landing
   *     gibi "akış / berraklık" hissi gereken sayfalar için.
   */
  tone?: "magenta" | "frost";
};

export default function AtelierMatrix({
  intensity = "rich",
  opacity,
  fontSize = 18,
  tone = "magenta",
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

    // Per-tone palettes. We resolve up-front (closure-stable) so the
    // hot path (draw loop) just indexes into the right colour without
    // re-evaluating the tone on every glyph.
    const palette =
      tone === "frost"
        ? {
            // Backdrop — derin gece-mavisi (gece okyanusu).
            backdrop: "#04101e",
            trail: "rgba(4, 16, 30, 0.085)",
            // Mainstream: ice-blue body + bright white head — su şelalesi.
            mainTail: "rgba(20, 70, 130, 0.42)",
            mainBody: "rgba(120, 200, 245, 0.72)",
            mainHead: "rgba(245, 255, 255, 0.98)",
            // Accent: pure white shimmer — köpük damlası.
            accentTail: "rgba(120, 200, 245, 0.30)",
            accentBody: "rgba(220, 240, 255, 0.65)",
            accentHead: "rgba(255, 255, 255, 1.0)",
          }
        : {
            // Magenta default (Caelinus nebula).
            backdrop: "#0a0816",
            trail: "rgba(10, 8, 22, 0.085)",
            mainTail: "rgba(91, 40, 112, 0.42)",
            mainBody: "rgba(201, 124, 214, 0.70)",
            mainHead: "rgba(255, 200, 235, 0.96)",
            accentTail: "rgba(80, 160, 220, 0.30)",
            accentBody: "rgba(140, 210, 255, 0.55)",
            accentHead: "rgba(220, 245, 255, 0.92)",
          };

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // Static fallback — paint backdrop and bail. The aura and other
      // static atmospheric layers do the rest.
      ctx.fillStyle = palette.backdrop;
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

      ctx.fillStyle = palette.backdrop;
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

      // Soft fade leaves a colour-trail. The alpha controls how long
      // the trail is visible — lower = longer / more dreamy.
      ctx.fillStyle = palette.trail;
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      ctx.font = `${fontSize}px ui-monospace, "JetBrains Mono", "Iosevka", monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < columns; i++) {
        const x = i * step;
        const y = drops[i] * fontSize;
        const glyph = pickGlyph();
        const isAccent = accents[i];

        if (isAccent) {
          // accent stream — frost'ta pure white köpük, magenta'da cyan.
          if (drops[i] > 1) {
            ctx.fillStyle = palette.accentTail;
            ctx.fillText(glyph, x, y - fontSize);
          }
          if (drops[i] > 0.5) {
            ctx.fillStyle = palette.accentBody;
            ctx.fillText(glyph, x, y - 0.6 * fontSize);
          }
          ctx.fillStyle = palette.accentHead;
          ctx.fillText(glyph, x, y);
        } else {
          // main stream — frost'ta ice-blue + beyaz baş, magenta'da
          // pembe-eflatun.
          if (drops[i] > 1) {
            ctx.fillStyle = palette.mainTail;
            ctx.fillText(glyph, x, y - fontSize);
          }
          if (drops[i] > 0.5) {
            ctx.fillStyle = palette.mainBody;
            ctx.fillText(glyph, x, y - 0.6 * fontSize);
          }
          ctx.fillStyle = palette.mainHead;
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
  }, [fontSize, intensity, tone]);

  return (
    <canvas
      ref={canvasRef}
      className="atelier-matrix"
      style={{ opacity: layerOpacity }}
      aria-hidden="true"
    />
  );
}

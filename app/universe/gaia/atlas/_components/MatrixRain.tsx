"use client";

/**
 * Matrix Rain — Caelinus edition.
 *
 * Streams of katakana + binary glyphs cascading down on a black canvas.
 * Heads glow brighter (cool white-mint), tails fade to deep green.
 * Honors `prefers-reduced-motion` and pauses on tab blur.
 *
 * Drawn on a fixed full-screen canvas behind page content. Cheap on
 * the GPU because we only repaint a faint black layer each frame to
 * fade the previous trail.
 */

import { useEffect, useRef } from "react";

const GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ" +
  "01010110ㅁㅂㅅㅈㅊㅋㅌㅍㅎ◯△□✦✧·";

export type MatrixRainProps = {
  /** Visual density — bigger column step = sparser. 16 by default. */
  fontSize?: number;
  /** Layer opacity (0–1). Default 0.22. */
  opacity?: number;
};

export default function MatrixRain({
  fontSize = 16,
  opacity = 0.22,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // draw a single static frame, then bail
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssWidth = 0;
    let cssHeight = 0;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.floor(cssWidth / fontSize);
      drops = new Array(columns)
        .fill(0)
        .map(() => Math.random() * -cssHeight);
      speeds = new Array(columns)
        .fill(0)
        .map(() => 0.6 + Math.random() * 0.9);

      // start with full black so first frame doesn't flicker
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;

    function onVisibility() {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(draw);
    }
    document.addEventListener("visibilitychange", onVisibility);

    function pickGlyph(): string {
      return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
    }

    function draw() {
      if (!running) return;

      // soft fade — leaves a trail behind each glyph
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      ctx.font = `${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < columns; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const glyph = pickGlyph();

        // tail (deep green)
        ctx.fillStyle = "rgba(60, 200, 110, 0.42)";
        if (drops[i] > 1) ctx.fillText(glyph, x, y - fontSize);

        // body (Caelinus mint-green)
        ctx.fillStyle = "rgba(140, 240, 180, 0.78)";
        if (drops[i] > 0.5) ctx.fillText(glyph, x, y - 0.6 * fontSize);

        // head (luminous, almost white)
        ctx.fillStyle = "rgba(220, 255, 230, 0.95)";
        ctx.fillText(glyph, x, y);

        // recycle drops
        if (y > cssHeight && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = 0.6 + Math.random() * 0.9;
        }
        drops[i] += speeds[i];
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fontSize]);

  return (
    <canvas
      ref={canvasRef}
      className="atlas-matrix"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

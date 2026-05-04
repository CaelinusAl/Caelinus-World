"use client";

/**
 * ReadingCard — Caelinus AI'ın "okuma" sunumu.
 *
 * Üç katman:
 *   1. Style Identity — büyük serif başlık + alt-başlık
 *   2. Energy — Fire / Water / Air / Earth — glif + ikon + renk
 *   3. Mood — italic mood cümlesi (kısa)
 *   4. Reading — daha uzun şiirsel paragraf (collapse mümkün)
 *
 * Avatar oluşturma sonrası /caelinus-ai/avatar sayfasında ve
 * /caelinus-ai/try-on sayfasında üst banda yerleşir.
 */

import { ENERGY_LABELS, type CaelinusReading } from "@/lib/caelinus-ai";

type Props = {
  reading: CaelinusReading;
  /** "compact" — only Identity + Energy + Mood (no paragraph). */
  variant?: "full" | "compact";
};

export default function ReadingCard({ reading, variant = "full" }: Props) {
  const energy = ENERGY_LABELS[reading.energy];

  return (
    <div
      className={`cai-reading-card cai-reading-card--${variant}`}
      style={{ ["--energy-color" as string]: energy.color }}
    >
      <div className="cai-reading-card-glow" aria-hidden="true" />

      <header className="cai-reading-card-header">
        <div className="cai-reading-card-frequency">
          ✦ {reading.frequencyTag}
        </div>

        <h2 className="cai-reading-card-identity">
          {reading.styleIdentity.label}
        </h2>

        {reading.styleIdentity.subtitle && (
          <div className="cai-reading-card-subtitle">
            {reading.styleIdentity.subtitle}
          </div>
        )}
      </header>

      <div className="cai-reading-card-energy">
        <span
          className="cai-reading-card-energy-glyph"
          aria-hidden="true"
          style={{ color: energy.color }}
        >
          {energy.glyph}
        </span>
        <div className="cai-reading-card-energy-meta">
          <span className="cai-reading-card-energy-label">Enerji</span>
          <span
            className="cai-reading-card-energy-name"
            style={{ color: energy.color }}
          >
            {energy.tr} · {energy.en}
          </span>
        </div>
      </div>

      <blockquote className="cai-reading-card-mood">
        {reading.mood}
      </blockquote>

      {variant === "full" && (
        <p className="cai-reading-card-paragraph">{reading.reading}</p>
      )}
    </div>
  );
}

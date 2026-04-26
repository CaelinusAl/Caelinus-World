"use client";

/**
 * SignatureCard
 * ─────────────
 * A self-contained 1080×1350 SVG card that captures a frequency
 * reading. Designed to be exported as a standalone SVG file and
 * shared on Instagram / Twitter without any external assets.
 *
 * Why pure SVG?
 *   • Zero external dependencies — fonts fall back to system
 *     equivalents on devices without "Cormorant Garamond".
 *   • XMLSerializer + Blob → instant download, no canvas, no
 *     html-to-image dependency.
 *   • Stays true to Caelinus's "void + green light" aesthetic.
 */

import type { FrequencyReading } from "@/lib/frequency-reading";
import {
  intentLabel,
  elementLabel,
} from "@/lib/frequency-reading";
import type { Lang } from "@/stores/lang-store";

type Props = {
  reading: FrequencyReading;
  lang: Lang;
};

/* dimensions tuned for Instagram story (1080×1920) but cropped to a
   1080×1350 portrait that still works on Twitter */
const W = 1080;
const H = 1350;

export default function SignatureCard({ reading, lang }: Props) {
  const intent = intentLabel(reading.intent, lang);
  const element = elementLabel(reading.element, lang);
  const tone = reading.region.tone;
  const plant = reading.plant.name[lang];
  const region = reading.region.name[lang];
  const freqLabel = reading.frequencyLabel[lang];
  const whisperLine = reading.whisper[0]?.[lang] ?? "";

  const isTr = lang === "tr";
  const labelFreq = isTr ? "FREKANSIN" : "YOUR FREQUENCY";
  const labelPlant = isTr ? "BİTKİN" : "YOUR PLANT";
  const labelRegion = isTr ? "BÖLGE" : "REGION";
  const labelIntent = isTr ? "NİYET" : "INTENT";
  const labelElement = isTr ? "ÖĞE" : "ELEMENT";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width="1080"
      height="1350"
      role="img"
      aria-label={`Caelinus frequency signature: ${reading.frequency} Hz, ${plant}, ${region}`}
    >
      <defs>
        <radialGradient id="sig-bg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor={tone} stopOpacity="0.18" />
          <stop offset="60%" stopColor={tone} stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="sig-ring" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={tone} stopOpacity="0" />
          <stop offset="60%" stopColor={tone} stopOpacity="0" />
          <stop offset="100%" stopColor={tone} stopOpacity="0.25" />
        </radialGradient>
        <linearGradient id="sig-divider" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={tone} stopOpacity="0" />
          <stop offset="50%" stopColor={tone} stopOpacity="0.7" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* black void backdrop */}
      <rect x="0" y="0" width={W} height={H} fill="#050807" />
      <rect x="0" y="0" width={W} height={H} fill="url(#sig-bg)" />

      {/* a decorative star pattern (deterministic, seeded) */}
      <g fill="#f4ecdf" opacity="0.4">
        {STAR_POSITIONS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* ── header ── */}
      <text
        x={W / 2}
        y="100"
        fill="rgba(244, 236, 223, 0.78)"
        fontSize="26"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        textAnchor="middle"
        letterSpacing="10"
        fontWeight="500"
      >
        CAELINUS
      </text>
      <text
        x={W / 2}
        y="138"
        fill="rgba(244, 236, 223, 0.45)"
        fontSize="16"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        textAnchor="middle"
        letterSpacing="6"
      >
        {isTr ? "FREKANS İMZASI" : "FREQUENCY SIGNATURE"}
      </text>

      {/* ── frequency ring ── */}
      <g transform={`translate(${W / 2}, 380)`}>
        <circle r="220" fill="url(#sig-ring)" />
        <circle r="200" fill="none" stroke={tone} strokeOpacity="0.55" strokeWidth="1.5" />
        <circle r="180" fill="none" stroke={tone} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 6" />

        <text
          y="-30"
          fill="rgba(244, 236, 223, 0.55)"
          fontSize="18"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="5"
        >
          {labelFreq}
        </text>
        <text
          y="60"
          fill="#f4ecdf"
          fontSize="170"
          fontFamily='"Cormorant Garamond", "Playfair Display", Georgia, serif'
          textAnchor="middle"
          fontWeight="400"
          letterSpacing="-2"
        >
          {reading.frequency}
        </text>
        <text
          y="110"
          fill={tone}
          fontSize="32"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="8"
        >
          Hz
        </text>
        <text
          y="160"
          fill="rgba(244, 236, 223, 0.75)"
          fontSize="22"
          fontFamily='"Cormorant Garamond", Georgia, serif'
          fontStyle="italic"
          textAnchor="middle"
        >
          {freqLabel}
        </text>
      </g>

      {/* divider */}
      <line
        x1="120"
        y1="700"
        x2={W - 120}
        y2="700"
        stroke="url(#sig-divider)"
        strokeWidth="1"
      />

      {/* ── plant block ── */}
      <text
        x={W / 2}
        y="770"
        fill={tone}
        fontSize="16"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        textAnchor="middle"
        letterSpacing="6"
      >
        {labelPlant}
      </text>
      <text
        x={W / 2}
        y="840"
        fill="#f4ecdf"
        fontSize="64"
        fontFamily='"Cormorant Garamond", Georgia, serif'
        textAnchor="middle"
        fontWeight="400"
      >
        {plant}
      </text>
      <text
        x={W / 2}
        y="880"
        fill="rgba(244, 236, 223, 0.5)"
        fontSize="20"
        fontFamily='"Cormorant Garamond", Georgia, serif'
        fontStyle="italic"
        textAnchor="middle"
      >
        {reading.plant.scientific}
      </text>

      {/* ── whisper ── */}
      <foreignObject x="100" y="930" width={W - 200} height="120">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <div
          {...({ xmlns: "http://www.w3.org/1999/xhtml" } as any)}
          style={{
            width: "100%",
            color: "rgba(244, 236, 223, 0.92)",
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontStyle: "italic",
            fontSize: "26px",
            lineHeight: "1.5",
            textAlign: "center",
          }}
        >
          “{whisperLine}”
        </div>
      </foreignObject>

      {/* ── meta strip (region · intent · element) ── */}
      <g transform={`translate(0, 1130)`}>
        <line
          x1="120"
          y1="0"
          x2={W - 120}
          y2="0"
          stroke="url(#sig-divider)"
          strokeWidth="1"
        />
        {[
          { label: labelRegion, value: region },
          { label: labelIntent, value: intent },
          { label: labelElement, value: element },
        ].map((cell, i) => {
          const cx = (W / 4) * (i + 1);
          return (
            <g key={cell.label} transform={`translate(${cx}, 80)`}>
              <text
                fill="rgba(244, 236, 223, 0.45)"
                fontSize="14"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                textAnchor="middle"
                letterSpacing="4"
              >
                {cell.label}
              </text>
              <text
                y="36"
                fill="#f4ecdf"
                fontSize="26"
                fontFamily='"Cormorant Garamond", Georgia, serif'
                textAnchor="middle"
              >
                {cell.value}
              </text>
            </g>
          );
        })}
      </g>

      {/* ── footer ── */}
      <text
        x={W / 2}
        y={H - 50}
        fill="rgba(244, 236, 223, 0.4)"
        fontSize="14"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        textAnchor="middle"
        letterSpacing="6"
      >
        {isTr ? "TOPRAK · BİTKİ · BİLİNÇ" : "SOIL · PLANT · CONSCIOUSNESS"}
      </text>
    </svg>
  );
}

/**
 * 24 deterministic star positions across the canvas. Generated once
 * with a fixed seed so every signature card renders the same starfield
 * layout — visually consistent, no random reroll on each render.
 */
const STAR_POSITIONS: Array<[number, number, number]> = [
  [82, 188, 1.4], [171, 522, 1.0], [240, 86, 0.8], [311, 1170, 1.6],
  [385, 264, 1.1], [432, 988, 0.7], [502, 132, 1.3], [580, 1086, 1.0],
  [621, 422, 0.9], [688, 222, 1.5], [762, 1050, 1.2], [820, 318, 0.7],
  [890, 184, 1.4], [948, 736, 1.0], [990, 100, 0.9],
  [70, 740, 1.0], [156, 1240, 0.8], [292, 956, 1.2], [368, 660, 0.7],
  [502, 850, 0.9], [612, 1240, 1.4], [728, 580, 0.8], [834, 1010, 1.1],
  [930, 1240, 0.7],
];

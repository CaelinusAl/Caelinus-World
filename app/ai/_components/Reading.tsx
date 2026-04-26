"use client";

/**
 * Reading
 * ───────
 * The final reveal of the AI Frequency ritual.
 *
 * Layout (top → bottom):
 *
 *   [ 396 Hz ring + label ]
 *   [ Plant card with auto-playing voice ]
 *   [ 4-line whisper composed from the plant's data ]
 *   [ Region chip → atlas, plant chip → plant page ]
 *   [ 3 ritual lines ]
 *   [ "Tekrar oku" + "İmzanı indir" buttons ]
 *
 * The PlantVoice component is loaded lazily so the heavy
 * speech-synthesis logic only enters the bundle on the result page.
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef } from "react";

import {
  type FrequencyReading,
  READING_TEXT,
  intentLabel,
  elementLabel,
} from "@/lib/frequency-reading";
import { getPlantVoice } from "@/data/plant-voices";
import type { Lang } from "@/stores/lang-store";
import SignatureCard from "./SignatureCard";

const PlantVoice = dynamic(
  () => import("@/components/plants/PlantVoice"),
  { ssr: false },
);

type Props = {
  reading: FrequencyReading;
  lang: Lang;
  onAgain: () => void;
};

export default function Reading({ reading, lang, onAgain }: Props) {
  const t = READING_TEXT[lang];
  const sigRef = useRef<HTMLDivElement | null>(null);

  const voiceScript = useMemo(
    () => getPlantVoice(reading.plant.id),
    [reading.plant.id],
  );

  const intent = intentLabel(reading.intent, lang);
  const element = elementLabel(reading.element, lang);
  const regionTone = reading.region.tone;
  const plantPath = `/universe/gaia/plants/${reading.plant.id}`;
  const atlasPath = `/universe/gaia/atlas`;

  // Pull a single plate to deep-link the Atlas → opens with that
  // province highlighted (current Atlas page accepts a plate hash).
  const atlasHref = useMemo(() => {
    const plate = reading.region.samplePlates[0];
    return plate ? `${atlasPath}#plate-${plate}` : atlasPath;
  }, [reading.region.samplePlates]);

  const downloadSignature = useCallback(async () => {
    const node = sigRef.current?.querySelector("svg");
    if (!node) return;
    // Serialise the SVG, embed it in a Blob URL, trigger download.
    const xml = new XMLSerializer().serializeToString(node);
    const blob = new Blob(
      [`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`],
      { type: "image/svg+xml;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caelinus-frequency-${reading.frequency}hz-${reading.plant.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [reading.frequency, reading.plant.id]);

  return (
    <article
      className="ai-reading"
      style={{
        ["--reading-tone" as string]: regionTone,
      } as React.CSSProperties}
    >
      <p className="ai-reading-eyebrow">{t.eyebrow}</p>

      {/* ── frequency ring ── */}
      <section className="ai-reading-freq">
        <div className="ai-reading-freq-ring" aria-hidden>
          <span className="ai-reading-freq-num">{reading.frequency}</span>
          <span className="ai-reading-freq-unit">Hz</span>
        </div>
        <h1 className="ai-reading-freq-label">
          {reading.frequencyLabel[lang]}
        </h1>
        <p className="ai-reading-freq-meta">
          <span className="ai-reading-meta-pill">
            {t.intentLabel} · <strong>{intent}</strong>
          </span>
          <span className="ai-reading-meta-pill">
            {t.elementLabel} · <strong>{element}</strong>
          </span>
        </p>
      </section>

      {/* ── plant section ── */}
      <section className="ai-reading-plant">
        <header className="ai-reading-section-head">
          <span className="ai-reading-section-mark" aria-hidden />
          <h2>{t.yourPlant}</h2>
        </header>

        <div className="ai-reading-plant-card">
          <div className="ai-reading-plant-meta">
            <h3 className="ai-reading-plant-name">
              {reading.plant.name[lang]}
            </h3>
            <p className="ai-reading-plant-scientific">
              {reading.plant.scientific}
            </p>
            <p className="ai-reading-plant-pill">
              {reading.plant.frequency} Hz · {reading.region.name[lang]}
            </p>
          </div>

          {voiceScript ? (
            <PlantVoice
              script={voiceScript}
              lang={lang}
              plantName={reading.plant.name[lang]}
              frequency={reading.plant.frequency}
              tone={reading.region.tone}
            />
          ) : (
            <p className="ai-reading-plant-no-voice">
              {lang === "tr"
                ? "Bu bitkinin sesi henüz hazır değil."
                : "This plant's voice isn't ready yet."}
            </p>
          )}
        </div>
      </section>

      {/* ── whisper ── */}
      <section className="ai-reading-whisper-block">
        <header className="ai-reading-section-head">
          <span className="ai-reading-section-mark" aria-hidden />
          <h2>{t.yourWhisper}</h2>
        </header>
        <ol className="ai-reading-whisper">
          {reading.whisper.map((line, i) => (
            <li key={i} className="ai-reading-whisper-line">
              <span className="ai-reading-whisper-num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="ai-reading-whisper-text">{line[lang]}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── ritual ── */}
      <section className="ai-reading-ritual-block">
        <header className="ai-reading-section-head">
          <span className="ai-reading-section-mark" aria-hidden />
          <h2>{t.yourRitual}</h2>
        </header>
        <ul className="ai-reading-ritual">
          {reading.rituals.map((step, i) => (
            <li key={i} className="ai-reading-ritual-step">
              <span className="ai-reading-ritual-num">{i + 1}</span>
              <span className="ai-reading-ritual-text">{step[lang]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── deeplinks ── */}
      <section className="ai-reading-links" aria-label="Caelinus deeplinks">
        <Link href={plantPath} className="ai-reading-link is-plant">
          <span className="ai-reading-link-eyebrow">
            {t.plantPageButton}
          </span>
          <span className="ai-reading-link-title">
            {reading.plant.name[lang]}
            <span className="ai-reading-link-arrow" aria-hidden>↗</span>
          </span>
        </Link>
        <Link href={atlasHref} className="ai-reading-link is-region">
          <span className="ai-reading-link-eyebrow">{t.atlasButton}</span>
          <span className="ai-reading-link-title">
            {reading.region.name[lang]}
            <span className="ai-reading-link-arrow" aria-hidden>↗</span>
          </span>
        </Link>
      </section>

      {/* ── signature card (visually hidden, used for download) ── */}
      <div ref={sigRef} className="ai-reading-signature-host" aria-hidden>
        <SignatureCard reading={reading} lang={lang} />
      </div>

      {/* ── footer actions ── */}
      <footer className="ai-reading-actions">
        <button
          type="button"
          className="ai-reading-btn is-primary"
          onClick={downloadSignature}
        >
          ⤓ {t.download}
        </button>
        <button
          type="button"
          className="ai-reading-btn is-ghost"
          onClick={onAgain}
        >
          ↻ {t.again}
        </button>
      </footer>
    </article>
  );
}

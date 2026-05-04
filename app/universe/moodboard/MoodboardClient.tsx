"use client";

/**
 * MoodboardClient — interaktif kabuk.
 *
 * State machine: idle → generating → ready (← retry → generating)
 *
 *   • idle      — hero input açık, hint örnekler göründü
 *   • generating — 4 skeleton kart + shimmer + tek satır status
 *                  ("Caelinus okuyor…", "Atmosferi dokuyor…")
 *   • ready     — sonuç JSON kart grid + okuma 5 paragraf
 *
 * API çağrısı: POST /api/moodboard/generate { vibe, lang }.
 * Cache hit'te <50ms; miss'te ~25-40s (4 image paralel).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type LayerKey = "atmosfer" | "doku" | "figur" | "nesne";

type ApiOk = {
  ok: true;
  cached: boolean;
  vibe: string;
  hash: string;
  lang: "tr" | "en";
  createdAt: string;
  prompts: Record<LayerKey, string>;
  layers: Record<LayerKey, { url: string; label: { tr: string; en: string } }>;
  reading: string[];
};

type ApiErr = {
  error: string;
  message?: string;
  retryAfterMs?: number;
};

const SAMPLE_VIBES = [
  "ilkbahar İznik, ipek, gül soğuğu",
  "Ege akşamı, zeytin yaprağı, gümüş",
  "Kapadokya şafağı, terra-cotta, tütsü",
  "yaz sonu Bodrum, beyaz keten, deniz tuzu",
  "yün boğaz, kayın ormanı, vanilya",
];

const STATUS_BEATS_TR = [
  "Caelinus okuyor…",
  "Frekans seçiliyor…",
  "Atmosfer dokuluyor…",
  "Doku örülüyor…",
  "Figür çağrılıyor…",
  "Nesne yerleştiriliyor…",
  "Sayfa açılıyor…",
];

const LAYER_NUMBER: Record<LayerKey, string> = {
  atmosfer: "01",
  doku: "02",
  figur: "03",
  nesne: "04",
};

const LAYER_ORDER: LayerKey[] = ["atmosfer", "doku", "figur", "nesne"];

export default function MoodboardClient() {
  const [vibe, setVibe] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "ready">("idle");
  const [statusBeat, setStatusBeat] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  // Hint sample carousel — 5 örneği yumuşakça döndür.
  const [hintIndex, setHintIndex] = useState(0);
  useEffect(() => {
    if (status !== "idle") return;
    const id = setInterval(() => {
      setHintIndex((i) => (i + 1) % SAMPLE_VIBES.length);
    }, 4200);
    return () => clearInterval(id);
  }, [status]);

  // Status beat rotator — generating sırasında hareketli mesaj.
  useEffect(() => {
    if (status !== "generating") return;
    setStatusBeat(0);
    const id = setInterval(() => {
      setStatusBeat((i) => Math.min(i + 1, STATUS_BEATS_TR.length - 1));
    }, 3500);
    return () => clearInterval(id);
  }, [status]);

  const placeholder = useMemo(
    () => SAMPLE_VIBES[hintIndex] ?? SAMPLE_VIBES[0]!,
    [hintIndex],
  );

  const generate = useCallback(async () => {
    const trimmed = vibe.trim();
    if (trimmed.length < 2) {
      setError("Bir his, bir mevsim, bir renk yaz — en az iki kelime.");
      return;
    }
    setError(null);
    setStatus("generating");
    setData(null);

    try {
      const res = await fetch("/api/moodboard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibe: trimmed, lang: "tr" }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErr | null;
        const msg =
          errBody?.message ??
          (res.status === 429
            ? "Saatlik moodboard limitine ulaştın. Bir saat sonra tekrar dene."
            : res.status === 503
              ? "AI servisi hazırlanıyor. Birkaç saniye sonra tekrar dene."
              : `Bir şey ters gitti (HTTP ${res.status}).`);
        setError(msg);
        setStatus("idle");
        return;
      }

      const ok = (await res.json()) as ApiOk;
      setData(ok);
      setStatus("ready");
      // Yeni sonucun başına yumuşak kaydır.
      requestAnimationFrame(() => {
        document
          .getElementById("moodboard-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Bağlantı kesildi: ${msg}`);
      setStatus("idle");
    }
  }, [vibe]);

  const reset = useCallback(() => {
    setData(null);
    setStatus("idle");
    setError(null);
  }, []);

  return (
    <main className="mb-scene">
      <div className="mb-bg" />
      <div className="mb-overlay" />
      <div className="mb-stars" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => {
          const left = ((i * 37) % 100) + Math.random() * 0.001;
          const top = ((i * 53) % 100) + Math.random() * 0.001;
          const size = 1 + (i % 3) * 0.6;
          const delay = (i % 11) * 0.4;
          return (
            <span
              key={i}
              className="mb-star"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="mb-hero">
        <div className="mb-kicker">✦ CAELINUS STYLIST · AI MOODBOARD ✦</div>
        <h1 className="mb-title">
          Bir vibe yaz —
          <br />
          <em>Caelinus dört katmanlı sayfa açsın.</em>
        </h1>
        <p className="mb-lede">
          Bir mevsim, bir renk, bir his. Caelinus AI dört editöryel kare üretir
          — <strong>atmosfer · doku · figür · nesne</strong> — ve paletten söze
          uzanan beş başlıklı bir okuma yazar.
        </p>
        <div className="mb-tech">
          GPT-IMAGE-1 · GPT-4O-MINI · ANTI-STOCK · ANADOLU İMZASI
        </div>

        <form
          className="mb-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            if (status !== "generating") generate();
          }}
        >
          <input
            type="text"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder={placeholder}
            className="mb-input"
            disabled={status === "generating"}
            maxLength={160}
            aria-label="Vibe — bir his, mevsim ya da renk yaz"
          />
          <button
            type="submit"
            className="mb-cta"
            disabled={status === "generating"}
          >
            {status === "generating" ? "AÇILIYOR…" : "MOODBOARD ÜRET →"}
          </button>
        </form>

        {error && <div className="mb-error">{error}</div>}

        {status === "idle" && !data && (
          <div className="mb-hints" aria-hidden="true">
            <span className="mb-hints-label">Örnek</span>
            {SAMPLE_VIBES.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`mb-hint ${i === hintIndex ? "is-active" : ""}`}
                onClick={() => setVibe(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Bridge SVG divider — özel görsel iz */}
      <div className="mb-bridge" aria-hidden="true">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mb-bridge-grad" x1="0" x2="1">
              <stop offset="0" stopColor="#c8a2ff" stopOpacity="0" />
              <stop offset=".5" stopColor="#e6c089" stopOpacity=".55" />
              <stop offset="1" stopColor="#c8a2ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 70 L300 70 C 360 70, 380 18, 600 18 C 820 18, 840 70, 900 70 L1200 70"
            fill="none"
            stroke="url(#mb-bridge-grad)"
            strokeWidth="1.4"
          />
          <circle cx="600" cy="18" r="2.2" fill="#fff" opacity=".95" />
        </svg>
      </div>

      {/* ── GENERATING SKELETON ─────────────────────────────── */}
      {status === "generating" && (
        <section className="mb-result-shell" aria-busy="true">
          <div className="mb-result-head">
            <div className="mb-result-vibe">
              <span className="mb-result-vibe-prefix">MOODBOARD ·</span>{" "}
              <strong>{vibe.toUpperCase()}</strong>
            </div>
            <div className="mb-result-okudu">
              <em>Caelinus dokuyor…</em>
            </div>
            <div className="mb-result-status">
              {STATUS_BEATS_TR[statusBeat]}
            </div>
          </div>
          <div className="mb-cards-grid">
            {LAYER_ORDER.map((k) => (
              <div key={k} className={`mb-card mb-card-skeleton mb-card-${k}`}>
                <div className="mb-card-shimmer" />
                <div className="mb-card-num">
                  {LAYER_NUMBER[k]} ·{" "}
                  {k === "atmosfer"
                    ? "ATMOSFER"
                    : k === "doku"
                      ? "DOKU"
                      : k === "figur"
                        ? "FİGÜR"
                        : "NESNE"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── READY ──────────────────────────────────────────── */}
      {status === "ready" && data && (
        <section
          className="mb-result-shell"
          id="moodboard-result"
          aria-live="polite"
        >
          <div className="mb-result-head">
            <div className="mb-result-vibe">
              <span className="mb-result-vibe-prefix">MOODBOARD ·</span>{" "}
              <strong>{data.vibe.toUpperCase()}</strong>
            </div>
            <div className="mb-result-okudu">
              <em>{data.cached ? "Caelinus hatırladı." : "Caelinus okudu."}</em>
            </div>
            <div className="mb-result-tip">
              GÖRSELLER PAYLAŞIMA AÇIK — BEĞENDİĞİNİ SAĞ TIKLA, KAYDET.
            </div>
          </div>

          <div className="mb-cards-grid">
            {LAYER_ORDER.map((k) => {
              const layer = data.layers[k];
              return (
                <figure key={k} className={`mb-card mb-card-${k}`}>
                  <a
                    href={layer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-card-link"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={layer.url}
                      alt={`${layer.label.tr} — ${data.vibe}`}
                      className="mb-card-img"
                      loading="lazy"
                    />
                  </a>
                  <figcaption className="mb-card-num">
                    {LAYER_NUMBER[k]} · {layer.label.tr.toUpperCase()}
                  </figcaption>
                </figure>
              );
            })}
          </div>

          {/* Reading — 5 paragraflık okuma */}
          {data.reading.length > 0 && (
            <article className="mb-reading">
              <div className="mb-reading-kicker">
                ✦ Caelinus'un Okuması · {data.vibe.toUpperCase()} ✦
              </div>
              {data.reading.map((p, i) => (
                <p key={i} className={`mb-reading-p mb-reading-p-${i}`}>
                  {i === 0 && <span className="mb-reading-drop">{p[0]}</span>}
                  {i === 0 ? p.slice(1) : p}
                </p>
              ))}
            </article>
          )}

          <div className="mb-actions">
            <button type="button" className="mb-action" onClick={reset}>
              ↺ Başka Bir Vibe
            </button>
            <Link href="/universe/shop" className="mb-action mb-action-primary">
              ✦ Bu Frekansta Alışverişe Geç
            </Link>
            <Link href="/avatar" className="mb-action">
              ◉ Avatarımı Çağır
            </Link>
          </div>
        </section>
      )}

      <div className="mb-back">
        <Link href="/universe">← Caelinus Universe</Link>
      </div>
    </main>
  );
}

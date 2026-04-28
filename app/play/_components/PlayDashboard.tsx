"use client";

/**
 * PlayDashboard — single-screen "studio" view that replaces the linear
 * wizard. Mockup parity:
 *
 *   ┌── Hero (cosmic portal · CAELINUS PLAY · ENTER THE PLAYGROUND) ──┐
 *   ┌── Select Your Archetype  · 7 silhouette tiles ─────────────────┐
 *   ┌── Select Your Avatar (zodiac ring) ─┬── Where To? (4 scenes) ──┐
 *                                         ├── <Z> AI Scene preview ──┤
 *                                         └── Buy · Save · Share ────┘
 *
 * All three selections live in the same Zustand store as the wizard,
 * so once `archetype`, `zodiac` and `scene` are filled the Generate
 * CTA fires the render. RenderCanvas + LookActions render the result.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { CinemaCTA, NebulaPortal } from "@/app/_stage";
import {
  ARCHETYPES,
  PUBLIC_SCENES,
  ZODIACS,
  findArchetype,
  findZodiac,
  findScene,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";
import { usePlayStore } from "@/stores/play-store";

import LookActions from "./LookActions";
import RenderCanvas from "./RenderCanvas";

/**
 * Signature zodiac per archetype — used to pick the thumbnail shown on
 * each archetype tile when the warmed avatar matrix is available.
 * Pairings chosen for visual identity match (palette × archetype).
 *
 * `curvy` falls back to `pisces` (rather than the originally-planned
 * `taurus`) because `curvy-taurus` failed during the OpenAI warm pass
 * (billing limit) — `curvy-pisces` rendered cleanly and its soft tide
 * palette still reads on-brand for the curvy archetype.
 */
const ARCHETYPE_SIGNATURE_ZODIAC: Record<ArchetypeId, ZodiacId> = {
  light: "libra",
  golden: "leo",
  dark: "scorpio",
  cosmic: "aquarius",
  minimal: "virgo",
  athletic: "aries",
  curvy: "pisces",
};

/** `archetype-zodiac` -> public Storage URL */
type PreviewMap = Record<string, string>;

type Lang = "tr" | "en";

type Props = {
  lang: Lang;
  onGenerate: () => void;
  onRetry: () => void;
  onSave: () => void;
  onShare: () => void;
  onReroll: () => void;
  toast: string | null;
};

export default function PlayDashboard({
  lang,
  onGenerate,
  onRetry,
  onSave,
  onShare,
  onReroll,
  toast,
}: Props) {
  const archetypeId = usePlayStore((s) => s.archetype);
  const zodiacId = usePlayStore((s) => s.zodiac);
  const sceneId = usePlayStore((s) => s.scene);
  const variant = usePlayStore((s) => s.variant);
  const render = usePlayStore((s) => s.render);

  const setArchetype = usePlayStore((s) => s.setArchetype);
  const setZodiac = usePlayStore((s) => s.setZodiac);
  const setScene = usePlayStore((s) => s.setScene);

  const archetype = findArchetype(archetypeId);
  const zodiac = findZodiac(zodiacId);
  const scene = findScene(sceneId);

  const archetypeRef = useRef<HTMLElement>(null);

  const allSelected = Boolean(archetypeId && zodiacId && sceneId);
  const isRendering = render.kind === "loading";
  const hasResult = render.kind === "ready";

  const scrollToArchetype = useCallback(() => {
    archetypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Avatar matrix (warmed previews) ─────────────────────────
  // Fetched once on mount. Empty map = warm script not yet run, in
  // which case tiles fall back to the CSS silhouette + glyph treatment.
  const [previews, setPreviews] = useState<PreviewMap>({});

  useEffect(() => {
    let cancelled = false;
    // `no-store` for the dev loop so a stale 304 from the Next dev
    // server never strands us with an empty matrix. Vercel's edge
    // cache (24h s-maxage on the route) still works in production.
    fetch("/api/play/avatar-previews", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((j: { ok: boolean; previews?: PreviewMap; count?: number }) => {
        if (cancelled) return;
        if (j.ok && j.previews) {
          setPreviews(j.previews);
          if (typeof window !== "undefined") {
            console.log(
              `[play] avatar matrix loaded — ${j.count ?? Object.keys(j.previews).length} previews`,
            );
          }
        } else {
          console.warn("[play] avatar-previews replied without previews", j);
        }
      })
      .catch((err) => {
        // Surface the failure in dev so an empty matrix doesn't go
        // unnoticed. Production fallback (CSS silhouette) still kicks
        // in regardless.
        console.error("[play] avatar matrix fetch failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── i18n strings ──
  const T = {
    heroEyebrow: lang === "tr" ? "Caelinus · Play" : "Caelinus · Play",
    heroTitle: "CAELINUS PLAY",
    heroLead: lang === "tr" ? "Tanrıçanı Giydir" : "Dress the Archetype",
    heroCta: lang === "tr" ? "SAHNEYE GİR" : "ENTER THE PLAYGROUND",

    archetypeKicker:
      lang === "tr" ? "── ARKETİPİNİ SEÇ ──" : "── SELECT YOUR ARCHETYPE ──",
    archetypeNext: lang === "tr" ? "DEVAM" : "NEXT",

    avatarKicker:
      lang === "tr" ? "── BURCUNU SEÇ ──" : "── SELECT YOUR AVATAR ──",
    avatarHint:
      lang === "tr"
        ? "12 burç · halkadaki sembole tıkla"
        : "12 signs · tap a glyph in the ring",

    sceneKicker: lang === "tr" ? "── NEREYE? ──" : "── WHERE TO? ──",

    aiKickerPrefix: lang === "tr" ? "" : "",
    aiKickerSuffix: lang === "tr" ? "AI SAHNE" : "AI SCENE",
    aiPlaceholder:
      lang === "tr"
        ? "Üç seçimi tamamla ve sahneyi oluştur"
        : "Pick all three then generate the scene",

    generate: lang === "tr" ? "GÖRÜNÜMÜ OLUŞTUR" : "GENERATE LOOK",
    needPicks:
      lang === "tr"
        ? "Önce arketip, burç ve sahne seç"
        : "Pick an archetype, sign and scene first",
  };

  // Build "SCORPIO ARCHETYPE AI SCENE" style title; fallback when missing
  const aiTitle = (() => {
    if (zodiac && archetype) {
      return lang === "tr"
        ? `${zodiac.label[lang]} · ${archetype.label[lang]} ${T.aiKickerSuffix}`
        : `${zodiac.label[lang]} ${archetype.label[lang]} ${T.aiKickerSuffix}`;
    }
    if (zodiac)
      return lang === "tr"
        ? `${zodiac.label[lang]} ${T.aiKickerSuffix}`
        : `${zodiac.label[lang]} ${T.aiKickerSuffix}`;
    return lang === "tr" ? `CAELINUS ${T.aiKickerSuffix}` : `CAELINUS ${T.aiKickerSuffix}`;
  })();

  return (
    <div className="play-dashboard">
      {/* ─────────────────── HERO ─────────────────── */}
      <section className="play-dash-hero">
        <div className="play-dash-hero-portal">
          <NebulaPortal size={180} tone="magenta" pulse>
            <span className="play-dash-hero-glyph" aria-hidden="true">
              ✦
            </span>
          </NebulaPortal>
        </div>

        <p className="play-dash-hero-eyebrow">{T.heroEyebrow}</p>
        <h1 className="play-dash-hero-title">{T.heroTitle}</h1>
        <p className="play-dash-hero-lead">{T.heroLead}</p>

        <div className="play-dash-hero-cta">
          <CinemaCTA
            variant="luminous"
            tone="magenta"
            onClick={scrollToArchetype}
          >
            {T.heroCta}
          </CinemaCTA>
        </div>
      </section>

      {/* ─────────────── ARCHETYPE SHOWCASE ─────────────── */}
      <section
        ref={archetypeRef}
        className="play-dash-panel play-dash-archetype"
        aria-labelledby="play-dash-archetype-h"
      >
        <h2 id="play-dash-archetype-h" className="play-dash-section-title">
          {T.archetypeKicker}
        </h2>

        <div className="play-dash-archetype-row" role="radiogroup">
          {ARCHETYPES.map((a) => {
            const sigZodiac = ARCHETYPE_SIGNATURE_ZODIAC[a.id];
            const thumbnailUrl = previews[`${a.id}-${sigZodiac}`] ?? null;
            return (
              <ArchetypeSilhouette
                key={a.id}
                id={a.id}
                label={a.label[lang]}
                tone={a.tone}
                glyph={a.glyph}
                active={archetypeId === a.id}
                thumbnailUrl={thumbnailUrl}
                onPick={setArchetype}
              />
            );
          })}
        </div>

        <div className="play-dash-archetype-foot">
          <button
            type="button"
            className={
              "play-dash-pill-btn" + (archetypeId ? " is-ready" : " is-disabled")
            }
            disabled={!archetypeId}
            onClick={() => {
              const el = document.getElementById("play-dash-avatar-h");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {T.archetypeNext}
          </button>
        </div>
      </section>

      {/* ─────────────── 2x2 GRID: AVATAR / WHERE-TO + AI SCENE ─────────────── */}
      <div className="play-dash-grid">
        {/* LEFT: Avatar (zodiac ring) */}
        <section
          className="play-dash-panel play-dash-avatar"
          aria-labelledby="play-dash-avatar-h"
        >
          <h2 id="play-dash-avatar-h" className="play-dash-section-title">
            {T.avatarKicker}
          </h2>

          <div className="play-dash-avatar-stage">
            <div
              className="play-dash-zodiac-ring"
              aria-label={
                lang === "tr" ? "12 burç çemberi" : "Zodiac wheel of 12"
              }
            >
              {ZODIACS.map((z, i) => {
                const angle = (i / ZODIACS.length) * 360 - 90;
                const active = zodiacId === z.id;
                // Thumbnail kicks in only after the user picks an
                // archetype — that's when there's a meaningful pair to
                // show. Without one we fall back to the glyph-only pip.
                const thumbnailUrl =
                  archetypeId && previews[`${archetypeId}-${z.id}`]
                    ? previews[`${archetypeId}-${z.id}`]
                    : null;
                return (
                  <button
                    key={z.id}
                    type="button"
                    className={
                      "play-dash-zodiac-pip" +
                      (active ? " is-active" : "") +
                      (thumbnailUrl ? " has-thumb" : "") +
                      ` play-dash-zodiac-pip--${z.tone}`
                    }
                    style={{ ["--angle" as string]: `${angle}deg` }}
                    onClick={() => setZodiac(z.id)}
                    aria-label={z.label[lang]}
                    aria-pressed={active}
                    title={z.label[lang]}
                  >
                    {thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailUrl}
                        alt=""
                        aria-hidden="true"
                        className="play-dash-zodiac-pip-thumb"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <span className="play-dash-zodiac-pip-glyph">{z.glyph}</span>
                    <span className="play-dash-zodiac-pip-name">{z.label[lang]}</span>
                  </button>
                );
              })}

              <div className="play-dash-zodiac-core">
                <NebulaPortal
                  size={200}
                  tone={zodiac ? zodiac.tone : "cosmic"}
                  pulse
                >
                  <span
                    className="play-dash-zodiac-core-glyph"
                    aria-hidden="true"
                  >
                    {zodiac ? zodiac.glyph : "✦"}
                  </span>
                </NebulaPortal>
                <p className="play-dash-zodiac-core-label">
                  {zodiac
                    ? zodiac.label[lang]
                    : lang === "tr"
                      ? "Bir burç seç"
                      : "Pick a sign"}
                </p>
              </div>
            </div>
          </div>

          <p className="play-dash-avatar-hint">{T.avatarHint}</p>
        </section>

        {/* RIGHT TOP: Where To */}
        <section
          className="play-dash-panel play-dash-where"
          aria-labelledby="play-dash-where-h"
        >
          <h2 id="play-dash-where-h" className="play-dash-section-title">
            {T.sceneKicker}
          </h2>

          <div className="play-dash-scene-row" role="radiogroup">
            {PUBLIC_SCENES.map((s) => (
              <SceneCard
                key={s.id}
                id={s.id}
                label={s.label[lang]}
                tone={s.tone}
                glyph={s.glyph}
                active={sceneId === s.id}
                onPick={setScene}
              />
            ))}
          </div>
        </section>

        {/* RIGHT BOTTOM: AI Scene preview + actions */}
        <section
          className="play-dash-panel play-dash-ai"
          aria-labelledby="play-dash-ai-h"
        >
          <h2 id="play-dash-ai-h" className="play-dash-section-title">
            {aiTitle}
          </h2>

          <div className="play-dash-ai-stage">
            {render.kind === "idle" ? (
              <AiPlaceholder
                tone={zodiac?.tone ?? archetype?.tone ?? "magenta"}
                glyph={zodiac?.glyph ?? archetype?.glyph ?? "✦"}
                lead={
                  scene
                    ? `${scene.label[lang]} · ${scene.glyph}`
                    : T.aiPlaceholder
                }
              />
            ) : (
              <RenderCanvas lang={lang} onRetry={onRetry} />
            )}
          </div>

          {/* Generate / Actions footer */}
          <div className="play-dash-ai-foot">
            {!hasResult ? (
              <CinemaCTA
                variant="luminous"
                tone={zodiac?.tone ?? "magenta"}
                trailingGlyph={isRendering ? "◌" : "✦"}
                onClick={onGenerate}
                disabled={!allSelected || isRendering}
              >
                {isRendering
                  ? lang === "tr"
                    ? "Çiziliyor..."
                    : "Painting..."
                  : T.generate}
              </CinemaCTA>
            ) : (
              <LookActions
                lang={lang}
                onSave={onSave}
                onShare={onShare}
                onReroll={onReroll}
                variant={variant}
                toast={toast}
              />
            )}

            {!allSelected && !hasResult ? (
              <p className="play-dash-ai-need">{T.needPicks}</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function ArchetypeSilhouette({
  id,
  label,
  glyph,
  tone,
  active,
  thumbnailUrl,
  onPick,
}: {
  id: ArchetypeId;
  label: string;
  glyph: string;
  tone: "magenta" | "cosmic" | "gold" | "amber" | "teal";
  active: boolean;
  /** Photo from the warmed avatar matrix; null while previews are
   *  loading or when the warm script hasn't been run yet. */
  thumbnailUrl: string | null;
  onPick: (id: ArchetypeId) => void;
}) {
  return (
    <button
      type="button"
      className={
        "play-dash-archetype-tile" +
        (active ? " is-active" : "") +
        (thumbnailUrl ? " has-thumb" : "") +
        ` play-dash-archetype-tile--${tone}`
      }
      onClick={() => onPick(id)}
      aria-pressed={active}
    >
      <span className="play-dash-archetype-figure" aria-hidden="true">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="play-dash-archetype-figure-photo"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            <span className="play-dash-archetype-figure-aura" />
            <span className="play-dash-archetype-figure-body" />
          </>
        )}
        <span className="play-dash-archetype-figure-glyph">{glyph}</span>
      </span>
      <span className="play-dash-archetype-podium" aria-hidden="true" />
      <span className="play-dash-archetype-label">{label}</span>
    </button>
  );
}

function SceneCard({
  id,
  label,
  glyph,
  tone,
  active,
  onPick,
}: {
  id: SceneId;
  label: string;
  glyph: string;
  tone: "magenta" | "cosmic" | "gold" | "amber" | "teal";
  active: boolean;
  onPick: (id: SceneId) => void;
}) {
  return (
    <button
      type="button"
      className={
        "play-dash-scene-tile" +
        (active ? " is-active" : "") +
        ` play-dash-scene-tile--${tone}`
      }
      onClick={() => onPick(id)}
      aria-pressed={active}
    >
      <span className="play-dash-scene-tile-glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="play-dash-scene-tile-label">{label}</span>
    </button>
  );
}

function AiPlaceholder({
  tone,
  glyph,
  lead,
}: {
  tone: "magenta" | "cosmic" | "gold" | "amber" | "teal";
  glyph: string;
  lead: string;
}) {
  return (
    <div className={"play-dash-ai-placeholder play-dash-ai-placeholder--" + tone}>
      <NebulaPortal size={260} tone={tone} pulse>
        <span className="play-dash-ai-placeholder-glyph">{glyph}</span>
      </NebulaPortal>
      <p className="play-dash-ai-placeholder-lead">{lead}</p>
    </div>
  );
}


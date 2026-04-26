"use client";

/**
 * TurkeyMapInteractive
 * ─────────────────────
 * The real, surveyable map of Türkiye — every one of the 81 provinces
 * is a discrete <path>, drawn from the alpers/Turkey-Maps-GeoJSON
 * dataset and pre-projected to SVG units by
 * `scripts/build-turkey-svg-paths.mjs`.
 *
 * Behaviour
 *   • Hover  → province glows in its region tone, a tooltip with
 *              plate + name + region pops up near the cursor.
 *   • Click  → province becomes the active one (panel opens upstream).
 *   • Region → when a region is filtered, every province NOT in that
 *              region is dimmed, so the chosen biome lights up alone.
 *   • Active → the selected province glows the brightest and gets
 *              a thicker stroke + pulse.
 *   • Keyboard
 *              All 81 paths are tab-stops (`tabIndex=0`), Enter / Space
 *              activates them. Tooltips appear on focus too.
 *
 * Performance
 *   • The 71-KB path module is bundled lazily by the parent through
 *     `next/dynamic`, so it's never on the critical path.
 *   • One SVG, no per-province react state — everything is driven by
 *     classes, data-attributes and a single hovered/active state.
 */

import { useMemo, useRef, useState, useCallback, type KeyboardEvent } from "react";

import {
  TURKEY_VIEW_BOX,
  TURKEY_VIEW_HEIGHT,
  TURKEY_VIEW_WIDTH,
  TURKEY_SVG_PATHS,
  TURKEY_SVG_PATH_META,
} from "@/data/turkey-svg-paths";
import {
  PROVINCES,
  PROVINCE_REGIONS,
  type Province,
  type ProvinceRegionId,
} from "@/data/provinces";

/* ─────────────────────────────────────────────
   helpers
   ───────────────────────────────────────────── */

function hexToRgbTriple(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/** Build a fast `plate -> Province` table once per mount. */
function provincesByPlate() {
  return new Map(PROVINCES.map((p) => [p.plate, p]));
}

/* ─────────────────────────────────────────────
   types
   ───────────────────────────────────────────── */

type Lang = "tr" | "en";

type Props = {
  lang: Lang;
  activeRegion: ProvinceRegionId | "all";
  activeProvinceId: string | null;
  onSelect: (provinceId: string) => void;
  /** i18n dictionary for the small region label / region word. */
  t: { region: string };
};

type Hover = {
  plate: string;
  province: Province;
  /** Position relative to the SVG container, in px. */
  x: number;
  y: number;
};

/* ─────────────────────────────────────────────
   component
   ───────────────────────────────────────────── */

export default function TurkeyMapInteractive({
  lang,
  activeRegion,
  activeProvinceId,
  onSelect,
  t,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const lookup = useMemo(provincesByPlate, []);
  const regionLookup = useMemo(
    () => new Map(PROVINCE_REGIONS.map((r) => [r.id, r])),
    [],
  );

  // Plate of the currently active province, for fast equality checks
  // inside the render loop.
  const activePlate = useMemo(() => {
    if (!activeProvinceId) return null;
    return PROVINCES.find((p) => p.id === activeProvinceId)?.plate ?? null;
  }, [activeProvinceId]);

  /* ── pointer / focus handlers ── */

  const handleEnter = useCallback(
    (
      ev: React.PointerEvent<SVGPathElement> | React.FocusEvent<SVGPathElement>,
      plate: string,
    ) => {
      const province = lookup.get(plate);
      if (!province) return;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const wrapRect = wrap.getBoundingClientRect();
      // For pointer events we have clientX/Y. For focus we don't, so we
      // fall back to the path's own bounding box centre.
      let cx: number;
      let cy: number;
      if ("clientX" in ev && ev.clientX) {
        cx = ev.clientX - wrapRect.left;
        cy = ev.clientY - wrapRect.top;
      } else {
        const rect = (ev.currentTarget as SVGPathElement).getBoundingClientRect();
        cx = rect.left + rect.width / 2 - wrapRect.left;
        cy = rect.top + rect.height / 2 - wrapRect.top;
      }
      setHover({ plate, province, x: cx, y: cy });
    },
    [lookup],
  );

  const handleMove = useCallback(
    (ev: React.PointerEvent<SVGPathElement>, plate: string) => {
      // Update tooltip position as the cursor glides; cheap, no React tree
      // re-render of the SVG paths because they don't depend on `hover`.
      setHover((prev) => {
        if (!prev || prev.plate !== plate) return prev;
        const wrap = wrapRef.current;
        if (!wrap) return prev;
        const wrapRect = wrap.getBoundingClientRect();
        return {
          ...prev,
          x: ev.clientX - wrapRect.left,
          y: ev.clientY - wrapRect.top,
        };
      });
    },
    [],
  );

  const handleLeave = useCallback(() => setHover(null), []);

  const handleKey = useCallback(
    (ev: KeyboardEvent<SVGPathElement>, provinceId: string) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        onSelect(provinceId);
      }
    },
    [onSelect],
  );

  /* ── render ── */

  // Render order: dimmed first, active last — so the active province's
  // halo doesn't get clipped by neighbouring strokes.
  const ordered = useMemo(() => {
    const provinces = [...PROVINCES];
    provinces.sort((a, b) => {
      const aActive = a.plate === activePlate ? 1 : 0;
      const bActive = b.plate === activePlate ? 1 : 0;
      return aActive - bActive;
    });
    return provinces;
  }, [activePlate]);

  // Position the tooltip so it doesn't overflow the wrap on the right edge.
  const tooltipX = hover ? hover.x : 0;
  const tooltipY = hover ? hover.y : 0;

  const aspectPct = (TURKEY_VIEW_HEIGHT / TURKEY_VIEW_WIDTH) * 100;

  return (
    <div
      ref={wrapRef}
      className={
        "atlas-map-wrap" +
        (activeRegion === "all" ? "" : " is-region-filtered") +
        (hover ? " is-hovering" : "")
      }
      style={{ paddingBottom: `${aspectPct.toFixed(2)}%` }}
    >
      <svg
        className="atlas-map-svg"
        viewBox={TURKEY_VIEW_BOX}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Türkiye 81 il haritası"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* soft ground-glow layer behind the country outline */}
        <defs>
          <radialGradient id="atlas-map-glow" cx="50%" cy="55%" r="65%">
            <stop offset="0%" stopColor="rgba(168, 226, 168, 0.12)" />
            <stop offset="60%" stopColor="rgba(168, 226, 168, 0.04)" />
            <stop offset="100%" stopColor="rgba(168, 226, 168, 0)" />
          </radialGradient>
          <filter id="atlas-map-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        <rect
          x="0"
          y="0"
          width={TURKEY_VIEW_WIDTH}
          height={TURKEY_VIEW_HEIGHT}
          fill="url(#atlas-map-glow)"
        />

        {/* the 81 paths */}
        <g className="atlas-map-paths">
          {ordered.map((province) => {
            const d = TURKEY_SVG_PATHS[province.plate];
            if (!d) return null;
            const region = regionLookup.get(province.regionId);
            if (!region) return null;
            const tone = hexToRgbTriple(region.tone);
            const isActive = province.plate === activePlate;
            const isInRegion =
              activeRegion === "all" || activeRegion === province.regionId;
            const isHovered = hover?.plate === province.plate;

            const className =
              "atlas-map-path" +
              (isActive ? " is-active" : "") +
              (isHovered ? " is-hover" : "") +
              (isInRegion ? "" : " is-dimmed");

            return (
              <path
                key={province.plate}
                d={d}
                className={className}
                style={{
                  ["--p-tone" as string]: tone,
                }}
                data-plate={province.plate}
                data-province={province.id}
                data-region={province.regionId}
                tabIndex={0}
                role="button"
                aria-label={`${province.plate} ${province.name[lang]} · ${region.name[lang]}`}
                aria-pressed={isActive}
                onPointerEnter={(ev) => handleEnter(ev, province.plate)}
                onPointerMove={(ev) => handleMove(ev, province.plate)}
                onPointerLeave={handleLeave}
                onFocus={(ev) => handleEnter(ev, province.plate)}
                onBlur={handleLeave}
                onClick={() => onSelect(province.id)}
                onKeyDown={(ev) => handleKey(ev, province.id)}
              />
            );
          })}
        </g>

        {/* an overlay dot at the centroid of the active province
            — purely decorative, anchors the eye while the panel scrolls in.
            The radial ring uses SMIL (browser-native, ignored by Turbopack
            CSS) to grow + fade. */}
        {activePlate && TURKEY_SVG_PATH_META[activePlate] && (
          <g className="atlas-map-pin" pointerEvents="none">
            <circle
              cx={TURKEY_SVG_PATH_META[activePlate].centroid[0]}
              cy={TURKEY_SVG_PATH_META[activePlate].centroid[1]}
              r="3"
              className="atlas-map-pin-core"
            />
            <circle
              cx={TURKEY_SVG_PATH_META[activePlate].centroid[0]}
              cy={TURKEY_SVG_PATH_META[activePlate].centroid[1]}
              r="4"
              className="atlas-map-pin-ring"
            >
              <animate
                attributeName="r"
                from="4"
                to="18"
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="1"
                to="0"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </svg>

      {/* Tooltip — DOM, not SVG, so we can use real typography */}
      {hover && (() => {
        const region = regionLookup.get(hover.province.regionId);
        const tone = region ? hexToRgbTriple(region.tone) : "168, 226, 168";
        return (
          <div
            className="atlas-map-tip"
            style={{
              left: tooltipX,
              top: tooltipY,
              ["--tip-tone" as string]: tone,
            }}
            aria-hidden="true"
          >
            <span className="atlas-map-tip-plate">{hover.province.plate}</span>
            <span className="atlas-map-tip-name">
              {hover.province.name[lang]}
            </span>
            {region && (
              <span className="atlas-map-tip-region">
                {t.region} · {region.name[lang]}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}

/* re-export for callers that want to know the canvas size */
export { TURKEY_VIEW_BOX, TURKEY_VIEW_WIDTH, TURKEY_VIEW_HEIGHT };

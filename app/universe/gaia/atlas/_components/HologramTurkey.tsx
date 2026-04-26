"use client";

/**
 * Hologram Turkey — Caelinus matrix edition.
 *
 *  • Black void + cascading matrix rain (rendered separately)
 *  • Green pulsing Turkey silhouette with animated dashed outline
 *  • Phytogeographic regions as soft radial light blobs (intensify on filter)
 *  • Ley lines connecting major spiritual / botanical hubs across Anatolia,
 *    drawn with animated dashes and faint glow
 *  • Major-city dots: pulsing green with white-mint heads, the active
 *    province burning brightest
 *  • A horizontal scan line sweeps the country every 7 seconds
 *
 * Coordinates derived from real lng/lat:
 *    x = (lng − 26) × 50    y = (42 − lat) × 50    in a 950 × 320 viewBox
 */

import type { ProvinceRegionId } from "@/data/provinces";

export type HologramTurkeyProps = {
  activeRegion: ProvinceRegionId | "all";
  activeProvinceId: string | null;
};

/* ─────────────────────────────────────────────
   GEOMETRY
   ───────────────────────────────────────────── */

/** Turkey outer silhouette, simplified. */
const TURKEY_PATH = `
  M 0 0
  L 125 20
  L 200 25
  L 350 15
  L 500 25
  L 650 40
  L 775 30
  L 825 40
  L 885 75
  L 940 115
  L 925 150
  L 915 210
  L 875 235
  L 800 240
  L 700 265
  L 575 265
  L 525 300
  L 450 285
  L 350 285
  L 250 275
  L 175 270
  L 100 250
  L 30 200
  L 25 125
  L 0 75
  Z
`;

type RegionBlob = {
  id: ProvinceRegionId;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Hex tone, used for the radial gradient. */
  tone: string;
};

const REGION_BLOBS: RegionBlob[] = [
  { id: "marmara",            cx: 110, cy:  60, rx: 130, ry:  55, tone: "#9aaa6a" },
  { id: "ege",                cx:  90, cy: 175, rx: 110, ry:  85, tone: "#d4b78a" },
  { id: "akdeniz",            cx: 320, cy: 250, rx: 200, ry:  60, tone: "#a08aff" },
  { id: "ic-anadolu",         cx: 380, cy: 150, rx: 200, ry:  90, tone: "#f0d9a8" },
  { id: "karadeniz",          cx: 500, cy:  60, rx: 280, ry:  60, tone: "#7fb87a" },
  { id: "dogu-anadolu",       cx: 800, cy: 150, rx: 160, ry: 110, tone: "#6ec3ff" },
  { id: "guneydogu-anadolu",  cx: 670, cy: 240, rx: 200, ry:  60, tone: "#ff8ad9" },
];

type CityDot = {
  id: string;
  x: number;
  y: number;
  weight?: number;
};

const CITY_DOTS: CityDot[] = [
  { id: "istanbul",   x: 148, y:  49, weight: 1.4 },
  { id: "ankara",     x: 343, y: 103, weight: 1.4 },
  { id: "izmir",      x:  57, y: 179, weight: 1.3 },
  { id: "bursa",      x: 153, y:  91 },
  { id: "antalya",    x: 235, y: 254, weight: 1.2 },
  { id: "adana",      x: 466, y: 250, weight: 1.2 },
  { id: "konya",      x: 325, y: 206 },
  { id: "kayseri",    x: 474, y: 164 },
  { id: "samsun",     x: 516, y:  36 },
  { id: "trabzon",    x: 686, y:  50 },
  { id: "gaziantep",  x: 569, y: 246 },
  { id: "sanliurfa",  x: 619, y: 256 },
  { id: "diyarbakir", x: 712, y: 204 },
  { id: "malatya",    x: 616, y: 182 },
  { id: "erzurum",    x: 763, y: 104 },
  { id: "van",        x: 869, y: 175 },
  { id: "isparta",    x: 227, y: 212 },
  { id: "denizli",    x: 154, y: 211 },
  { id: "mersin",     x: 431, y: 259 },
  { id: "hatay",      x: 511, y: 304 },
  { id: "rize",       x: 730, y:  42 },
];

/** Ley lines — straight currents connecting hubs (Anatolian spine). */
const LEY_LINES: Array<{ from: string; to: string; delay?: number }> = [
  { from: "istanbul",  to: "hatay",     delay: 0 },
  { from: "izmir",     to: "van",       delay: 1.5 },
  { from: "trabzon",   to: "antalya",   delay: 3 },
  { from: "samsun",    to: "gaziantep", delay: 4.5 },
  { from: "ankara",    to: "diyarbakir",delay: 6 },
  { from: "isparta",   to: "erzurum",   delay: 7.5 },
];

const CITY_INDEX: Record<string, CityDot> = Object.fromEntries(
  CITY_DOTS.map((c) => [c.id, c])
);

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

export default function HologramTurkey({
  activeRegion,
  activeProvinceId,
}: HologramTurkeyProps) {
  const regionFocused = activeRegion !== "all";

  return (
    <div className="atlas-hologram" aria-hidden="true">
      <svg
        viewBox="0 0 950 320"
        preserveAspectRatio="xMidYMid meet"
        className="atlas-hologram-svg"
      >
        <defs>
          {/* outline gradient — Caelinus green ↔ gold */}
          <linearGradient id="atlas-holo-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7CFFB2" stopOpacity="0.9" />
            <stop offset="50%"  stopColor="#00FF88" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#d4b78a" stopOpacity="0.85" />
          </linearGradient>

          {/* fill — soft inner green glow */}
          <radialGradient id="atlas-holo-fill" cx="50%" cy="50%" r="65%">
            <stop offset="0%"   stopColor="#00FF88" stopOpacity="0.10" />
            <stop offset="60%"  stopColor="#0fa86a" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* per-region soft blobs */}
          {REGION_BLOBS.map((b) => (
            <radialGradient
              key={b.id}
              id={`atlas-holo-region-${b.id}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%"  stopColor={b.tone} stopOpacity="0.45" />
              <stop offset="60%" stopColor={b.tone} stopOpacity="0.14" />
              <stop offset="100%" stopColor={b.tone} stopOpacity="0" />
            </radialGradient>
          ))}

          {/* topographic grid */}
          <pattern
            id="atlas-holo-grid"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(124, 255, 178, 0.10)"
              strokeWidth="0.5"
            />
          </pattern>

          {/* clip = inside the silhouette only */}
          <clipPath id="atlas-holo-clip">
            <path d={TURKEY_PATH} />
          </clipPath>
        </defs>

        {/* country fill area (clipped) ─────────── */}
        <g clipPath="url(#atlas-holo-clip)">
          <rect width="950" height="320" fill="url(#atlas-holo-grid)" />
          <rect
            width="950"
            height="320"
            fill="url(#atlas-holo-fill)"
            className="atlas-holo-fillpulse"
          />

          {REGION_BLOBS.map((blob) => {
            const isActive = activeRegion === blob.id;
            const isDimmed = regionFocused && !isActive;
            return (
              <ellipse
                key={blob.id}
                cx={blob.cx}
                cy={blob.cy}
                rx={blob.rx}
                ry={blob.ry}
                fill={`url(#atlas-holo-region-${blob.id})`}
                className={
                  "atlas-holo-blob" +
                  (isActive ? " is-active" : "") +
                  (isDimmed ? " is-dim" : "")
                }
              />
            );
          })}

          {/* horizontal scan line */}
          <line
            x1="0"
            x2="950"
            y1="0"
            y2="0"
            stroke="rgba(124, 255, 178, 0.6)"
            strokeWidth="1.2"
            className="atlas-holo-scan"
          >
            <animate
              attributeName="y1"
              from="20"
              to="300"
              dur="7s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="y2"
              from="20"
              to="300"
              dur="7s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.1;0.9;1"
              dur="7s"
              repeatCount="indefinite"
            />
          </line>
        </g>

        {/* country outline — pulsing green ──────── */}
        <path
          d={TURKEY_PATH}
          fill="none"
          stroke="url(#atlas-holo-stroke)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="atlas-holo-outline"
        />

        {/* ley lines — Anatolian spine currents ── */}
        <g className="atlas-holo-ley">
          {LEY_LINES.map((line, i) => {
            const a = CITY_INDEX[line.from];
            const b = CITY_INDEX[line.to];
            if (!a || !b) return null;
            return (
              <line
                key={`${line.from}-${line.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="atlas-holo-ley-line"
                style={{
                  animationDelay: `${line.delay ?? i * 0.6}s`,
                }}
              />
            );
          })}
        </g>

        {/* major-city pulsing dots */}
        <g className="atlas-holo-dots">
          {CITY_DOTS.map((c) => {
            const isActive = c.id === activeProvinceId;
            const w = c.weight ?? 1;
            return (
              <g
                key={c.id}
                className={"atlas-holo-dot" + (isActive ? " is-active" : "")}
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? 5 : 1.8 * w}
                  className="atlas-holo-dot-core"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? 14 : 6 * w}
                  className="atlas-holo-dot-halo"
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

"use client";

/**
 * TraitMoodboard — kullanıcının seçtiği trait'leri elegant bir
 * "renk çalışması" olarak gösteren preview kartı.
 *
 * NEDEN BU? Eski ParametricAvatar yüzü SVG ile çizmeye çalışıyordu;
 * sonuç amatör cartoon hissi veriyordu. Caelinus markasının
 * kalitesine yakışmıyordu.
 *
 * Yeni yaklaşım: yüz çizmeye çalışmıyoruz. Yerine seçilen renkleri
 * dikey bir "mood card" olarak diziyoruz — saç/göz/ten/dudak/aura
 * gradient + glyph + kozmik partiküller. Bu honest bir preview:
 * "tanrıçanı doğurduğunda bu renkler birleşecek."
 *
 * AI portresi `/api/avatar/portrait`'tan geldiğinde bu kart yerini
 * gerçek photoreal portreye bırakır. BuilderFlow iki state arasında
 * crossfade yapar.
 *
 * 600×800 viewBox, ParametricAvatar ile aynı oran — layout aynı kalır.
 */

import {
  FREQUENCY_GLYPHS,
  ZODIAC_GLYPH_CHARS,
  findEye,
  findHairColor,
  findLip,
  findSkin,
  findFrequency,
  type BuilderTraits,
} from "@/lib/avatar/builder";

type Props = {
  traits: BuilderTraits;
  size?: number | string;
  ariaLabel?: string;
  idPrefix?: string;
};

export default function TraitMoodboard({
  traits,
  size = "100%",
  ariaLabel = "Caelinus trait moodboard",
  idPrefix = "tm",
}: Props) {
  const skin = findSkin(traits.skin);
  const hair = findHairColor(traits.hairColor);
  const eye = findEye(traits.eye);
  const lip = findLip(traits.lip);
  const freq = findFrequency(traits.frequency);

  const auraColor = (() => {
    if (traits.glyph === "frequency") return freq.color;
    if (traits.zodiac) return zodiacAuraColor(traits.zodiac);
    return "#d4af6a";
  })();

  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <svg
      viewBox="0 0 600 800"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        {/* Background nebula */}
        <radialGradient id={id("bg")} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="rgba(60,40,80,0.55)" />
          <stop offset="55%" stopColor="rgba(20,15,30,0.85)" />
          <stop offset="100%" stopColor="rgba(8,6,15,1)" />
        </radialGradient>

        {/* Aura — büyük yumuşak halo */}
        <radialGradient id={id("aura")} cx="50%" cy="36%" r="48%">
          <stop offset="0%" stopColor={auraColor} stopOpacity="0.42" />
          <stop offset="55%" stopColor={auraColor} stopOpacity="0.12" />
          <stop offset="100%" stopColor={auraColor} stopOpacity="0" />
        </radialGradient>

        {/* Saç renk şeridi gradient — uzunluğa göre düşey akış */}
        <linearGradient id={id("hair")} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={hair.shade ?? hair.color} />
          <stop offset="50%" stopColor={hair.color} />
          <stop offset="100%" stopColor={hair.highlight ?? hair.color} stopOpacity="0.88" />
        </linearGradient>

        {/* Skin band */}
        <linearGradient id={id("skin")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={skin.shade ?? skin.color} />
          <stop offset="50%" stopColor={skin.highlight ?? skin.color} />
          <stop offset="100%" stopColor={skin.shade ?? skin.color} />
        </linearGradient>

        {/* Lip swatch */}
        <radialGradient id={id("lip")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lip.highlight ?? lip.color} />
          <stop offset="60%" stopColor={lip.color} />
          <stop offset="100%" stopColor={lip.shade ?? lip.color} />
        </radialGradient>

        {/* Iris swatch */}
        <radialGradient id={id("iris")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={eye.highlight ?? eye.color} />
          <stop offset="55%" stopColor={eye.color} />
          <stop offset="100%" stopColor={eye.shade ?? eye.color} />
        </radialGradient>

        {/* Cosmic glow */}
        <filter id={id("glow")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="600" height="800" fill={`url(#${id("bg")})`} />

      <StarField idPrefix={idPrefix} />

      {/* Aura — geniş halo */}
      <circle cx={300} cy={290} r={260} fill={`url(#${id("aura")})`} />

      {/* ── Glyph (alın bölgesi) — ana sembol ───────────── */}
      {traits.glyph === "zodiac" && traits.zodiac && (
        <g>
          <circle
            cx={300}
            cy={150}
            r={48}
            fill="none"
            stroke={auraColor}
            strokeWidth={1.2}
            opacity={0.5}
          />
          <text
            x={300}
            y={170}
            textAnchor="middle"
            fontSize={56}
            fill={auraColor}
            opacity={0.95}
            style={{ fontFamily: "serif" }}
            filter={hair.cosmic ? `url(#${id("glow")})` : undefined}
          >
            {ZODIAC_GLYPH_CHARS[traits.zodiac]}
          </text>
        </g>
      )}
      {traits.glyph === "frequency" && (
        <g>
          <circle
            cx={300}
            cy={150}
            r={42}
            fill="none"
            stroke={freq.color}
            strokeWidth={1.5}
            opacity={0.85}
            filter={`url(#${id("glow")})`}
          />
          <text
            x={300}
            y={155}
            textAnchor="middle"
            fontSize={20}
            fill={freq.color}
            opacity={0.95}
            style={{ fontFamily: "ui-sans-serif, system-ui", letterSpacing: "0.06em", fontWeight: 300 }}
          >
            {freq.label}
          </text>
        </g>
      )}

      {/* ── Saç renk şeridi — sol omuzdan inen ──────────── */}
      <path
        d={`
          M 90 220
          Q 80 380, 110 540
          Q 150 700, 240 760
          L 280 760
          Q 200 660, 180 540
          Q 160 380, 175 230
          Q 130 215, 90 220 Z
        `}
        fill={`url(#${id("hair")})`}
        opacity={0.75}
        filter={hair.cosmic ? `url(#${id("glow")})` : undefined}
      />
      <path
        d={`
          M 510 220
          Q 520 380, 490 540
          Q 450 700, 360 760
          L 320 760
          Q 400 660, 420 540
          Q 440 380, 425 230
          Q 470 215, 510 220 Z
        `}
        fill={`url(#${id("hair")})`}
        opacity={0.75}
        filter={hair.cosmic ? `url(#${id("glow")})` : undefined}
      />

      {/* ── Merkez "trait sütunu" — dikey rounded rectangle
       *    içinde sırayla renk diskleri ───────────────────── */}
      <g transform="translate(300, 260)">
        {/* Container card */}
        <rect
          x={-90}
          y={0}
          width={180}
          height={420}
          rx={90}
          fill="rgba(20,14,30,0.42)"
          stroke="rgba(220,200,255,0.18)"
          strokeWidth={1}
        />

        {/* Skin band */}
        <SwatchRow
          y={50}
          label="TEN"
          color={skin.color}
          gradient={`url(#${id("skin")})`}
          highlight={skin.highlight}
        />

        {/* Hair color */}
        <SwatchRow
          y={130}
          label="SAÇ"
          color={hair.color}
          highlight={hair.highlight}
          glow={hair.cosmic ? id("glow") : undefined}
        />

        {/* Eye iris */}
        <SwatchRow
          y={210}
          label="GÖZ"
          color={eye.color}
          highlight={eye.highlight}
          gradient={`url(#${id("iris")})`}
          glow={eye.cosmic ? id("glow") : undefined}
        />

        {/* Lip */}
        <SwatchRow
          y={290}
          label="DUDAK"
          color={lip.color}
          highlight={lip.highlight}
          gradient={`url(#${id("lip")})`}
          glow={lip.cosmic ? id("glow") : undefined}
        />

        {/* Aura */}
        <SwatchRow
          y={370}
          label="AURA"
          color={auraColor}
          highlight={auraColor}
          glow={id("glow")}
        />
      </g>

      {/* "Henüz doğmadı" işareti — alt köşede ince yazı */}
      <text
        x={300}
        y={730}
        textAnchor="middle"
        fontSize={9}
        fill="rgba(220,200,255,0.5)"
        style={{ fontFamily: "ui-sans-serif, system-ui", letterSpacing: "0.32em" }}
      >
        ✦ TANRIÇAN DOĞMAYI BEKLİYOR ✦
      </text>
    </svg>
  );
}

/* ── Sub: tek bir trait'in renk satırı ─────────────────── */

function SwatchRow({
  y,
  label,
  color,
  highlight,
  gradient,
  glow,
}: {
  y: number;
  label: string;
  color: string;
  highlight?: string;
  gradient?: string;
  glow?: string;
}) {
  return (
    <g transform={`translate(0, ${y})`}>
      {/* İnce yatay çizgi (üstünde) */}
      <line
        x1={-78}
        x2={78}
        y1={-22}
        y2={-22}
        stroke="rgba(220,200,255,0.08)"
        strokeWidth={0.5}
      />
      {/* Disk */}
      <circle
        cx={0}
        cy={0}
        r={26}
        fill={gradient ?? color}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
        filter={glow ? `url(#${glow})` : undefined}
      />
      {/* Highlight */}
      {highlight && (
        <circle cx={-7} cy={-8} r={6} fill={highlight} opacity={0.55} />
      )}
      {/* Label — disk'in sağında */}
      <text
        x={42}
        y={4}
        fontSize={10}
        fill="rgba(220,200,255,0.7)"
        style={{ fontFamily: "ui-sans-serif, system-ui", letterSpacing: "0.28em" }}
      >
        {label}
      </text>
    </g>
  );
}

function zodiacAuraColor(z: string): string {
  const map: Record<string, string> = {
    aries: "#d44a4a",
    taurus: "#88a85a",
    gemini: "#d4c44a",
    cancer: "#a8c4d4",
    leo: "#d49a4a",
    virgo: "#b4a878",
    libra: "#d48aaa",
    scorpio: "#7a3a8a",
    sagittarius: "#a85a3a",
    capricorn: "#5a4a6a",
    aquarius: "#4abcd4",
    pisces: "#7aa8d4",
  };
  return map[z] ?? "#d4af6a";
}

function StarField({ idPrefix }: { idPrefix: string }) {
  const stars = Array.from({ length: 28 }).map((_, i) => {
    const a = (i * 137.5) % 360;
    const r = 220 + ((i * 31) % 180);
    const x = 300 + Math.cos((a * Math.PI) / 180) * r;
    const y = 300 + Math.sin((a * Math.PI) / 180) * r;
    const size = 0.5 + ((i * 7) % 4) * 0.4;
    const opacity = 0.3 + ((i * 13) % 7) * 0.08;
    return { x, y, size, opacity };
  });
  return (
    <g aria-hidden="true">
      {stars.map((s, i) => (
        <circle
          key={`${idPrefix}-star-${i}`}
          cx={s.x}
          cy={s.y}
          r={s.size}
          fill="#fff"
          opacity={s.opacity}
        />
      ))}
    </g>
  );
}

export { FREQUENCY_GLYPHS };

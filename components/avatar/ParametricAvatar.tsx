"use client";

/**
 * ParametricAvatar — kullanıcının seçtiği trait'lerden SVG ile
 * çizilen Caelinus tanrıçası portresi.
 *
 * Stil: painterly + cosmic. Realistic değil, "iconic abstract goddess"
 * — manifestonun "içindeki gökyüzünü hatırlayan" tonuyla uyumlu.
 *
 * Katmanlar (alttan üste):
 *   1. Aura halkası (zodiac/frekans rengi, blur radial gradient)
 *   2. Boyun + omuz silueti (body shape modifier)
 *   3. Yüz oval (skin shade gradient)
 *   4. Saç arka kütle (long: omuzlara akan; medium: clavicle; short: ear-line)
 *   5. Yüz detayları (kaş, göz, burun, dudak)
 *   6. Saç ön kısım (perçem — texture'a göre düz/dalgalı/kıvırcık)
 *   7. Alın glifi (zodiac glyph karakteri ya da Hz ringi)
 *   8. Göz parıltısı + dudak highlight
 *   9. Yıldız partikülleri (cosmic touch)
 *
 * 600×800 viewBox — portrait orientation. Tüm path'ler bu kanvas'ta.
 *
 * Performans: pure SVG, 60fps, hiçbir cycle dışı animasyon yok
 * (cosmic shimmer CSS'te, parent container yapacak). Hover/focus
 * state'leri yok — bu salt görsel bir component.
 */

import {
  BODY_SHAPES,
  FREQUENCY_GLYPHS,
  HAIR_COLORS,
  ZODIAC_GLYPH_CHARS,
  findEye,
  findHairColor,
  findLip,
  findSkin,
  findFrequency,
  type BuilderTraits,
  type HairLengthId,
  type HairTextureId,
} from "@/lib/avatar/builder";

type Props = {
  traits: BuilderTraits;
  /** Görsel boyut — CSS width/height; viewBox sabit kalır.
   *  default 100% — parent boyutuna sığar. */
  size?: number | string;
  /** Aura'yı render et (preview'de açık, save export'unda kapatılabilir) */
  showAura?: boolean;
  /** Çevre yıldız partikülleri */
  showStars?: boolean;
  /** A11y label */
  ariaLabel?: string;
  /** ID prefix — bir sayfada çoklu instance render edilirse SVG defs
   *  ID çakışmasını engellemek için her instance'a unique prefix. */
  idPrefix?: string;
};

export default function ParametricAvatar({
  traits,
  size = "100%",
  showAura = true,
  showStars = true,
  ariaLabel = "Caelinus parametric avatar",
  idPrefix = "ca",
}: Props) {
  const skin = findSkin(traits.skin);
  const body = BODY_SHAPES.find((b) => b.id === traits.body) ?? BODY_SHAPES[1];
  const hair = findHairColor(traits.hairColor);
  const eye = findEye(traits.eye);
  const lip = findLip(traits.lip);
  const freq = findFrequency(traits.frequency);

  // Body modifier — siluet x-koordinatları için
  const cx = 300; // merkez
  const shoulderHalfW = 130 * body.shoulders;
  const waistHalfW = 70 * body.waist;

  // Saç renk teması — ışıltı için cosmic ise glow ekle
  const hairGlow = hair.cosmic ? hair.color : "transparent";
  const eyeGlow = eye.cosmic ? eye.color : "transparent";

  // Aura rengi — burç varsa ona göre, yoksa frekans, yoksa varsayılan altın
  const auraColor = (() => {
    if (traits.glyph === "frequency") return freq.color;
    if (traits.zodiac) return zodiacAuraColor(traits.zodiac);
    return "#d4af6a";
  })();

  // ID'ler
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
      {/* ── Defs: gradients ──────────────────────────────── */}
      <defs>
        {/* Skin radial — yüze hacim ver */}
        <radialGradient id={id("skin")} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={skin.highlight ?? skin.color} />
          <stop offset="60%" stopColor={skin.color} />
          <stop offset="100%" stopColor={skin.shade ?? skin.color} />
        </radialGradient>

        {/* Hair gradient — uzunluğa göre düşey gradient */}
        <linearGradient id={id("hair")} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={hair.shade ?? hair.color} />
          <stop offset="50%" stopColor={hair.color} />
          <stop offset="100%" stopColor={hair.highlight ?? hair.color} />
        </linearGradient>

        {/* Aura radial — başın etrafında glow */}
        <radialGradient id={id("aura")} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={auraColor} stopOpacity="0.55" />
          <stop offset="40%" stopColor={auraColor} stopOpacity="0.22" />
          <stop offset="80%" stopColor={auraColor} stopOpacity="0.04" />
          <stop offset="100%" stopColor={auraColor} stopOpacity="0" />
        </radialGradient>

        {/* Background nebula — hafif kozmik gece */}
        <radialGradient id={id("bg")} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="rgba(60,40,80,0.55)" />
          <stop offset="55%" stopColor="rgba(20,15,30,0.85)" />
          <stop offset="100%" stopColor="rgba(8,6,15,1)" />
        </radialGradient>

        {/* Bodysuit gradient — mat siyah base */}
        <linearGradient id={id("suit")} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#1c1820" />
          <stop offset="100%" stopColor="#08060c" />
        </linearGradient>

        {/* Lip gradient */}
        <linearGradient id={id("lip")} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={lip.shade ?? lip.color} />
          <stop offset="50%" stopColor={lip.color} />
          <stop offset="100%" stopColor={lip.highlight ?? lip.color} />
        </linearGradient>

        {/* Eye iris radial */}
        <radialGradient id={id("iris")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={eye.highlight ?? eye.color} />
          <stop offset="60%" stopColor={eye.color} />
          <stop offset="100%" stopColor={eye.shade ?? eye.color} />
        </radialGradient>

        {/* Cosmic hair glow filter */}
        <filter id={id("hair-glow")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Cosmic eye glow filter */}
        <filter id={id("eye-glow")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background ──────────────────────────────────── */}
      <rect width="600" height="800" fill={`url(#${id("bg")})`} />

      {/* Yıldız partikülleri */}
      {showStars && <StarField idPrefix={idPrefix} />}

      {/* ── Aura halkası ─────────────────────────────────── */}
      {showAura && (
        <circle
          cx={cx}
          cy={300}
          r={250}
          fill={`url(#${id("aura")})`}
          opacity={0.9}
        />
      )}

      {/* ── Saç arka kütle ──────────────────────────────── */}
      <BackHair
        length={traits.hairLength}
        texture={traits.hairTexture}
        fill={`url(#${id("hair")})`}
        glow={hairGlow !== "transparent" ? id("hair-glow") : undefined}
        shoulderHalfW={shoulderHalfW}
      />

      {/* ── Boyun ───────────────────────────────────────── */}
      <path
        d={`M ${cx - 38} 410 Q ${cx - 45} 460, ${cx - 60} 480 L ${cx + 60} 480 Q ${cx + 45} 460, ${cx + 38} 410 Z`}
        fill={`url(#${id("skin")})`}
      />

      {/* ── Omuz + bodysuit + göğüs ─────────────────────── */}
      <path
        d={shoulderPath(cx, shoulderHalfW, waistHalfW)}
        fill={`url(#${id("suit")})`}
      />
      {/* Bodysuit boyun yakası — V kesim */}
      <path
        d={`M ${cx - 36} 478 L ${cx} 540 L ${cx + 36} 478 Z`}
        fill={`url(#${id("skin")})`}
        opacity={0.92}
      />

      {/* ── Yüz oval ──────────────────────────────────── */}
      <ellipse
        cx={cx}
        cy={290}
        rx={108}
        ry={138}
        fill={`url(#${id("skin")})`}
      />

      {/* Yanak hafif blush — dudak rengiyle uyumlu, çok soft */}
      <ellipse cx={cx - 60} cy={320} rx={28} ry={18} fill={lip.color} opacity={0.12} />
      <ellipse cx={cx + 60} cy={320} rx={28} ry={18} fill={lip.color} opacity={0.12} />

      {/* ── Kaş ─────────────────────────────────────────── */}
      <path
        d={`M ${cx - 65} 268 Q ${cx - 42} 258, ${cx - 22} 270`}
        stroke={hair.shade ?? hair.color}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${cx + 22} 270 Q ${cx + 42} 258, ${cx + 65} 268`}
        stroke={hair.shade ?? hair.color}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Göz ─────────────────────────────────────────── */}
      <g filter={eye.cosmic ? `url(#${id("eye-glow")})` : undefined}>
        {/* Sol göz — beyaz */}
        <ellipse cx={cx - 42} cy={295} rx={18} ry={11} fill="#f4ecdc" opacity={0.94} />
        {/* Sol iris */}
        <circle cx={cx - 42} cy={295} r={9} fill={`url(#${id("iris")})`} />
        {/* Sol pupil */}
        <circle cx={cx - 42} cy={295} r={4} fill="#0a0608" />
        {/* Sol parıltı */}
        <circle cx={cx - 39} cy={292} r={2} fill="#fff" />

        {/* Sağ göz */}
        <ellipse cx={cx + 42} cy={295} rx={18} ry={11} fill="#f4ecdc" opacity={0.94} />
        <circle cx={cx + 42} cy={295} r={9} fill={`url(#${id("iris")})`} />
        <circle cx={cx + 42} cy={295} r={4} fill="#0a0608" />
        <circle cx={cx + 45} cy={292} r={2} fill="#fff" />

        {eyeGlow !== "transparent" && (
          <>
            <circle cx={cx - 42} cy={295} r={11} fill={eyeGlow} opacity={0.18} />
            <circle cx={cx + 42} cy={295} r={11} fill={eyeGlow} opacity={0.18} />
          </>
        )}
      </g>

      {/* Üst göz kapağı çizgisi — eyeliner hissi */}
      <path
        d={`M ${cx - 60} 286 Q ${cx - 42} 282, ${cx - 24} 286`}
        stroke="#0a0608"
        strokeWidth={1.5}
        fill="none"
        opacity={0.7}
      />
      <path
        d={`M ${cx + 24} 286 Q ${cx + 42} 282, ${cx + 60} 286`}
        stroke="#0a0608"
        strokeWidth={1.5}
        fill="none"
        opacity={0.7}
      />

      {/* ── Burun (minimal ipucu) ───────────────────────── */}
      <path
        d={`M ${cx - 4} 320 Q ${cx} 348, ${cx + 8} 354 Q ${cx + 4} 358, ${cx} 358 Q ${cx - 6} 358, ${cx - 6} 354 Z`}
        fill={skin.shade ?? skin.color}
        opacity={0.35}
      />

      {/* ── Dudak ────────────────────────────────────────── */}
      {/* Üst dudak */}
      <path
        d={`M ${cx - 30} 380 Q ${cx - 18} 372, ${cx - 6} 378 Q ${cx} 374, ${cx + 6} 378 Q ${cx + 18} 372, ${cx + 30} 380 Q ${cx + 18} 386, ${cx} 384 Q ${cx - 18} 386, ${cx - 30} 380 Z`}
        fill={`url(#${id("lip")})`}
      />
      {/* Alt dudak */}
      <path
        d={`M ${cx - 30} 382 Q ${cx} 402, ${cx + 30} 382 Q ${cx} 398, ${cx - 30} 382 Z`}
        fill={lip.color}
        opacity={0.92}
      />
      {/* Dudak parıltısı */}
      <ellipse cx={cx} cy={388} rx={6} ry={1.5} fill="#fff" opacity={0.4} />

      {/* ── Saç ön kısım (perçem) ───────────────────────── */}
      <FrontHair
        length={traits.hairLength}
        texture={traits.hairTexture}
        fill={`url(#${id("hair")})`}
        cx={cx}
      />

      {/* ── Alın glifi ──────────────────────────────────── */}
      {traits.glyph === "zodiac" && traits.zodiac && (
        <text
          x={cx}
          y={235}
          textAnchor="middle"
          fontSize={26}
          fill={auraColor}
          opacity={0.92}
          style={{ fontFamily: "serif" }}
        >
          {ZODIAC_GLYPH_CHARS[traits.zodiac]}
        </text>
      )}
      {traits.glyph === "frequency" && (
        <g>
          <circle
            cx={cx}
            cy={232}
            r={14}
            fill="none"
            stroke={freq.color}
            strokeWidth={1.5}
            opacity={0.9}
          />
          <text
            x={cx}
            y={236}
            textAnchor="middle"
            fontSize={9}
            fill={freq.color}
            opacity={0.95}
            style={{ fontFamily: "ui-sans-serif, system-ui", letterSpacing: "0.05em" }}
          >
            {freq.label}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

/** Omuz + bel + kalça siluet path'i. Body shape oranlarına göre. */
function shoulderPath(cx: number, shoulderHalfW: number, waistHalfW: number): string {
  // Üst kısım: omuz başlangıcı (y=480), bel (y=720)
  const sx1 = cx - shoulderHalfW;
  const sx2 = cx + shoulderHalfW;
  const wx1 = cx - waistHalfW;
  const wx2 = cx + waistHalfW;
  return `
    M ${sx1} 480
    Q ${cx - shoulderHalfW * 0.9} 540, ${wx1} 720
    L ${wx2} 720
    Q ${cx + shoulderHalfW * 0.9} 540, ${sx2} 480
    L ${cx + 60} 480
    Q ${cx + 60} 510, ${cx + 50} 520
    Q ${cx + 25} 540, ${cx} 542
    Q ${cx - 25} 540, ${cx - 50} 520
    Q ${cx - 60} 510, ${cx - 60} 480
    Z
  `;
}

/** Burç → aura rengi haritası */
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

/* ── Saç bileşenleri ─────────────────────────────────────── */

function BackHair({
  length,
  texture,
  fill,
  glow,
  shoulderHalfW,
}: {
  length: HairLengthId;
  texture: HairTextureId;
  fill: string;
  glow?: string;
  shoulderHalfW: number;
}) {
  const cx = 300;

  // Uzunluk → bottom Y koordinatı
  const bottomY = length === "long" ? 720 : length === "medium" ? 560 : 410;
  // Genişlik — kıvırcık daha geniş, düz daha dar
  const widthMult = texture === "curly" ? 1.4 : texture === "wavy" ? 1.2 : 1.0;
  const halfW = Math.min(190 * widthMult, shoulderHalfW + 40);

  // Texture'a göre kenar dalga miktarı
  const wave = texture === "curly" ? 22 : texture === "wavy" ? 12 : 4;

  // Sol kenar dalga path
  const leftEdge = (() => {
    const segments: string[] = [];
    const startY = 200;
    const steps = 6;
    const stepH = (bottomY - startY) / steps;
    for (let i = 0; i < steps; i++) {
      const y = startY + stepH * (i + 1);
      const x = cx - halfW + (i % 2 === 0 ? -wave : wave);
      const cpx = cx - halfW + (i % 2 === 0 ? wave : -wave);
      const cpy = y - stepH / 2;
      segments.push(`Q ${cpx} ${cpy}, ${x} ${y}`);
    }
    return segments.join(" ");
  })();

  const rightEdge = (() => {
    const segments: string[] = [];
    const startY = bottomY;
    const steps = 6;
    const endY = 200;
    const stepH = (startY - endY) / steps;
    for (let i = 0; i < steps; i++) {
      const y = startY - stepH * (i + 1);
      const x = cx + halfW + (i % 2 === 0 ? wave : -wave);
      const cpx = cx + halfW + (i % 2 === 0 ? -wave : wave);
      const cpy = y + stepH / 2;
      segments.push(`Q ${cpx} ${cpy}, ${x} ${y}`);
    }
    return segments.join(" ");
  })();

  const d = `
    M ${cx - halfW} 200
    ${leftEdge}
    L ${cx + halfW} ${bottomY}
    ${rightEdge}
    Q ${cx} 150, ${cx - halfW} 200
    Z
  `;

  return <path d={d} fill={fill} filter={glow ? `url(#${glow})` : undefined} />;
}

function FrontHair({
  length,
  texture,
  fill,
  cx,
}: {
  length: HairLengthId;
  texture: HairTextureId;
  fill: string;
  cx: number;
}) {
  // Perçem yapısı — texture'a göre farklı path
  // Tüm uzunluklarda alın üstüne hafif düşen perçem var
  void length; // her uzunlukta perçem var

  if (texture === "straight") {
    return (
      <>
        <path
          d={`M ${cx - 95} 215 Q ${cx - 50} 180, ${cx - 5} 200 L ${cx - 20} 250 Q ${cx - 70} 240, ${cx - 95} 215 Z`}
          fill={fill}
        />
        <path
          d={`M ${cx + 5} 200 Q ${cx + 50} 180, ${cx + 95} 215 Q ${cx + 70} 240, ${cx + 20} 250 Z`}
          fill={fill}
        />
      </>
    );
  }

  if (texture === "wavy") {
    return (
      <>
        <path
          d={`
            M ${cx - 100} 210
            Q ${cx - 70} 175, ${cx - 30} 195
            Q ${cx - 15} 200, ${cx} 198
            Q ${cx + 15} 200, ${cx + 30} 195
            Q ${cx + 70} 175, ${cx + 100} 210
            Q ${cx + 80} 235, ${cx + 40} 250
            Q ${cx} 246, ${cx - 40} 250
            Q ${cx - 80} 235, ${cx - 100} 210
            Z
          `}
          fill={fill}
        />
      </>
    );
  }

  // Curly — küçük kıvırcık tepeler
  const curlBumps: string[] = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const x = cx - 105 + t * 210;
    const y = 200 + Math.sin(t * Math.PI) * -22;
    curlBumps.push(`<circle cx="${x}" cy="${y}" r="20" />`);
  }

  return (
    <g fill={fill}>
      {/* Bumps — küme küçük daireler kıvırcık hissi verir */}
      {Array.from({ length: 9 }).map((_, i) => {
        const t = i / 8;
        const x = cx - 105 + t * 210;
        const y = 200 + Math.sin(t * Math.PI) * -25;
        return <circle key={i} cx={x} cy={y} r={22} />;
      })}
      {/* Alt blanket */}
      <path
        d={`M ${cx - 105} 215 Q ${cx} 245, ${cx + 105} 215 Q ${cx + 80} 250, ${cx} 250 Q ${cx - 80} 250, ${cx - 105} 215 Z`}
        fill={fill}
      />
    </g>
  );
}

/* ── Yıldız tarlası ──────────────────────────────────────── */

function StarField({ idPrefix }: { idPrefix: string }) {
  // Deterministik nokta dağılımı — kayıp/kazanç olmadan SSR uyumlu.
  const stars = Array.from({ length: 28 }).map((_, i) => {
    const a = (i * 137.5) % 360; // golden angle dağılımı
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

/* ── Re-exports for callers (so they don't need to import from
 *  builder.ts as well as ParametricAvatar.tsx). ──────────── */
export { FREQUENCY_GLYPHS, HAIR_COLORS };

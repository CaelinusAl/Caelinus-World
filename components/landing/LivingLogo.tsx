"use client";

/**
 * LivingLogo — Caelinus göksel mührü. Header logosu DEĞİL; portal enerjisinden
 * AÇILAN yaşayan bir mühür. (PNG yok — ayrı SVG parçalar + HTML wordmark.)
 *
 * Parçalar: sol kanat · sağ kanat · merkez alev/yıldız · CAELINUS wordmark ·
 * FREKANSIN SANATI tagline.
 *
 * Doğuş sırası (ilk yükleme):
 *   1) enerji aurası tutuşur,
 *   2) merkez yıldız belirir (yavaş nabız, altın ışık yayıp söner),
 *   3) kanatlar altın çizgilerle çizilir (stroke-draw),
 *   4) CAELINUS harf harf soldan sağa zarifçe ortaya çıkar (canlı metalik altın),
 *   5) en son FREKANSIN SANATI belirir.
 *
 * Kalıcı yaşam: kanatlar 12s'de bir çok hafif açılır/kapanır (çırpmaz),
 * wordmark'ta gold·rose-gold·moon-silver yansıması dolaşır, işaretçiyle 1–2°
 * parallax, aydan yukarı süzülen enerji beslemesi. reduced-motion'da dingin.
 */

import { useEffect, useMemo, useRef } from "react";

const WORD = "CAELINUS";

// Sağ kanat tüyleri (merkez ~x150). Sol kanat aynalanmış grupla üretilir.
// pathLength=1 → gerçek uzunluktan bağımsız güvenli stroke-draw.
const FEATHERS: string[] = [
  "M150 57 C 172 44, 200 36, 244 24", // en üst — uzun, dik sweep
  "M150 58 C 175 46, 208 41, 260 31",
  "M150 59 C 178 49, 216 46, 274 39",
  "M150 60 C 180 53, 222 51, 284 47", // neredeyse yatay, en uzun
  "M150 61 C 176 57, 206 57, 248 57", // alt-orta
  "M150 62 C 172 61, 198 64, 232 67",
  "M150 63 C 166 65, 184 70, 206 77", // en alt — kısa, hafif düşer
];

function Feathers() {
  return (
    <>
      {FEATHERS.map((d, i) => (
        <path
          key={i}
          className="ll-feather"
          d={d}
          pathLength={1}
          style={{ animationDelay: `${1.3 + i * 0.12}s` }}
        />
      ))}
    </>
  );
}

// Merkez 4-uçlu sparkle (alev/yıldız) — yavaş nabız.
const STAR_PATH =
  "M150 11 C 151 25, 153 27, 167 29 C 153 31, 151 33, 150 48 C 149 33, 147 31, 133 29 C 147 27, 149 25, 150 11 Z";

type Particle = { x0: number; x1: number; size: number; delay: number; dur: number };

export default function LivingLogo() {
  const boxRef = useRef<HTMLSpanElement>(null);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 22 }).map((_, i) => {
        const spread = ((i * 53) % 140) - 70;
        return {
          x0: spread,
          x1: spread * 0.12,
          size: 1.5 + (i % 3) * 0.8,
          delay: 0.8 + ((i * 7) % 16) * 0.07,
          dur: 1.8 + (i % 5) * 0.22,
        };
      }),
    [],
  );

  // İşaretçi parallax — mühür 1–2° tepki verir (yalnızca masaüstü + hareket).
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fine = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let rotX = 0;
    let rotY = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;

    const tick = () => {
      rotX += (targetX - rotX) * 0.08;
      rotY += (targetY - rotY) * 0.08;
      box.style.setProperty("--ll-rx", `${rotX.toFixed(3)}deg`);
      box.style.setProperty("--ll-ry", `${rotY.toFixed(3)}deg`);
      if (Math.abs(targetX - rotX) > 0.01 || Math.abs(targetY - rotY) > 0.01) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = -ny * 1.6;
      targetY = nx * 1.8;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span className="living-logo">
      {/* Enerji aurası — mühür portal enerjisinden oluşuyormuş hissi. */}
      <span className="ll-aura" aria-hidden="true" />

      {/* Aydan yükselen altın partiküller — mührü besler. */}
      <span className="ll-particles" aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            className="ll-particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              ["--x0" as string]: `${p.x0}px`,
              ["--x1" as string]: `${p.x1}px`,
            }}
          />
        ))}
      </span>

      <span className="ll-emblem-box" ref={boxRef}>
        <svg className="ll-mark" viewBox="0 0 300 130" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="llWingGrad" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#f4d9ff" />
              <stop offset="34%" stopColor="#ffd98f" />
              <stop offset="68%" stopColor="#e8d7a3" />
              <stop offset="100%" stopColor="#cfd6df" />
            </linearGradient>
            <radialGradient id="llStarGrad">
              <stop offset="0%" stopColor="#fff6d6" />
              <stop offset="55%" stopColor="#ffd98f" />
              <stop offset="100%" stopColor="rgba(255,217,143,0)" />
            </radialGradient>
          </defs>

          <g
            className="ll-wings"
            stroke="url(#llWingGrad)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Sağ kanat. */}
            <g className="ll-wing-pos">
              <g className="ll-wing ll-wing-right">
                <Feathers />
              </g>
            </g>
            {/* Sol kanat — aynalanmış (nefes iç grupta kalır). */}
            <g transform="translate(300,0) scale(-1,1)">
              <g className="ll-wing ll-wing-left">
                <Feathers />
              </g>
            </g>
          </g>

          {/* Merkez alev / yıldız. */}
          <g className="ll-flame">
            <path
              className="ll-spire"
              d="M150 42 L150 96"
              stroke="url(#llWingGrad)"
              strokeWidth={1.2}
              strokeLinecap="round"
              pathLength={1}
            />
            <circle className="ll-star-glow" cx={150} cy={29} r={18} fill="url(#llStarGrad)" />
            <path className="ll-star" d={STAR_PATH} fill="#fff6d6" />
          </g>
        </svg>

        {/* Wordmark — harf harf, canlı metalik altın. */}
        <span className="ll-word" role="img" aria-label="Caelinus">
          {WORD.split("").map((ch, i) => (
            <span
              key={i}
              className="ll-letter"
              aria-hidden="true"
              style={{ animationDelay: `${2.9 + i * 0.085}s` }}
            >
              {ch}
            </span>
          ))}
        </span>

        <span className="ll-kicker">Frekansın Sanatı</span>
      </span>

      {/* Aydan yukarı süzülen enerji beslemesi — ay ile mühür bağlı görünür. */}
      <span className="ll-feed" aria-hidden="true" />
    </span>
  );
}

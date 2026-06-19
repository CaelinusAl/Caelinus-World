/**
 * Katman 2 — Frekans Damarları.
 * Yerdeki ışık yolları statik çizgi değil; ağacın dibine doğru yavaş AKAN enerji.
 * Gaia'nın sinir sistemi. SVG: her damar tabandan (alt) ağaca (merkez) doğru
 * kayan parlak bir segment taşır (stroke-dashoffset animasyonu).
 */
const VEINS: string[] = [
  "M 120 560 Q 330 470 500 255",
  "M 280 560 Q 420 450 500 255",
  "M 430 560 Q 470 430 500 255",
  "M 560 560 Q 540 430 500 255",
  "M 710 560 Q 590 450 500 255",
  "M 880 560 Q 680 470 500 255",
  "M 40 470 Q 280 380 500 258",
  "M 960 470 Q 720 380 500 258",
];

export default function LivingVeins() {
  return (
    <svg className="gx-veinsvg" viewBox="0 0 1000 562" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="gxVein" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#7fe6d2" stopOpacity="0.05" />
          <stop offset="55%" stopColor="#ffd083" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0.95" />
        </linearGradient>
        <filter id="gxGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#gxGlow)">
        {VEINS.map((d, i) => (
          <g key={i}>
            {/* sabit zayıf damar izi */}
            <path d={d} fill="none" stroke="url(#gxVein)" strokeWidth="1.4" strokeOpacity="0.22" strokeLinecap="round" />
            {/* akan enerji segmenti */}
            <path
              className="gx-vein-flow"
              d={d}
              fill="none"
              stroke="url(#gxVein)"
              strokeWidth="2.6"
              strokeLinecap="round"
              style={{ animationDelay: `${(i * 0.9).toFixed(2)}s`, animationDuration: `${(5.5 + (i % 3) * 1.6).toFixed(1)}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * Yakın Plan Hayat (GAIA LOCK V2).
 * Kullanıcı yaklaştıkça (progress) beliren near-field yaşam — keşfedilsin, dikkat çekmesin.
 * Işık mantarları · taş semboller · su birikintisi · kelebek kümesi · yükselen polen ·
 * ışığa tepki veren ön-plan ayçiçek bloom'ları.
 * Kapsayıcı .gx-near'in opacity'si page.tsx/paint() tarafından progress'e bağlanır.
 */

const MUSHROOMS = [
  { left: "12%", top: "78%", s: 1.1, hue: "teal", d: "7s" },
  { left: "23%", top: "88%", s: 0.8, hue: "amber", d: "9s" },
  { left: "67%", top: "82%", s: 1.0, hue: "teal", d: "8s" },
  { left: "81%", top: "90%", s: 1.3, hue: "amber", d: "6.5s" },
  { left: "45%", top: "92%", s: 0.7, hue: "teal", d: "10s" },
];

const GLYPHS = [
  { left: "30%", top: "84%", r: -12 },
  { left: "58%", top: "90%", r: 8 },
  { left: "74%", top: "76%", r: -4 },
];

const BLOOMS = [
  { left: "8%", top: "82%", s: 1.4, d: "5.5s" },
  { left: "52%", top: "94%", s: 1.1, d: "7s" },
  { left: "88%", top: "86%", s: 1.6, d: "6s" },
];

export default function NearLife() {
  const pollen = Array.from({ length: 10 }, (_, i) => ({
    left: `${6 + ((i * 17 + (i % 3) * 9) % 88)}%`,
    dur: `${7 + (i % 5) * 2.2}s`,
    delay: `${(i % 6) * 1.6}s`,
    s: 0.6 + (i % 4) * 0.3,
  }));

  return (
    <div className="gx-near" aria-hidden>
      {/* Su birikintisi — yansıma parıltısı */}
      <div className="gx-puddle" style={{ left: "36%", top: "86%" }} />

      {/* Işık mantarları */}
      {MUSHROOMS.map((m, i) => (
        <span
          key={`mush${i}`}
          className={`gx-mushroom gx-mush-${m.hue}`}
          style={{ left: m.left, top: m.top, transform: `scale(${m.s})`, animationDuration: m.d }}
        />
      ))}

      {/* Taş semboller — keşfedilecek faint glyph'ler */}
      {GLYPHS.map((g, i) => (
        <svg key={`gly${i}`} className="gx-glyph" style={{ left: g.left, top: g.top, transform: `rotate(${g.r}deg)` }} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M20 6 L20 34 M9 14 L31 26 M31 14 L9 26" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      ))}

      {/* Kelebek kümesi */}
      <div className="gx-bfly-cluster" style={{ left: "63%", top: "70%" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={`bf${i}`} className="gx-bfly" style={{ animationDelay: `${i * 0.4}s`, left: `${i * 10}px`, top: `${(i % 2) * 8}px` }} />
        ))}
      </div>

      {/* Işığa tepki veren ön-plan ayçiçek bloom'ları */}
      {BLOOMS.map((b, i) => (
        <span key={`bl${i}`} className="gx-bloom" style={{ left: b.left, top: b.top, transform: `scale(${b.s})`, animationDuration: b.d }} />
      ))}

      {/* Yükselen polen */}
      {pollen.map((p, i) => (
        <span key={`po${i}`} className="gx-pollen" style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay, transform: `scale(${p.s})` }} />
      ))}
    </div>
  );
}

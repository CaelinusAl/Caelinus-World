"use client";

/**
 * MirrorGate — Caelinus aynasının kendisi.
 *
 * Kutulu e-ticaret kartı değil; bir portal odası. Ortada oval ayna
 * kapı (mor sis + altın sacred geometry + su yansıması), hover'da
 * canlanır. Altında su üstünde duran üç ritüel ışık taşı.
 *
 * Görsel katman tamamen CSS (globals.css `.mirror-*`). Tıklanınca
 * 3D avatar konfigüratörüne ("aynanın içine") geçer.
 */

import Link from "next/link";

const RITUALS: { n: string; title: string; desc: string }[] = [
  { n: "01", title: "Yüzünü Yükle", desc: "Selfie'ni aynaya bırak." },
  { n: "02", title: "Frekansını Seç", desc: "Burcunu ve enerji tonunu seç." },
  { n: "03", title: "Avatarını Doğur", desc: "Bedenini aynadan çıkar." },
];

export default function MirrorGate() {
  return (
    <section className="mirror-gate" aria-label="Caelinus aynası">
      <div className="mirror-portal-wrap">
        <Link
          href="/universe/shop/avatar"
          className="mirror-portal"
          aria-label="Aynaya gir — avatar bedenini oluştur"
        >
          <span className="mirror-portal-geo" aria-hidden="true" />
          <span className="mirror-portal-ring" aria-hidden="true" />
          <span className="mirror-portal-mist" aria-hidden="true" />
          <span className="mirror-portal-surface" aria-hidden="true" />
          <span className="mirror-portal-sheen" aria-hidden="true" />
          <span className="mirror-portal-label">
            <span className="mirror-portal-label-glyph" aria-hidden="true">◍</span>
            Aynaya Gir
          </span>
        </Link>
        <div className="mirror-portal-reflection" aria-hidden="true" />
      </div>

      <ol className="ritual-stones">
        {RITUALS.map((r) => (
          <li key={r.n} className="ritual-stone">
            <span className="ritual-stone-core">
              <span className="ritual-stone-num">{r.n}</span>
              <span className="ritual-stone-title">{r.title}</span>
              <span className="ritual-stone-desc">{r.desc}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

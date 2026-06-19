"use client";

/**
 * SANRI · Rüya — rüya yorumu (sembol + duygu + anlam).
 */

import Link from "next/link";
import SanriTextTool from "../_components/SanriTextTool";
import { interpretDream } from "@/lib/sanri/client";
import "../sanri.css";

export default function SanriRuyaPage() {
  return (
    <main className="sanri-page">
      <div className="sanri-bg" aria-hidden="true">
        <div className="sanri-moon" />
        <div className="sanri-mist" />
      </div>

      <div className="sanri-shell">
        <header className="sanri-hero">
          <p className="sanri-kicker">SANRI · RÜYA</p>
          <h1 className="sanri-title">Rüya</h1>
          <p className="sanri-lede">
            Gördüğün rüyayı anlat; sembolünü, duygusunu ve sana fısıldadığı anlamı
            birlikte okuyalım.
          </p>
        </header>

        <section className="sanri-section">
          <SanriTextTool
            placeholder="Rüyanı olabildiğince ayrıntılı anlat…"
            cta="Rüyayı Oku"
            run={async (text) => {
              const r = await interpretDream({ text });
              if (r.interpretation) {
                const sym = r.symbols?.length ? `\n\nSemboller: ${r.symbols.join(", ")}` : "";
                const emo = r.emotion ? `\nDuygu: ${r.emotion}` : "";
                return `${r.interpretation}${sym}${emo}`;
              }
              return JSON.stringify(r, null, 2);
            }}
          />
        </section>

        <div className="sanri-foot">
          <Link href="/universe/sanri" className="sanri-back">← Tapınağa Dön</Link>
          <span className="sanri-whisper">Rüya, gündüzün söyleyemediğidir.</span>
        </div>
      </div>
    </main>
  );
}

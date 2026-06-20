"use client";

/**
 * /universe/gaia/dunya — Ağacın frekansına sonsuz dalış.
 *
 * Ortadaki ağaca dokun → içine dal. Fareyi her oynattığında daha derine
 * inersin: katman katman frekanslar (Kabuk → Yaprak → Öz → Hücre → Işık →
 * Frekans). Üstteki okuma o anki katmanın adını ve Solfeggio Hz'ini gösterir.
 */

import dynamic from "next/dynamic";
import { useState } from "react";
import type { DiveLayer } from "@/components/gaia/FrequencyDiveCanvas";

const FrequencyDiveCanvas = dynamic(
  () => import("@/components/gaia/FrequencyDiveCanvas"),
  {
    ssr: false,
    loading: () => <div className="sr-loading">Ağaç uyanıyor…</div>,
  },
);

export default function GaiaDunyaPage() {
  const [layer, setLayer] = useState<DiveLayer | null>(null);

  return (
    <main className="sr-page">
      <FrequencyDiveCanvas onLayer={setLayer} />

      <div className="sr-overlay">
        <div className="sr-top">
          <div className="sr-kicker">✦ FREKANS DALIŞI ✦</div>
          <p className="sr-hint">
            {layer
              ? "Fareni oynat → daha derine in"
              : "Ağaca dokun → frekansına dal"}
          </p>
        </div>

        {layer ? (
          <div className="dive-readout" style={{ borderColor: layer.color }}>
            <span className="dive-hz" style={{ color: layer.color }}>
              {layer.hz} Hz
            </span>
            <span className="dive-name">{layer.name}</span>
            <span className="dive-depth">katman {layer.depthIndex}</span>
          </div>
        ) : null}
      </div>
    </main>
  );
}

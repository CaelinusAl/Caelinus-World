"use client";

/**
 * ZodiacStyleAdvisor — burç seç, Moda AI o burcun frekans koleksiyonunu
 * yorumlasın. Veri `lib/data/zodiac-style-map.ts` (frequency.ts + products.ts
 * adaptörü) üzerinden gelir; AI uydurmaz.
 */

import { useState } from "react";
import { allZodiacStyles } from "@/lib/data/zodiac-style-map";

type Props = {
  onAsk: (text: string) => void;
};

const STYLES = allZodiacStyles("tr");

export default function ZodiacStyleAdvisor({ onAsk }: Props) {
  const [active, setActive] = useState(STYLES[0]?.id ?? "aries");
  const current = STYLES.find((s) => s.id === active) ?? STYLES[0];

  function ask() {
    if (!current) return;
    onAsk(
      `${current.label} burcuyum (${current.element} elementi, ${current.frequency}Hz — ` +
        `${current.freqMeaning}, arketip: ${current.archetype}). ` +
        `Bana frekansıma uygun bir Caelinus kombini öner; "${current.productName}" ` +
        `parçasını nasıl konumlandırırsın ve yanına ne yakışır?`,
    );
  }

  return (
    <div className="moda-card moda-zodiac">
      <div className="moda-card-head">
        <span className="moda-card-glyph" aria-hidden="true">
          ✦
        </span>
        <div>
          <p className="moda-card-kicker">BURÇ KOLEKSİYONU</p>
          <h3 className="moda-card-title">Frekansını seç</h3>
        </div>
      </div>

      <div className="moda-zodiac-wheel" role="listbox" aria-label="Burç seç">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={s.id === active}
            className={`moda-zodiac-glyph ${s.id === active ? "is-active" : ""}`}
            onClick={() => setActive(s.id)}
            title={s.label}
            style={{ "--z-color": s.elementColor } as React.CSSProperties}
          >
            {s.symbol}
          </button>
        ))}
      </div>

      {current && (
        <div className="moda-zodiac-detail">
          <p className="moda-zodiac-name">
            {current.symbol} {current.label} · {current.element}
          </p>
          <p className="moda-zodiac-freq">
            {current.frequency}Hz — {current.freqMeaning}
          </p>
          <p className="moda-zodiac-arch">
            {current.archetype} → <strong>{current.productName}</strong>
          </p>
          <button type="button" className="moda-card-cta" onClick={ask}>
            Bu frekansı giydir
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * [5] STİL YOĞUNLUĞU — Experience Bible §2[5].
 *
 * Tek karar: Hafif ↔ Dengeli ↔ Tam Tanrıça. Kimlik koruması her
 * durumda sabit; bu yalnızca dönüşümün gücünü belirler.
 */

import { useState } from "react";

import {
  BIRTH_INTENSITY_LABELS,
  type BirthIntensity,
} from "@/lib/avatar/birth-types";

const ORDER: BirthIntensity[] = ["light", "balanced", "full"];

type Props = {
  initial: BirthIntensity;
  onBack: () => void;
  onNext: (intensity: BirthIntensity) => void;
};

export default function IntensityStep({ initial, onBack, onNext }: Props) {
  const [value, setValue] = useState<BirthIntensity>(initial);
  const active = BIRTH_INTENSITY_LABELS[value];

  return (
    <div className="av-step av-step-intensity">
      <p className="av-kicker">EŞİK V · YOĞUNLUK</p>
      <h2 className="av-step-title">Ne kadar dönüşüm?</h2>
      <p className="av-step-lede">Kimliğin korunur. Bu sadece frekansın gücü.</p>

      <div className="av-intensity-row" role="radiogroup" aria-label="Yoğunluk seç">
        {ORDER.map((id) => {
          const isOn = id === value;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isOn}
              className={`av-intensity-chip${isOn ? " is-on" : ""}`}
              onClick={() => setValue(id)}
            >
              {BIRTH_INTENSITY_LABELS[id].label}
            </button>
          );
        })}
      </div>

      <p className="av-intensity-hint">{active.hint}</p>

      <div className="av-actions">
        <button type="button" className="av-btn av-btn-ghost" onClick={onBack}>
          Geri
        </button>
        <button
          type="button"
          className="av-btn av-btn-primary"
          onClick={() => onNext(value)}
        >
          Doğuşa başla
        </button>
      </div>
    </div>
  );
}

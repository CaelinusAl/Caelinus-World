"use client";

/**
 * [4] DISTRICT SEÇİMİ — Experience Bible §2[4], §3.
 *
 * "Tanrıçan nerede doğsun?" — 8 district. Varsayılan Source. Seçilen
 * tanrıçanın doğal yuvası (goddess.districts.home) ince bir işaretle
 * öne çıkar: "burada en güçlü".
 */

import { useState } from "react";

import {
  AVATAR_DISTRICT_LIST,
  type AvatarDistrictId,
} from "@/data/avatar-districts";
import { getGoddess, type GoddessId } from "@/data/goddess-archetypes";

type Props = {
  initial: AvatarDistrictId;
  goddess: GoddessId | null;
  onBack: () => void;
  onNext: (district: AvatarDistrictId) => void;
};

export default function DistrictStep({ initial, goddess, onBack, onNext }: Props) {
  const [selected, setSelected] = useState<AvatarDistrictId>(initial);
  const home = goddess ? getGoddess(goddess).districts.home : null;
  const goddessName = goddess ? getGoddess(goddess).name : "Tanrıçan";

  return (
    <div className="av-step av-step-district">
      <p className="av-kicker">EŞİK IV · DOĞUŞ YERİ</p>
      <h2 className="av-step-title">{goddessName} nerede doğsun?</h2>
      <p className="av-step-lede">
        Her bölge aynı kimliği farklı bir frekansla sarar. Source saf doğuştur.
      </p>

      <div className="av-district-grid" role="radiogroup" aria-label="District seç">
        {AVATAR_DISTRICT_LIST.map((d) => {
          const isOn = d.id === selected;
          const isHome = d.id === home;
          return (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={isOn}
              className={`av-district-card${isOn ? " is-on" : ""}`}
              onClick={() => setSelected(d.id)}
              style={
                {
                  "--d-accent": d.accent,
                  "--d-glow": d.glow,
                } as React.CSSProperties
              }
            >
              <span className="av-district-word">{d.word}</span>
              <span className="av-district-name">{d.name}</span>
              {isHome && <span className="av-district-home">burada en güçlü</span>}
            </button>
          );
        })}
      </div>

      <div className="av-actions">
        <button type="button" className="av-btn av-btn-ghost" onClick={onBack}>
          Geri
        </button>
        <button
          type="button"
          className="av-btn av-btn-primary"
          onClick={() => onNext(selected)}
        >
          Devam et
        </button>
      </div>
    </div>
  );
}

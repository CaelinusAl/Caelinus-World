"use client";

/**
 * [3] TANRIÇA SEÇİMİ — Experience Bible §2[3], §3.
 *
 * 12 arketip kartı; tarot destesi gibi sezgiyle seçilir. Kart üstünde
 * isim + tek kelime frekans; seçilince palet şeridi + açılış cümlesi açılır.
 */

import { useState } from "react";

import {
  GODDESS_LIST,
  type GoddessId,
} from "@/data/goddess-archetypes";

type Props = {
  initial: GoddessId | null;
  onBack: () => void;
  onNext: (goddess: GoddessId) => void;
};

export default function GoddessStep({ initial, onBack, onNext }: Props) {
  const [selected, setSelected] = useState<GoddessId | null>(initial);
  const active = selected ? GODDESS_LIST.find((g) => g.id === selected) : null;

  return (
    <div className="av-step av-step-goddess">
      <p className="av-kicker">EŞİK III · TANRIÇA SEÇİMİ</p>
      <h2 className="av-step-title">Hangi frekans sensin?</h2>
      <p className="av-step-lede">Düşünme. Hangisi seni çağırıyorsa ona dokun.</p>

      <div className="av-goddess-grid" role="radiogroup" aria-label="Tanrıça seç">
        {GODDESS_LIST.map((g) => {
          const isOn = g.id === selected;
          return (
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={isOn}
              className={`av-goddess-card${isOn ? " is-on" : ""}`}
              onClick={() => setSelected(g.id)}
              style={
                {
                  "--g-primary": g.palette.primary,
                  "--g-secondary": g.palette.secondary,
                  "--g-accent": g.palette.accent,
                } as React.CSSProperties
              }
            >
              <span className="av-goddess-glyph" aria-hidden="true">
                {g.symbolGlyph}
              </span>
              <span className="av-goddess-name">{g.name}</span>
              <span className="av-goddess-freq">{g.frequency}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="av-goddess-detail"
          style={
            {
              "--g-accent": active.palette.accent,
            } as React.CSSProperties
          }
        >
          <div className="av-goddess-palette" aria-hidden="true">
            <span style={{ background: active.palette.primary }} />
            <span style={{ background: active.palette.secondary }} />
            <span style={{ background: active.palette.accent }} />
          </div>
          <p className="av-goddess-title">{active.title}</p>
          <p className="av-goddess-opening">“{active.opening}”</p>
        </div>
      )}

      <div className="av-actions">
        <button type="button" className="av-btn av-btn-ghost" onClick={onBack}>
          Geri
        </button>
        <button
          type="button"
          className="av-btn av-btn-primary"
          disabled={!selected}
          onClick={() => selected && onNext(selected)}
        >
          {active ? `${active.name} olarak devam` : "Devam et"}
        </button>
      </div>
    </div>
  );
}

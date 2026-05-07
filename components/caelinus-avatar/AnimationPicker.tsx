"use client";

/**
 * AnimationPicker — Avatar Core preset animasyon seçici.
 * Şu an Idle / Catwalk; ileride Mixamo'dan gelen ek animasyonlar
 * `ANIMATION_PRESETS` listesine eklendiğinde burada otomatik çıkar.
 */

import {
  ANIMATION_PRESETS,
  type AnimationPreset,
} from "@/lib/caelinus-avatar-core";

type Props = {
  selectedId: string;
  onSelect: (preset: AnimationPreset) => void;
};

export default function AnimationPicker({ selectedId, onSelect }: Props) {
  return (
    <div className="cav-picker">
      <div className="cav-picker-header">
        <h4 className="cav-picker-title">Animasyon</h4>
        <span className="cav-picker-sub">Hareket — duruşundan ritmine</span>
      </div>
      <div className="cav-picker-chips">
        {ANIMATION_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`cav-chip ${selectedId === p.id ? "is-active" : ""}`}
            onClick={() => onSelect(p)}
            aria-pressed={selectedId === p.id}
          >
            <span className="cav-chip-label">{p.label}</span>
            <span className="cav-chip-tagline">{p.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

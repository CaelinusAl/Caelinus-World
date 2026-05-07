"use client";

/**
 * OutfitPicker — Avatar Core preset outfit seçici.
 *
 * Cloth simulation YOK; her outfit sadece accent rengi + frequency
 * ile sahnenin tonunu boyar (try-on illusion stratejisi). Gerçek
 * outfit GLB'leri eklendiğinde aynı preset listesi `glbUrl`'lerle
 * zenginleşir.
 */

import { OUTFIT_PRESETS, type OutfitPreset } from "@/lib/caelinus-avatar-core";

type Props = {
  selectedId: string;
  onSelect: (preset: OutfitPreset) => void;
};

export default function OutfitPicker({ selectedId, onSelect }: Props) {
  return (
    <div className="cav-picker">
      <div className="cav-picker-header">
        <h4 className="cav-picker-title">Outfit</h4>
        <span className="cav-picker-sub">Sahnenin tonunu giydir</span>
      </div>
      <div className="cav-picker-strip">
        {OUTFIT_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`cav-picker-card ${selectedId === p.id ? "is-active" : ""}`}
            style={{ ["--accent" as string]: p.accent } as React.CSSProperties}
            onClick={() => onSelect(p)}
            aria-pressed={selectedId === p.id}
          >
            <span className="cav-picker-card-swatch" />
            <span className="cav-picker-card-label">{p.label}</span>
            <span className="cav-picker-card-tagline">{p.tagline}</span>
            {p.frequency && (
              <span className="cav-picker-card-freq">{p.frequency}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

/**
 * AvatarSliders — Caelinus body builder UI.
 *
 * Faz 4 (Mayıs 2026) tonu: Caelinus manifestosu "her beden bir
 * tapınak" diyor — bu yüzden eskiden burada olan "Petite / Balanced
 * / Curvy / Runway" tipoloji preset'leri kaldırıldı. Tipoloji moda
 * endüstrisinin kategorize etme alışkanlığını yansıtıyor; bizim
 * çağrımız tam tersi: tipolojiyi atla, kendi ölçülerini gir.
 *
 * Kontroller:
 *   • Boy (cm)            — 150-200
 *   • Kilo (kg)           — 40-110
 *   • Kalça Oranı         — 0.8-1.25 (1.0 = referans)
 *   • Göğüs (S/M/L/XL)    — kıyafetin doğru oturması için fonksiyonel
 *   • Ten Rengi           — 8 ton (Porcelain → Espresso)
 */

import { memo } from "react";
import type { AvatarConfig, BustSize } from "@/types/avatar";
import { SKIN_TONES } from "@/types/avatar";

type Props = {
  config: AvatarConfig;
  onChange: (cfg: AvatarConfig) => void;
  onReset?: () => void;
};

/* ── Reusable Slider ── */

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="avcfg-slider">
      <div className="avcfg-slider-header">
        <span className="avcfg-slider-label">{label}</span>
        <span className="avcfg-slider-value">
          {step < 1 ? value.toFixed(2) : value}
          {unit}
        </span>
      </div>
      <div className="avcfg-range-track">
        <div className="avcfg-range-fill" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="avcfg-range"
        />
      </div>
    </div>
  );
}

const BUST_SIZES: BustSize[] = ["s", "m", "l", "xl"];

function AvatarSlidersInner({ config, onChange, onReset }: Props) {
  const set = (partial: Partial<AvatarConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <div className="avcfg-panel">
      <div className="avcfg-panel-header">
        <h2 className="avcfg-title">Bedenini Ölç</h2>
        {onReset && (
          <button className="avcfg-reset-btn" onClick={onReset}>
            Sıfırla
          </button>
        )}
      </div>

      <p className="avcfg-panel-lede">
        Tipoloji yok — bedenin kendi ölçüsünde, kendi frekansında.
      </p>

      {/* Sliders — Boy / Kilo / Oran */}
      <div className="avcfg-section">
        <Slider
          label="Boy"
          value={config.height}
          min={150}
          max={200}
          step={1}
          unit=" cm"
          onChange={(v) => set({ height: v })}
        />
        <Slider
          label="Kilo"
          value={config.weight}
          min={40}
          max={110}
          step={1}
          unit=" kg"
          onChange={(v) => set({ weight: v })}
        />
        <Slider
          label="Kalça Oranı"
          value={config.hipRatio}
          min={0.8}
          max={1.25}
          step={0.01}
          unit=""
          onChange={(v) => set({ hipRatio: v })}
        />
      </div>

      {/* Bust Size — kıyafetin doğru oturması için fonksiyonel */}
      <div className="avcfg-section">
        <div className="avcfg-section-label">Göğüs</div>
        <div className="avcfg-bust-row">
          {BUST_SIZES.map((sz) => (
            <button
              key={sz}
              className={`avcfg-bust-btn ${config.bustSize === sz ? "active" : ""}`}
              onClick={() => set({ bustSize: sz })}
            >
              {sz.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Tone — visual swatches */}
      <div className="avcfg-section">
        <div className="avcfg-section-label">Ten Rengi</div>
        <div className="avcfg-skin-row">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.hex}
              className={`avcfg-skin-swatch ${config.skinTone === tone.hex ? "active" : ""}`}
              onClick={() => set({ skinTone: tone.hex })}
              title={tone.label}
            >
              <span
                className="avcfg-skin-swatch-inner"
                style={{ backgroundColor: tone.hex }}
              />
              <span className="avcfg-skin-swatch-label">{tone.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(AvatarSlidersInner);

"use client";

import { memo } from "react";
import type { AvatarConfig, BodyType, BustSize } from "@/types/avatar";
import { BODY_TYPE_PRESETS, SKIN_TONES, DEFAULT_AVATAR } from "@/types/avatar";

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

const BODY_TYPES = Object.keys(BODY_TYPE_PRESETS) as BodyType[];
const BUST_SIZES: BustSize[] = ["s", "m", "l", "xl"];

function AvatarSlidersInner({ config, onChange, onReset }: Props) {
  const set = (partial: Partial<AvatarConfig>) =>
    onChange({ ...config, ...partial });

  const setBodyType = (bt: BodyType) => {
    const preset = BODY_TYPE_PRESETS[bt];
    onChange({ ...config, bodyType: bt, ...preset.values });
  };

  return (
    <div className="avcfg-panel">
      <div className="avcfg-panel-header">
        <h2 className="avcfg-title">Avatarini Olustur</h2>
        {onReset && (
          <button className="avcfg-reset-btn" onClick={onReset}>
            Sifirla
          </button>
        )}
      </div>

      {/* Body Type Presets */}
      <div className="avcfg-section">
        <div className="avcfg-section-label">Vucut Tipi</div>
        <div className="avcfg-preset-grid">
          {BODY_TYPES.map((bt) => {
            const meta = BODY_TYPE_PRESETS[bt];
            return (
              <button
                key={bt}
                className={`avcfg-preset-card ${config.bodyType === bt ? "active" : ""}`}
                onClick={() => setBodyType(bt)}
              >
                <span className="avcfg-preset-label">{meta.label}</span>
                <span className="avcfg-preset-desc">{meta.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="avcfg-section">
        <Slider
          label="Boy"
          value={config.height}
          min={150}
          max={195}
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
          label="Kalca Orani"
          value={config.hipRatio}
          min={0.8}
          max={1.25}
          step={0.01}
          unit=""
          onChange={(v) => set({ hipRatio: v })}
        />
      </div>

      {/* Bust Size */}
      <div className="avcfg-section">
        <div className="avcfg-section-label">Gogus</div>
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

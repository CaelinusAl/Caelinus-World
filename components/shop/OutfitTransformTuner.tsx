"use client";

import { useState, useCallback, useRef } from "react";
import type { OutfitBindingConfig, BindingTarget } from "@/types/play";

/* ═══════════════════════════════════════════
   Dev-only runtime outfit transform tuner.

   Renders a floating panel with sliders for
   position / rotation / scale / zOffset / bindingTarget.
   Changes propagate instantly to the 3D scene.

   The "Copy JSON" button outputs a config snippet
   ready to paste into PRODUCT_OUTFIT_CONFIG or
   OUTFIT_GLB_MAP.
   ═══════════════════════════════════════════ */

const BINDING_TARGETS: BindingTarget[] = [
  "hips", "spine", "spine1", "chest", "neck", "head",
  "leftShoulder", "rightShoulder",
  "leftUpperArm", "rightUpperArm",
  "leftHand", "rightHand",
  "leftUpperLeg", "rightUpperLeg",
  "leftLowerLeg", "rightLowerLeg",
  "leftFoot", "rightFoot",
];

type TunerValues = {
  posX: number; posY: number; posZ: number;
  rotX: number; rotY: number; rotZ: number;
  scaleX: number; scaleY: number; scaleZ: number;
  zOffset: number;
  bindingTarget: BindingTarget;
  syncAnimation: boolean;
};

function configToValues(cfg: OutfitBindingConfig): TunerValues {
  const [sx, sy, sz] = typeof cfg.scale === "number"
    ? [cfg.scale, cfg.scale, cfg.scale]
    : cfg.scale;
  return {
    posX: cfg.position[0], posY: cfg.position[1], posZ: cfg.position[2],
    rotX: cfg.rotation[0], rotY: cfg.rotation[1], rotZ: cfg.rotation[2],
    scaleX: sx, scaleY: sy, scaleZ: sz,
    zOffset: cfg.zOffset,
    bindingTarget: cfg.bindingTarget,
    syncAnimation: cfg.syncAnimation,
  };
}

function valuesToConfig(v: TunerValues, baseGlbUrl: string): OutfitBindingConfig {
  const uniform = v.scaleX === v.scaleY && v.scaleY === v.scaleZ;
  return {
    glbUrl: baseGlbUrl,
    bindingTarget: v.bindingTarget,
    fallbackTargets: [],
    position: [round4(v.posX), round4(v.posY), round4(v.posZ)],
    rotation: [round4(v.rotX), round4(v.rotY), round4(v.rotZ)],
    scale: uniform ? round4(v.scaleX) : [round4(v.scaleX), round4(v.scaleY), round4(v.scaleZ)],
    zOffset: round4(v.zOffset),
    syncAnimation: v.syncAnimation,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

type Props = {
  config: OutfitBindingConfig;
  onChange: (updated: OutfitBindingConfig) => void;
  productName?: string;
};

export default function OutfitTransformTuner({ config, onChange, productName }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vals, setVals] = useState<TunerValues>(() => configToValues(config));
  const glbUrl = useRef(config.glbUrl);

  const update = useCallback((partial: Partial<TunerValues>) => {
    setVals((prev) => {
      const next = { ...prev, ...partial };
      onChange(valuesToConfig(next, glbUrl.current));
      return next;
    });
  }, [onChange]);

  const handleCopy = useCallback(() => {
    const json = JSON.stringify(valuesToConfig(vals, glbUrl.current), null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [vals]);

  const handleReset = useCallback(() => {
    const fresh = configToValues(config);
    setVals(fresh);
    onChange(config);
  }, [config, onChange]);

  if (collapsed) {
    return (
      <div className="ott-collapsed" onClick={() => setCollapsed(false)}>
        <span className="ott-collapsed-icon">⚙</span> Tuner
      </div>
    );
  }

  return (
    <div className="ott-panel">
      {/* Header */}
      <div className="ott-header">
        <div className="ott-title">
          <span className="ott-icon">⚙</span>
          Outfit Tuner
          {productName && <span className="ott-product">{productName}</span>}
        </div>
        <button className="ott-minimize" onClick={() => setCollapsed(true)}>—</button>
      </div>

      {/* Binding target */}
      <div className="ott-section">
        <label className="ott-label">bindingTarget</label>
        <select
          className="ott-select"
          value={vals.bindingTarget}
          onChange={(e) => update({ bindingTarget: e.target.value as BindingTarget })}
        >
          {BINDING_TARGETS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Position */}
      <div className="ott-section">
        <label className="ott-label">position</label>
        <div className="ott-row">
          <SliderInput label="X" value={vals.posX} min={-2} max={2} step={0.005} onChange={(v) => update({ posX: v })} />
          <SliderInput label="Y" value={vals.posY} min={-2} max={2} step={0.005} onChange={(v) => update({ posY: v })} />
          <SliderInput label="Z" value={vals.posZ} min={-2} max={2} step={0.005} onChange={(v) => update({ posZ: v })} />
        </div>
      </div>

      {/* Rotation (degrees UI, radians output) */}
      <div className="ott-section">
        <label className="ott-label">rotation (deg)</label>
        <div className="ott-row">
          <SliderInput label="X" value={toDeg(vals.rotX)} min={-180} max={180} step={1} onChange={(v) => update({ rotX: toRad(v) })} />
          <SliderInput label="Y" value={toDeg(vals.rotY)} min={-180} max={180} step={1} onChange={(v) => update({ rotY: toRad(v) })} />
          <SliderInput label="Z" value={toDeg(vals.rotZ)} min={-180} max={180} step={1} onChange={(v) => update({ rotZ: toRad(v) })} />
        </div>
      </div>

      {/* Scale */}
      <div className="ott-section">
        <label className="ott-label">scale</label>
        <div className="ott-row">
          <SliderInput label="X" value={vals.scaleX} min={0.001} max={3} step={0.01} onChange={(v) => update({ scaleX: v })} />
          <SliderInput label="Y" value={vals.scaleY} min={0.001} max={3} step={0.01} onChange={(v) => update({ scaleY: v })} />
          <SliderInput label="Z" value={vals.scaleZ} min={0.001} max={3} step={0.01} onChange={(v) => update({ scaleZ: v })} />
        </div>
      </div>

      {/* zOffset */}
      <div className="ott-section">
        <label className="ott-label">zOffset</label>
        <SliderInput label="" value={vals.zOffset} min={0} max={0.02} step={0.0005} onChange={(v) => update({ zOffset: v })} />
      </div>

      {/* syncAnimation */}
      <div className="ott-section ott-row" style={{ gap: 8, alignItems: "center" }}>
        <label className="ott-label" style={{ flex: 1 }}>syncAnimation</label>
        <input
          type="checkbox"
          checked={vals.syncAnimation}
          onChange={(e) => update({ syncAnimation: e.target.checked })}
          className="ott-checkbox"
        />
      </div>

      {/* Actions */}
      <div className="ott-actions">
        <button className="ott-btn ott-btn--copy" onClick={handleCopy}>
          {copied ? "✓ Kopyalandi" : "📋 Copy JSON"}
        </button>
        <button className="ott-btn ott-btn--reset" onClick={handleReset}>
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SliderInput — compact axis control
   ═══════════════════════════════════════════ */

function SliderInput({ label, value, min, max, step, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ott-axis">
      {label && <span className="ott-axis-label">{label}</span>}
      <input
        type="range"
        className="ott-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <input
        type="number"
        className="ott-num"
        step={step}
        value={round4(value)}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
      />
    </div>
  );
}

function toDeg(rad: number): number { return round4(rad * 180 / Math.PI); }
function toRad(deg: number): number { return round4(deg * Math.PI / 180); }

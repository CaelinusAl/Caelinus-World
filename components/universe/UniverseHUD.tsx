"use client";

/**
 * UniverseHUD — Caelinus Evreni lüks cam arayüzü (3B sahnenin üstünde).
 * Üst şerit · hover gezegen etiketi · alt yüzen çip dock · ipucu.
 * Tüm tıklamalar 3B sahneye geçer (pointer-events yalnızca etkileşimli öğelerde).
 */

import type { District } from "@/components/universe/districts";

type Props = {
  districts: District[];
  hoveredId: string | null;
  activeId: string | null;
  soundOn: boolean;
  onToggleSound: () => void;
  onChipHover: (id: string | null) => void;
  onChipSelect: (id: string) => void;
};

export default function UniverseHUD({
  districts,
  hoveredId,
  activeId,
  soundOn,
  onToggleSound,
  onChipHover,
  onChipSelect,
}: Props) {
  const hovered = districts.find((d) => d.id === hoveredId) ?? null;

  return (
    <div className="uv-hud">
      {/* Üst şerit */}
      <div className="uv-topbar">
        <div className="uv-brand">
          <div className="uv-brand-title">
            <span className="spark">✦</span> CAELINUS UNIVERSE
          </div>
          <div className="uv-brand-sub">Yaklaş · Keşfet · Geç</div>
        </div>

        <div className="uv-actions">
          <button
            type="button"
            className={`uv-pill${soundOn ? " is-on" : ""}`}
            onClick={onToggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Sesi kapat" : "Sesi aç"}
          >
            <span className="dot" />
            <span className="txt">{soundOn ? "Ses Açık" : "Ses"}</span>
          </button>
          <a className="uv-pill" href="/" aria-label="Ana sayfaya dön">
            <span className="txt">← Geri</span>
          </a>
        </div>
      </div>

      {/* Hover gezegen etiketi */}
      <div className={`uv-planet-label${hovered ? " is-visible" : ""}`}>
        <div
          className="pl-name"
          style={{ textShadow: hovered ? `0 0 40px ${hovered.accent}88` : undefined }}
        >
          {hovered?.label ?? ""}
        </div>
        <div className="pl-sub">{hovered?.sub ?? ""}</div>
        <div className="pl-hint">Girmek için tıkla</div>
      </div>

      {/* İpucu */}
      <div className="uv-hint">Sürükle · Döndür · Tekerlek ile Zum</div>

      {/* Alt yüzen dock */}
      <nav className="uv-dock" aria-label="Evren bölgeleri">
        {districts.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`uv-chip${activeId === d.id ? " is-active" : ""}`}
            style={{ color: hoveredId === d.id ? d.accent : undefined }}
            onMouseEnter={() => onChipHover(d.id)}
            onMouseLeave={() => onChipHover(null)}
            onFocus={() => onChipHover(d.id)}
            onBlur={() => onChipHover(null)}
            onClick={() => onChipSelect(d.id)}
            aria-label={`${d.label} — ${d.sub}`}
          >
            <span className="chip-dot" style={{ color: d.accent }} />
            <span className="chip-name">{d.label}</span>
            <span className="chip-sub">{d.sub}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

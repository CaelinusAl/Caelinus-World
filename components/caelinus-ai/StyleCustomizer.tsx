"use client";

/**
 * StyleCustomizer — Caelinus AI'ın "Stilimi Seç" katmanı.
 *
 * Bölümler:
 *   • Saç (uzunluk + texture + renk swatch)
 *   • Ten tonu (swatch grid)
 *   • Yüz stili (chip — natural / soft / sculpted / ethereal)
 *   • Vücut tipi (chip)
 *   • Outfit mood (chip — minimal / couture / bohemian / futurist /
 *     ritualistic / noir-luxe)
 *
 * Her değişiklik üst component'e `onChange(profile)` ile yansır.
 * Style profile localStorage'a yazıldığı için sayfa refresh'inde
 * kalıcıdır.
 */

import { useCallback } from "react";

import type {
  AvatarStyleProfile,
  BodyTypeMood,
  ColorHex,
  FaceStyle,
  HairLength,
  HairTexture,
  OutfitMood,
} from "@/lib/caelinus-ai";

type Props = {
  value: AvatarStyleProfile;
  onChange: (next: AvatarStyleProfile) => void;
};

const HAIR_LENGTHS: { id: HairLength; label: string }[] = [
  { id: "short", label: "Kısa" },
  { id: "bob", label: "Bob" },
  { id: "medium", label: "Orta" },
  { id: "long", label: "Uzun" },
  { id: "veil", label: "Tülbent" },
];

const HAIR_TEXTURES: { id: HairTexture; label: string }[] = [
  { id: "straight", label: "Düz" },
  { id: "wavy", label: "Dalgalı" },
  { id: "curly", label: "Kıvırcık" },
  { id: "coily", label: "Sıkı Kıvırcık" },
];

const HAIR_COLORS: ColorHex[] = [
  "#0c0908",
  "#1a1410",
  "#3b2a1f",
  "#6b4226",
  "#9a6c3a",
  "#c08a4d",
  "#dcb27c",
  "#ead0a8",
  "#a83a2a",
  "#7d2f5a",
  "#283f5a",
  "#cfc8c0",
];

const SKIN_TONES: ColorHex[] = [
  "#f1ddc4",
  "#e8c5a8",
  "#d4ad8a",
  "#c08e6b",
  "#a87149",
  "#8a5a35",
  "#6b4226",
  "#4a2c19",
];

const FACE_STYLES: { id: FaceStyle; label: string; tagline: string }[] = [
  { id: "natural", label: "Doğal", tagline: "yüzünün kendisi, sadece daha keskin ışık" },
  { id: "soft", label: "Yumuşak", tagline: "ölçü yumuşatılmış, çocuksu sıcak" },
  { id: "sculpted", label: "Heykel", tagline: "hatlar belirgin, mimari" },
  { id: "ethereal", label: "Eter", tagline: "sınırlar bulanık, ışık çoğul" },
];

const BODY_TYPES: { id: BodyTypeMood; label: string }[] = [
  { id: "slender", label: "İnce" },
  { id: "balanced", label: "Dengeli" },
  { id: "curvy", label: "Eğrili" },
  { id: "athletic", label: "Atletik" },
  { id: "ritualistic", label: "Ritüel" },
];

const OUTFIT_MOODS: { id: OutfitMood; label: string; tagline: string }[] = [
  { id: "minimal", label: "Minimal", tagline: "az dokuda çok niyet" },
  { id: "couture", label: "Couture", tagline: "el işi, ayrıntıda zaman" },
  { id: "bohemian", label: "Bohem", tagline: "dolaşan, akan, dünya kokulu" },
  { id: "futurist", label: "Fütürist", tagline: "metalik, geleceğin ışığı" },
  { id: "ritualistic", label: "Ritüel", tagline: "her parça bir geçit" },
  { id: "noir-luxe", label: "Noir Luxe", tagline: "siyah + altın, gece töreni" },
];

export default function StyleCustomizer({ value, onChange }: Props) {
  const update = useCallback(
    <K extends keyof AvatarStyleProfile>(
      key: K,
      next: AvatarStyleProfile[K],
    ) => {
      onChange({ ...value, [key]: next });
    },
    [value, onChange],
  );

  const updateHair = useCallback(
    <K extends keyof AvatarStyleProfile["hair"]>(
      key: K,
      next: AvatarStyleProfile["hair"][K],
    ) => {
      onChange({ ...value, hair: { ...value.hair, [key]: next } });
    },
    [value, onChange],
  );

  return (
    <div className="style-customizer">
      {/* SAÇ */}
      <section className="style-section">
        <header className="style-section-header">
          <h3 className="style-section-title">Saç</h3>
          <p className="style-section-sub">
            Uzunluk, doku ve renk — başının duruşu burada başlar.
          </p>
        </header>

        <div className="style-row">
          <div className="style-row-label">Uzunluk</div>
          <div className="style-chips">
            {HAIR_LENGTHS.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`style-chip ${value.hair.length === h.id ? "is-active" : ""}`}
                onClick={() => updateHair("length", h.id)}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="style-row">
          <div className="style-row-label">Doku</div>
          <div className="style-chips">
            {HAIR_TEXTURES.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`style-chip ${value.hair.texture === h.id ? "is-active" : ""}`}
                onClick={() => updateHair("texture", h.id)}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="style-row">
          <div className="style-row-label">Renk</div>
          <div className="style-swatches">
            {HAIR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Saç rengi ${c}`}
                className={`style-swatch ${value.hair.color === c ? "is-active" : ""}`}
                style={{ background: c }}
                onClick={() => updateHair("color", c)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* TEN */}
      <section className="style-section">
        <header className="style-section-header">
          <h3 className="style-section-title">Ten</h3>
          <p className="style-section-sub">
            Caelinus seninkini hisseder; istediğin zaman değiştir.
          </p>
        </header>
        <div className="style-swatches style-swatches--skin">
          {SKIN_TONES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Ten rengi ${c}`}
              className={`style-swatch ${value.skinTone === c ? "is-active" : ""}`}
              style={{ background: c }}
              onClick={() => update("skinTone", c)}
            />
          ))}
        </div>
      </section>

      {/* YÜZ STİLİ */}
      <section className="style-section">
        <header className="style-section-header">
          <h3 className="style-section-title">Yüz Stili</h3>
        </header>
        <div className="style-cards">
          {FACE_STYLES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`style-card ${value.faceStyle === f.id ? "is-active" : ""}`}
              onClick={() => update("faceStyle", f.id)}
            >
              <span className="style-card-name">{f.label}</span>
              <span className="style-card-tagline">{f.tagline}</span>
            </button>
          ))}
        </div>
      </section>

      {/* VÜCUT TİPİ */}
      <section className="style-section">
        <header className="style-section-header">
          <h3 className="style-section-title">Vücut Hâli</h3>
          <p className="style-section-sub">
            Tipoloji yok — bedenin getirdiği hâl.
          </p>
        </header>
        <div className="style-chips">
          {BODY_TYPES.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`style-chip ${value.bodyType === b.id ? "is-active" : ""}`}
              onClick={() => update("bodyType", b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      {/* OUTFIT MOOD */}
      <section className="style-section">
        <header className="style-section-header">
          <h3 className="style-section-title">Stilin Frekansı</h3>
          <p className="style-section-sub">
            Hangi akışla taşınmak istersin?
          </p>
        </header>
        <div className="style-cards">
          {OUTFIT_MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`style-card ${value.outfitMood === m.id ? "is-active" : ""}`}
              onClick={() => update("outfitMood", m.id)}
            >
              <span className="style-card-name">{m.label}</span>
              <span className="style-card-tagline">{m.tagline}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

/**
 * AvatarBuilder — kullanıcının saç, göz, ten, dudak, beden, aura
 * seçimleriyle Caelinus tanrıçasını yarattığı interaktif panel.
 *
 * Vizyon: Selfie üst sınırını kaldırıyoruz. Kullanıcı kapıdan
 * girer girmez kendi karakterini yaratır — anlık geri bildirim,
 * sıfır AI maliyeti, oyun hissi.
 *
 * Sol/sağ ya da alt/üst layout (responsive):
 *   • Sol/Üst:    TraitMoodboard canlı preview (sticky)
 *   • Sağ/Alt:    7 sekmeli kontrol paneli (Ten · Beden · Saç · Göz ·
 *                 Dudak · Burç · Glif)
 *
 * State props ile dışarıdan kontrol edilir — AvatarStudioBody
 * trait state'ini sahiplenir, save akışı orada. Bu sayede
 * /avatar dışındaki bir yerden de (örn. Shop hızlı yaratım modal'ı)
 * aynı bileşen reuse edilebilir.
 */

import { useId, useState } from "react";

import TraitMoodboard from "@/components/avatar/TraitMoodboard";
import { ZODIACS, type ZodiacId } from "@/data/play-assets";
import {
  BODY_SHAPES,
  EYE_COLORS,
  FREQUENCY_GLYPHS,
  HAIR_COLORS,
  HAIR_LENGTHS,
  HAIR_TEXTURES,
  LIP_COLORS,
  SKIN_TONES,
  ZODIAC_GLYPH_CHARS,
  type BuilderTraits,
  type EyeColorId,
  type FrequencyId,
  type GlyphMode,
  type HairColorId,
  type HairLengthId,
  type HairTextureId,
  type LipColorId,
  type SkinToneId,
  type BodyShapeId,
} from "@/lib/avatar/builder";

type Lang = "tr" | "en";

type Props = {
  traits: BuilderTraits;
  onChange: (next: BuilderTraits) => void;
  lang?: Lang;
  /** Preview'ın yanına ekstra eylem (örn. "Bu Avatarı Kaydet" butonu)
   *  yerleştirmek için slot. */
  actions?: React.ReactNode;
  /** Eğer kullanıcının üretilmiş AI portresi varsa moodboard yerine
   *  bu görsel gösterilir. URL geçerli olmalı. */
  portraitUrl?: string | null;
  /** Portrait üretiliyor mu — moodboard üstüne loading overlay basılır. */
  generating?: boolean;
};

type SectionId = "skin" | "body" | "hair" | "eye" | "lip" | "zodiac" | "glyph";

const COPY = {
  tr: {
    sections: {
      skin: "Ten",
      body: "Beden",
      hair: "Saç",
      eye: "Göz",
      lip: "Dudak",
      zodiac: "Burç",
      glyph: "Alın Glifi",
    },
    hairLength: "Uzunluk",
    hairTexture: "Doku",
    hairColor: "Renk",
    cosmicGroup: "Kozmik",
    classicGroup: "Klasik",
    noZodiac: "Burç yok",
    glyphNone: "Yok",
    glyphZodiac: "Burç sembolü",
    glyphFrequency: "Frekans",
    pickFrequency: "Frekans seç",
    randomize: "Rastgele tanrıça",
    livePreview: "Canlı önizleme",
  },
  en: {
    sections: {
      skin: "Skin",
      body: "Body",
      hair: "Hair",
      eye: "Eyes",
      lip: "Lips",
      zodiac: "Zodiac",
      glyph: "Forehead Glyph",
    },
    hairLength: "Length",
    hairTexture: "Texture",
    hairColor: "Color",
    cosmicGroup: "Cosmic",
    classicGroup: "Classic",
    noZodiac: "No zodiac",
    glyphNone: "None",
    glyphZodiac: "Zodiac glyph",
    glyphFrequency: "Frequency",
    pickFrequency: "Pick frequency",
    randomize: "Random goddess",
    livePreview: "Live preview",
  },
} as const;

export default function AvatarBuilder({
  traits,
  onChange,
  lang = "tr",
  actions,
  portraitUrl,
  generating,
}: Props) {
  const t = COPY[lang];
  const [section, setSection] = useState<SectionId>("hair");
  const titleId = useId();

  // Helper — single-field updates
  const set = <K extends keyof BuilderTraits>(k: K, v: BuilderTraits[K]) =>
    onChange({ ...traits, [k]: v });

  // Random tanrıça — bir tıkla tüm trait'leri rastgele seçer.
  // Cosmic ağırlıklı (manifestoya uygun) — %50 cosmic saç/göz şansı.
  const randomize = () => {
    const pick = <T,>(arr: readonly T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];
    onChange({
      skin: pick(SKIN_TONES).id,
      body: pick(BODY_SHAPES).id,
      hairLength: pick(HAIR_LENGTHS).id,
      hairTexture: pick(HAIR_TEXTURES).id,
      hairColor: pick(HAIR_COLORS).id,
      eye: pick(EYE_COLORS).id,
      lip: pick(LIP_COLORS).id,
      zodiac: Math.random() > 0.3 ? pick(ZODIACS).id : null,
      glyph:
        Math.random() < 0.4
          ? "frequency"
          : Math.random() < 0.5
            ? "zodiac"
            : "none",
      frequency: pick(FREQUENCY_GLYPHS).id as FrequencyId,
    });
  };

  return (
    <div className="ab-shell" aria-labelledby={titleId}>
      {/* ── PREVIEW (sticky on desktop) ───────────────────────── */}
      <div className="ab-preview-col">
        <div className="ab-preview-frame" aria-label={t.livePreview}>
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portraitUrl}
              alt={lang === "tr" ? "Senin Caelinus tanrıçan" : "Your Caelinus goddess"}
              className="ab-portrait-img"
            />
          ) : (
            <TraitMoodboard traits={traits} idPrefix="ab-live" />
          )}
          {generating && (
            <div className="ab-generating-overlay" aria-live="polite">
              <div className="ab-generating-shimmer" aria-hidden="true" />
              <p className="ab-generating-text">
                {lang === "tr"
                  ? "✦ Tanrıçan doğuyor…"
                  : "✦ Painting your goddess…"}
              </p>
              <p className="ab-generating-hint">
                {lang === "tr"
                  ? "AI portren ~10-15 saniye içinde hazır olacak."
                  : "Your AI portrait is ready in ~10-15s."}
              </p>
            </div>
          )}
        </div>
        <div className="ab-preview-actions">
          <button
            type="button"
            onClick={randomize}
            className="ab-btn ab-btn--ghost"
            disabled={generating}
          >
            ✦ {t.randomize}
          </button>
          {actions}
        </div>
      </div>

      {/* ── CONTROL PANEL ────────────────────────────────────── */}
      <div className="ab-controls">
        <h2 id={titleId} className="ab-controls-title">
          {lang === "tr" ? "Tanrıçanı Yarat" : "Build Your Goddess"}
        </h2>

        {/* Section tabs */}
        <nav className="ab-tabs" role="tablist" aria-label={lang === "tr" ? "Bölümler" : "Sections"}>
          {(Object.keys(t.sections) as SectionId[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={section === s}
              className={`ab-tab ${section === s ? "active" : ""}`}
              onClick={() => setSection(s)}
            >
              {t.sections[s]}
            </button>
          ))}
        </nav>

        {/* Sections */}
        {section === "skin" && (
          <SwatchGrid
            options={SKIN_TONES.map((s) => ({ id: s.id, label: s.label[lang], color: s.color }))}
            value={traits.skin}
            onPick={(id) => set("skin", id as SkinToneId)}
          />
        )}

        {section === "body" && (
          <ChipGrid
            options={BODY_SHAPES.map((b) => ({
              id: b.id,
              label: b.label[lang],
              hint: b.hint[lang],
            }))}
            value={traits.body}
            onPick={(id) => set("body", id as BodyShapeId)}
          />
        )}

        {section === "hair" && (
          <div className="ab-hair">
            <p className="ab-section-label">{t.hairLength}</p>
            <ChipRow
              options={HAIR_LENGTHS.map((h) => ({ id: h.id, label: h.label[lang] }))}
              value={traits.hairLength}
              onPick={(id) => set("hairLength", id as HairLengthId)}
            />
            <p className="ab-section-label">{t.hairTexture}</p>
            <ChipRow
              options={HAIR_TEXTURES.map((h) => ({ id: h.id, label: h.label[lang] }))}
              value={traits.hairTexture}
              onPick={(id) => set("hairTexture", id as HairTextureId)}
            />
            <p className="ab-section-label">{t.hairColor}</p>
            <SwatchGrid
              options={HAIR_COLORS.filter((h) => !h.cosmic).map((h) => ({
                id: h.id,
                label: h.label[lang],
                color: h.color,
              }))}
              value={traits.hairColor}
              onPick={(id) => set("hairColor", id as HairColorId)}
              groupLabel={t.classicGroup}
            />
            <SwatchGrid
              options={HAIR_COLORS.filter((h) => h.cosmic).map((h) => ({
                id: h.id,
                label: h.label[lang],
                color: h.color,
              }))}
              value={traits.hairColor}
              onPick={(id) => set("hairColor", id as HairColorId)}
              groupLabel={`✦ ${t.cosmicGroup}`}
            />
          </div>
        )}

        {section === "eye" && (
          <>
            <SwatchGrid
              options={EYE_COLORS.filter((e) => !e.cosmic).map((e) => ({
                id: e.id,
                label: e.label[lang],
                color: e.color,
              }))}
              value={traits.eye}
              onPick={(id) => set("eye", id as EyeColorId)}
              groupLabel={t.classicGroup}
            />
            <SwatchGrid
              options={EYE_COLORS.filter((e) => e.cosmic).map((e) => ({
                id: e.id,
                label: e.label[lang],
                color: e.color,
              }))}
              value={traits.eye}
              onPick={(id) => set("eye", id as EyeColorId)}
              groupLabel={`✦ ${t.cosmicGroup}`}
            />
          </>
        )}

        {section === "lip" && (
          <>
            <SwatchGrid
              options={LIP_COLORS.filter((l) => !l.cosmic).map((l) => ({
                id: l.id,
                label: l.label[lang],
                color: l.color,
              }))}
              value={traits.lip}
              onPick={(id) => set("lip", id as LipColorId)}
              groupLabel={t.classicGroup}
            />
            <SwatchGrid
              options={LIP_COLORS.filter((l) => l.cosmic).map((l) => ({
                id: l.id,
                label: l.label[lang],
                color: l.color,
              }))}
              value={traits.lip}
              onPick={(id) => set("lip", id as LipColorId)}
              groupLabel={`✦ ${t.cosmicGroup}`}
            />
          </>
        )}

        {section === "zodiac" && (
          <ChipGrid
            options={[
              { id: "__none__", label: t.noZodiac, hint: lang === "tr" ? "Tarafsız aura" : "Neutral aura" },
              ...ZODIACS.map((z) => ({
                id: z.id,
                label: `${ZODIAC_GLYPH_CHARS[z.id]} ${z.label[lang]}`,
                hint: undefined,
              })),
            ]}
            value={traits.zodiac ?? "__none__"}
            onPick={(id) => set("zodiac", id === "__none__" ? null : (id as ZodiacId))}
          />
        )}

        {section === "glyph" && (
          <div>
            <ChipRow
              options={[
                { id: "none", label: t.glyphNone },
                { id: "zodiac", label: t.glyphZodiac },
                { id: "frequency", label: t.glyphFrequency },
              ]}
              value={traits.glyph}
              onPick={(id) => set("glyph", id as GlyphMode)}
            />
            {traits.glyph === "frequency" && (
              <>
                <p className="ab-section-label" style={{ marginTop: 18 }}>
                  {t.pickFrequency}
                </p>
                <div className="ab-freq-grid">
                  {FREQUENCY_GLYPHS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`ab-freq-chip ${traits.frequency === f.id ? "active" : ""}`}
                      onClick={() => set("frequency", f.id as FrequencyId)}
                      style={{
                        borderColor:
                          traits.frequency === f.id ? f.color : "rgba(255,255,255,0.12)",
                      }}
                    >
                      <span className="ab-freq-label">{f.label}</span>
                      <span className="ab-freq-mood">{f.mood[lang]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {traits.glyph === "zodiac" && !traits.zodiac && (
              <p className="ab-hint">
                {lang === "tr"
                  ? "Önce bir burç seç — glif onun sembolünü gösterecek."
                  : "Pick a zodiac first — the glyph will show its sign."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub bileşenler ──────────────────────────────────────── */

function SwatchGrid({
  options,
  value,
  onPick,
  groupLabel,
}: {
  options: { id: string; label: string; color: string }[];
  value: string;
  onPick: (id: string) => void;
  groupLabel?: string;
}) {
  return (
    <div className="ab-swatch-section">
      {groupLabel && <p className="ab-group-label">{groupLabel}</p>}
      <div className="ab-swatch-grid">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`ab-swatch ${value === o.id ? "active" : ""}`}
            onClick={() => onPick(o.id)}
            aria-label={o.label}
            title={o.label}
          >
            <span
              className="ab-swatch-dot"
              style={{ background: o.color }}
              aria-hidden="true"
            />
            <span className="ab-swatch-label">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipRow({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="ab-chip-row">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`ab-chip ${value === o.id ? "active" : ""}`}
          onClick={() => onPick(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChipGrid({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string; hint?: string | undefined }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="ab-chip-grid">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`ab-chip-card ${value === o.id ? "active" : ""}`}
          onClick={() => onPick(o.id)}
        >
          <span className="ab-chip-card-label">{o.label}</span>
          {o.hint && <span className="ab-chip-card-hint">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

"use client";

/**
 * AvatarMatchGrid — Caelinus AI'ın "AI 6 sonuç buldu" katmanı.
 *
 * Provider.generateMatches() çıktısını alır, 6 kart olarak gösterir.
 * En yüksek skorlu match'in altın halkası ve "✦ Senin için" rozeti
 * vardır. Kullanıcı tıklayınca onSelect(match) çağrılır; üst component
 * o match'i finalize edip GeneratedAvatar'a dönüştürür.
 *
 * Animasyon: stagger fade-up (her kart 80ms gecikmeyle belirir).
 */

import { useMemo } from "react";

import { ENERGY_LABELS, type AvatarMatch } from "@/lib/caelinus-ai";

type Props = {
  matches: AvatarMatch[];
  selectedId?: string | null;
  onSelect: (match: AvatarMatch) => void;
};

export default function AvatarMatchGrid({
  matches,
  selectedId,
  onSelect,
}: Props) {
  const sorted = useMemo(
    () =>
      [...matches].sort((a, b) => {
        // Recommended önce, sonra skor
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return b.recommendationScore - a.recommendationScore;
      }),
    [matches],
  );

  return (
    <div className="cai-match-grid">
      <div className="cai-match-grid-header">
        <div className="cai-match-grid-kicker">
          ✦ AI altı eşleşme buldu
        </div>
        <h3 className="cai-match-grid-title">
          Hangisi senin frekansın?
        </h3>
        <p className="cai-match-grid-sub">
          Her kart Caelinus dilinde farklı bir arketip — yüzünü, stilini,
          hatta &ldquo;getirdiğin hâli&rdquo; okuyarak seçim yaptık.
          Önerilenle başlayabilirsin, ama seçim senin.
        </p>
      </div>

      <div className="cai-match-cards">
        {sorted.map((match, idx) => {
          const energy = ENERGY_LABELS[match.reading.energy];
          const isSelected = selectedId === match.id;

          return (
            <button
              key={match.id}
              type="button"
              className={`cai-match-card ${match.isRecommended ? "is-recommended" : ""} ${
                isSelected ? "is-selected" : ""
              }`}
              style={
                {
                  animationDelay: `${idx * 80}ms`,
                  ["--energy-color" as string]: energy.color,
                } as React.CSSProperties
              }
              onClick={() => onSelect(match)}
              aria-pressed={isSelected}
            >
              {match.isRecommended && (
                <div className="cai-match-card-recommend">
                  <span className="cai-match-card-recommend-glyph">✦</span>
                  <span>Senin için</span>
                </div>
              )}

              <div className="cai-match-card-thumb">
                {match.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={match.thumbnailUrl}
                    alt={match.reading.styleIdentity.label}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : null}
                <div className="cai-match-card-thumb-fallback" aria-hidden="true">
                  <span className="cai-match-card-thumb-mono">
                    {match.reading.styleIdentity.label
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="cai-match-card-thumb-glyph">
                    {energy.glyph}
                  </span>
                </div>
                <div className="cai-match-card-aura" aria-hidden="true" />
              </div>

              <div className="cai-match-card-meta">
                <div className="cai-match-card-energy">
                  <span
                    className="cai-match-card-energy-dot"
                    style={{ background: energy.color }}
                  />
                  {energy.tr} · {energy.en}
                </div>
                <h4 className="cai-match-card-name">
                  {match.reading.styleIdentity.label}
                </h4>
                {match.reading.styleIdentity.subtitle && (
                  <div className="cai-match-card-subtitle">
                    {match.reading.styleIdentity.subtitle}
                  </div>
                )}
                <p className="cai-match-card-mood">{match.reading.mood}</p>

                <div className="cai-match-card-score-row">
                  <div
                    className="cai-match-card-score-bar"
                    aria-label={`Eşleşme skoru ${match.recommendationScore}`}
                  >
                    <div
                      className="cai-match-card-score-fill"
                      style={{ width: `${match.recommendationScore}%` }}
                    />
                  </div>
                  <span className="cai-match-card-score-num">
                    %{match.recommendationScore}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

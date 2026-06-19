"use client";

/**
 * PlantOracleCard — Caelinus bitki kütüphanesinden tek bir bitkiyi
 * "kehanet kartı" olarak gösterir. Tıklayınca Gaia AI'ya o bitkiyle
 * ilgili soru gönderir (onAsk). Veri `data/gaia.ts`'ten gelir.
 */

import { MOOD_LABELS, type GaiaPlant } from "@/data/gaia";

type Props = {
  plant: GaiaPlant;
  onAsk: (prompt: string) => void;
};

export default function PlantOracleCard({ plant, onAsk }: Props) {
  const moodText = plant.moods
    .map((m) => MOOD_LABELS[m]?.tr ?? m)
    .slice(0, 3)
    .join(" · ");

  return (
    <button
      type="button"
      className="plant-oracle-card"
      onClick={() =>
        onAsk(
          `${plant.name.tr} (${plant.scientific}) hakkında bana rehberlik et: nasıl bakılır, ne zaman ekilir, hangi toprağı sever?`,
        )
      }
      aria-label={`${plant.name.tr} hakkında sor`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="plant-oracle-img" src={plant.image} alt={plant.name.tr} loading="lazy" />
      <span className="plant-oracle-freq">{plant.frequency} Hz</span>
      <div className="plant-oracle-body">
        <p className="plant-oracle-name">{plant.name.tr}</p>
        <p className="plant-oracle-sci">{plant.scientific}</p>
        {moodText && <p className="plant-oracle-moods">{moodText}</p>}
      </div>
      <span className="plant-oracle-cta" aria-hidden="true">
        Bu bitkiyi sor →
      </span>
    </button>
  );
}

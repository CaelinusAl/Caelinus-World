"use client";

/**
 * GoddessSelector — 6 Caelinus tanrıça arketipinden birini seç, Moda AI
 * o kimliği nasıl giyineceğini yorumlasın. Veri
 * `lib/data/goddess-archetypes.ts` (archetypes.ts adaptörü) üzerinden gelir.
 */

import { GODDESS_ARCHETYPES } from "@/lib/data/goddess-archetypes";

type Props = {
  onAsk: (text: string) => void;
};

const ENERGY_GLYPH: Record<string, string> = {
  fire: "△",
  earth: "▽",
  air: "○",
  water: "◇",
};

export default function GoddessSelector({ onAsk }: Props) {
  function ask(label: string, subtitle: string, frequency: string) {
    onAsk(
      `"${label}" (${subtitle}, ${frequency}) tanrıça arketipine yakın hissediyorum. ` +
        `Bu kimliği nasıl giyinmeliyim? Caelinus koleksiyonundan parça ve bir his rehberi ver.`,
    );
  }

  return (
    <div className="moda-card moda-goddess">
      <div className="moda-card-head">
        <span className="moda-card-glyph" aria-hidden="true">
          ◈
        </span>
        <div>
          <p className="moda-card-kicker">TANRIÇA ARKETİPİ</p>
          <h3 className="moda-card-title">Kimliğini seç</h3>
        </div>
      </div>

      <div className="moda-goddess-grid">
        {GODDESS_ARCHETYPES.map((g) => (
          <button
            key={g.id}
            type="button"
            className="moda-goddess-chip"
            onClick={() => ask(g.label, g.subtitle, g.frequency)}
          >
            <span className="moda-goddess-energy" aria-hidden="true">
              {ENERGY_GLYPH[g.energy] ?? "✦"}
            </span>
            <span className="moda-goddess-label">{g.label}</span>
            <span className="moda-goddess-sub">{g.subtitle}</span>
            <span className="moda-goddess-freq">{g.frequency}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

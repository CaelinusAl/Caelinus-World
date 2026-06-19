"use client";

/**
 * MoonPlantingCalendar — ay döngüsüne göre ekim rehberi.
 *
 * Güncel ay evresini sinodik ay (29.53 gün) üzerinden hesaplar.
 * Büyüyen ay → toprak üstü yapraklı/meyveli ekim; küçülen ay → kök,
 * budama, toprak işi. Bunu "Caelinus ritmi" olarak yumuşakça sunar
 * (katı bilim iddiası yok). Tıkla → Gaia AI'ya bu haftanın ekimini sor.
 */

import { useEffect, useState } from "react";

const LUNAR_CYCLE = 29.53058867;
// Bilinen yeni ay referansı: 2000-01-06 18:14 UTC.
const KNOWN_NEW_MOON_DAYS = Date.UTC(2000, 0, 6, 18, 14, 0) / 86_400_000;

type PhaseInfo = {
  name: string;
  glyph: string;
  waxing: boolean;
  guide: string;
};

function computePhase(): PhaseInfo {
  const nowDays = Date.now() / 86_400_000;
  const age = (((nowDays - KNOWN_NEW_MOON_DAYS) % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const f = age / LUNAR_CYCLE; // 0..1
  const waxing = f < 0.5;

  let name = "Yeni Ay";
  let glyph = "🌑";
  if (f < 0.03 || f > 0.97) { name = "Yeni Ay"; glyph = "🌑"; }
  else if (f < 0.22) { name = "Hilal (Büyüyen)"; glyph = "🌒"; }
  else if (f < 0.28) { name = "İlk Dördün"; glyph = "🌓"; }
  else if (f < 0.47) { name = "Şişkin (Büyüyen)"; glyph = "🌔"; }
  else if (f < 0.53) { name = "Dolunay"; glyph = "🌕"; }
  else if (f < 0.72) { name = "Şişkin (Küçülen)"; glyph = "🌖"; }
  else if (f < 0.78) { name = "Son Dördün"; glyph = "🌗"; }
  else { name = "Hilal (Küçülen)"; glyph = "🌘"; }

  const guide = waxing
    ? "Büyüyen ay: toprak üstü yapraklı ve meyveli bitkileri ekmek için uygun dönem."
    : "Küçülen ay: kök bitkileri, budama ve toprak işleri için uygun dönem.";

  return { name, glyph, waxing, guide };
}

type Props = {
  onAsk: (prompt: string) => void;
};

export default function MoonPlantingCalendar({ onAsk }: Props) {
  // Hydration güvenliği: tarih client'ta hesaplanır.
  const [phase, setPhase] = useState<PhaseInfo | null>(null);

  useEffect(() => {
    setPhase(computePhase());
  }, []);

  return (
    <div className="moon-cal-card">
      <p className="moon-cal-kicker">Ay Takvimi · Caelinus Ritmi</p>
      <div className="moon-cal-head">
        <span className="moon-cal-glyph" aria-hidden="true">
          {phase?.glyph ?? "🌙"}
        </span>
        <div>
          <p className="moon-cal-phase">{phase?.name ?? "Ay evresi hesaplanıyor…"}</p>
          <p className="moon-cal-mode">
            {phase ? (phase.waxing ? "Büyüyen Ay" : "Küçülen Ay") : ""}
          </p>
        </div>
      </div>
      <p className="moon-cal-guide">{phase?.guide ?? ""}</p>
      <button
        type="button"
        className="moon-cal-cta"
        onClick={() =>
          onAsk(
            "Şu anki ay evresine göre bu hafta ne ekmem/yapmam Caelinus ritmine uygun olur?",
          )
        }
      >
        Bu haftanın ekimini sor →
      </button>
    </div>
  );
}

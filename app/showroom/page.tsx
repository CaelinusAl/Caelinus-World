"use client";

/**
 * /showroom — Caelinus Salonu (5D POC).
 *
 * İçinde gezilen 3B portal salonu. Canvas yalnızca tarayıcıda yüklenir
 * (ssr:false — WebGL SSR'da kurulmaz). Üstteki overlay: başlık + ipucu;
 * bir esere tıklanınca o dünyaya "gir" çağrısı (journey-dalışı).
 */

import dynamic from "next/dynamic";
import { useState } from "react";
import JourneyLink from "@/components/journey/JourneyLink";
import type { Exhibit } from "@/components/showroom/exhibits";

const ShowroomCanvas = dynamic(
  () => import("@/components/showroom/ShowroomCanvas"),
  {
    ssr: false,
    loading: () => <div className="sr-loading">Salon yükleniyor…</div>,
  },
);

export default function ShowroomPage() {
  const [selected, setSelected] = useState<Exhibit | null>(null);

  return (
    <main className="sr-page">
      <ShowroomCanvas onSelect={setSelected} />

      <div className="sr-overlay">
        <div className="sr-top">
          <div className="sr-kicker">✦ CAELINUS SALONU ✦</div>
          <p className="sr-hint">
            Sürükle → etrafına bak · Zemine dokun → oraya yürü · Bir esere
            yaklaş → açılır
          </p>
        </div>

        <div className={`sr-panel${selected ? " is-open" : ""}`}>
          {selected ? (
            <>
              <div
                className="sr-panel-glyph"
                style={{ color: selected.color }}
              >
                {selected.glyph}
              </div>
              <div className="sr-panel-name">{selected.label}</div>
              <div className="sr-panel-tagline">{selected.tagline}</div>
              <JourneyLink
                href={selected.href}
                color={selected.color}
                className="sr-enter"
              >
                Bu dünyaya gir →
              </JourneyLink>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

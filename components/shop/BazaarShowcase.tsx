"use client";

/**
 * BazaarShowcase — Bazaar girişinin keşif şeridi.
 *
 * Ana sahne videosu (look.mp4) artık shop'un tam-sayfa arka planı; bu
 * blok onun üzerinde sade bir keşif katmanı sunar: 12 burç rozeti her
 * birinin ürün/hikâye sayfasına, "Koleksiyonu Keşfet" burç koleksiyonuna
 * götürür.
 */

import Link from "next/link";
import { productsExtended } from "@/data/products";
import { ZODIAC_LABEL, type Zodiac } from "@/lib/frequency";

const SIGNS = productsExtended.filter(
  (p) => p.category === "bikini" && p.zodiac,
);

export default function BazaarShowcase() {
  return (
    <section className="bz-show">
      <Link href="/universe/shop/burclar" className="bz-show-cta">
        Burç Koleksiyonunu Keşfet →
      </Link>

      <div className="bz-show-signs" aria-label="Burçlar">
        {SIGNS.map((p) => {
          const z = p.zodiac as Zodiac;
          const l = ZODIAC_LABEL[z];
          return (
            <Link
              key={p.id}
              href={`/universe/shop/urun/${p.id}`}
              className="bz-show-sign"
              title={`${l.tr} — ${p.frequency ?? ""}`}
              prefetch={false}
            >
              <span className="bz-show-sign-glyph">{l.symbol}</span>
              <span className="bz-show-sign-name">{l.tr}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

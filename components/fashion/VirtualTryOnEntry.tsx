"use client";

/**
 * VirtualTryOnEntry — Moda AI'dan Mirror Gate'in sanal deneme (try-on)
 * akışına köprü. Kullanıcıyı avatar/ayna deneyimine yönlendirir ve istersen
 * Moda AI'dan "ne deneyeyim?" rehberliği ister.
 */

import Link from "next/link";

type Props = {
  onAsk: (text: string) => void;
};

export default function VirtualTryOnEntry({ onAsk }: Props) {
  return (
    <div className="moda-card moda-tryon">
      <div className="moda-card-head">
        <span className="moda-card-glyph" aria-hidden="true">
          🪞
        </span>
        <div>
          <p className="moda-card-kicker">SANAL DENEME</p>
          <h3 className="moda-card-title">Aynada dene</h3>
        </div>
      </div>

      <p className="moda-tryon-text">
        Seçtiğin frekansı avatarının üzerinde gör. Önce Moda AI sana ne
        deneyeceğini fısıldasın, sonra aynaya geç.
      </p>

      <div className="moda-tryon-actions">
        <button
          type="button"
          className="moda-card-cta"
          onClick={() =>
            onAsk(
              "Avatarımda denemek için bana 3 parça öner — bugünkü enerjime ve frekansıma göre. Kısa bir deneme listesi gibi.",
            )
          }
        >
          Ne deneyeyim?
        </button>
        <Link href="/universe/shop/avatar" className="moda-tryon-link">
          Aynaya Gir →
        </Link>
      </div>
    </div>
  );
}

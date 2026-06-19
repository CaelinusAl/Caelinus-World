/**
 * SANRI · Kod Okuma — üst bilinç katmanı.
 *
 * Bu uç Sanri tarafında Bearer JWT + premium ister (D2: sonraki faz).
 * İlk sürümde premium/Bearer köprüsü hazır olana dek kapı bildirimi gösterilir.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { resolveTier } from "@/lib/district/access.server";
import "../sanri.css";

export const metadata: Metadata = {
  title: "Kod Okuma — SANRI · Caelinus",
  description: "Üst bilinç katmanı: kodun ardındaki anlamı oku.",
};

export default async function SanriKodOkumaPage() {
  const tier = await resolveTier();
  const isGuest = tier === "guest";

  return (
    <main className="sanri-page">
      <div className="sanri-bg" aria-hidden="true">
        <div className="sanri-moon" />
        <div className="sanri-mist" />
      </div>

      <div className="sanri-shell">
        <header className="sanri-hero">
          <p className="sanri-kicker">SANRI · KOD OKUMA</p>
          <h1 className="sanri-title">Kod Okuma</h1>
          <p className="sanri-lede">Üst bilinç katmanı — kodun ardındaki anlam.</p>
        </header>

        <section className="sanri-section">
          <div className="sanri-gate">
            <div className="sanri-gate-glyph" aria-hidden="true">🜂</div>
            <h2 className="sanri-gate-title">Premium eşik</h2>
            <p className="sanri-gate-sub">
              {isGuest
                ? "Kod Okuma premium bir bilinç katmanıdır. Önce hesabınla giriş yap; premium köprüsü yakında açılıyor."
                : "Kod Okuma premium bir bilinç katmanıdır. Güvenli premium köprüsü (Bearer) yakında açılıyor — kısa süre içinde burada."}
            </p>
            {isGuest && (
              <Link href="/atelier/giris?next=/universe/sanri/kod-okuma" className="sanri-gate-cta">
                Hesabına Gir
              </Link>
            )}
          </div>
        </section>

        <div className="sanri-foot">
          <Link href="/universe/sanri" className="sanri-back">← Tapınağa Dön</Link>
          <span className="sanri-whisper">Kod, görünenin altındaki dildir.</span>
        </div>
      </div>
    </main>
  );
}

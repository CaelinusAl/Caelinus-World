"use client";

/**
 * /universe/shop/burclar — Burç Koleksiyonu (yaşayan deneyim alanı).
 *
 * 12 burç, 12 frekans. Kartlar fareye göre 3B eğilir ve element renginde
 * parlar; tıklayınca ürünün hikâyesine (PDP) journey-dalışıyla geçilir.
 * Global ışık (shop = altın) ve parallax otomatik aktif.
 */

import ZodiacCollection from "@/components/shop/ZodiacCollection";
import JourneyLink from "@/components/journey/JourneyLink";

export default function ZodiacCollectionPage() {
  return (
    <main className="zc-page">
      <header className="zc-head">
        <div className="zc-kicker">✦ CAELINUS · BURÇ KOLEKSİYONU ✦</div>
        <h1 className="zc-title">Frekansını giy, burcunu yaşa.</h1>
        <p className="zc-sub">
          On iki burç, on iki frekans. Üstüne gel → kart sana dönsün; dokun →
          hikâyesine gir.
        </p>
      </header>

      <ZodiacCollection />

      <div className="zc-page-foot">
        <JourneyLink href="/universe/shop" color="#f5d486" className="zc-back">
          ← Shop&apos;a dön
        </JourneyLink>
      </div>
    </main>
  );
}

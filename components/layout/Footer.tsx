"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Tam-ekran immersive 3B sahneler: kökleri `position: fixed/absolute` olduğu
// için içerik normal akışta 0 yükseklik kaplar; global footer akışta hemen
// onların ardına düşüp sayfanın EN ÜSTÜNE çöker (TopBar'ın üstüne biner).
// Scroll'suz tek-ekran sahneler olduğu için footer'ın oturacağı bir "dip"
// yok — ana sayfa ("/") gibi bu sayfalarda da footer gösterilmez.
//   /universe            → CaelinusUniverseScene (ana meydan)
//   /universe/dunya      → .dw-root (Dünya sahnesi)
//   /universe/gaia/dunya → .sr-page (Gaia Dünya)
//   /universe/gaia/sahne → .gsahne-root (Gaia sahnesi)
//   /showroom            → .sr-page (5D salon)
//   /vr                  → .vr-gate (VR kapısı)
const HIDDEN_PATHS = [
  "/",
  "/universe",
  "/universe/dunya",
  "/universe/gaia/dunya",
  "/universe/gaia/sahne",
  "/showroom",
  "/vr",
];

export default function Footer() {
  const pathname = usePathname() ?? "/";

  if (HIDDEN_PATHS.includes(pathname)) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="cae-footer" aria-label="Caelinus footer">
      <div className="cae-footer-mark">✦ CAELINUS UNIVERSE ✦</div>
      <p className="cae-footer-whisper">
        Frekansını giy, evrenle dans et. — Wear your frequency, dance with the universe.
      </p>
      <div className="cae-footer-meta">
        <Link href="/universe">Universe</Link>
        <Link href="/universe/shop">Shop</Link>
        <Link href="/atelier">Atelier</Link>
        <Link href="/manifesto">Manifesto</Link>
      </div>
      <div className="cae-footer-legal">
        <Link href="/gizlilik">Gizlilik &amp; KVKK</Link>
        <Link href="/cerez-politikasi">Çerez Politikası</Link>
        <Link href="/iletisim">İletişim</Link>
        <span>© {year} Caelinus</span>
      </div>
    </footer>
  );
}

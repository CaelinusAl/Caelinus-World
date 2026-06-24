/**
 * template.tsx — App Router'da layout.tsx'in AKSİNE her sayfa geçişinde
 * yeniden mount edilen sarmalayıcı.
 *
 * layout.tsx kalıcı çerçeveyi tutar (WorldBackdrop/WebGL canvas, TopBar,
 * Footer) ve geçişlerde KORUNUR — canvas remount olmaz, context kaybolmaz.
 * template.tsx ise her route'ta yeniden çalışır → sayfa-giriş animasyonunu
 * ve route-atmosfer handshake'ini buraya bağlarız (Bécane mimarisi).
 *
 * Görsel mantık client tarafında (PageTransition); bu dosya ince kalır.
 */

import PageTransition from "@/components/transition/PageTransition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

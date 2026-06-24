"use client";

/**
 * PageTransition — Bécane tarzı "kalıcı canvas, geçişli içerik".
 *
 * app/template.tsx HER gezinmede remount olduğu için bu sarmalayıcı da
 * her sayfada yeniden mount olur → `.page-transition` CSS giriş animasyonu
 * otomatik replay eder (AnimatePresence/Framer Motion gerekmez, 0KB ek).
 *
 * Aynı mount'ta route atmosferini world store'a + `--atmosphere-tint`
 * CSS değişkenine yazar (1.3 handshake). Canvas kalıcıdır; yalnızca
 * içerik + atmosfer değişir. prefers-reduced-motion CSS'te ele alınır.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useWorldStore } from "@/lib/world/store";
import { atmosphereForPath, ATMOSPHERE_TINT } from "@/lib/world/config";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const setAtmosphere = useWorldStore((s) => s.setAtmosphere);

  useEffect(() => {
    const atmo = atmosphereForPath(pathname ?? "/");
    setAtmosphere(atmo);
    // Kalıcı canvas/CSS katmanının okuduğu tek kaynak: :root değişkeni.
    document.documentElement.style.setProperty(
      "--atmosphere-tint",
      ATMOSPHERE_TINT[atmo],
    );
  }, [pathname, setAtmosphere]);

  return <div className="page-transition">{children}</div>;
}

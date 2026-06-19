import type { ReactNode } from "react";

import DwellTracker from "./_components/DwellTracker";

/**
 * Gaia sahne route layout'u — yalnız dwell telemetrisini mount etmek için.
 * Sahne dosyaları (page.tsx / GaiaScene.tsx) DEĞİŞTİRİLMEDEN, telemetri bu
 * layout üzerinden eklenir. Next.js bu layout'u sadece /universe/gaia/sahne'ye uygular.
 *
 * variant="baseline": mevcut Gaia (mini-yolculuk öncesi) ölçümü.
 * Mini-yolculuk (gölge→kalp→portal) eklenince variant "mini-journey" olacak.
 */
export default function GaiaSahneLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DwellTracker scene="gaia" variant="baseline" />
    </>
  );
}

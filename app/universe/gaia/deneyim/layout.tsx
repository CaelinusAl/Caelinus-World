import type { ReactNode } from "react";

import DwellTracker from "../sahne/_components/DwellTracker";

/**
 * Gaia Experience (Ultra) route layout'u — dwell telemetrisini mount eder.
 * variant="experience" → baseline (/sahne) ile A/B karşılaştırması.
 * Mevcut /sahne dosyaları DEĞİŞTİRİLMEZ; DwellTracker yalnız import edilir.
 */
export default function GaiaDeneyimLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DwellTracker scene="gaia" variant="experience" />
    </>
  );
}

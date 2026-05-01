import type { Metadata } from "next";

import { CinemaCTA, NebulaPortal, StageHero } from "@/app/_stage";
import { absoluteUrl } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";

/**
 * Cinematic 404 — Caelinus tonunda. Yanlış URL'e düşen ziyaretçiyi
 * "kayıp frekans" metaforu ile karşılayıp ana sayfaya çeker.
 *
 * Layout (TopBar + Footer) bu sayfayı sarar; biz sadece body'yi
 * dolduruyoruz. metadataBase layout'tan miras alınır, ama burada
 * 404'e özel bir başlık/description vererek yatırımcı linki yanlış
 * paylaşılırsa bile görünüm temiz.
 */

const T = {
  tr: {
    eyebrow: "0 Hz · sinyal yok",
    title: "Bu frekans evrenimizde değil",
    lead: "Aradığın sayfa kozmik haritada işaretli değil. Caelinus ana portalına dön — frekansını orada bul.",
    cta: "Ana portala dön",
  },
  en: {
    eyebrow: "0 Hz · no signal",
    title: "This frequency is off-grid",
    lead: "The page you're looking for isn't on the cosmic map. Return to the Caelinus portal — your frequency is waiting.",
    cta: "Return to portal",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = T[locale];
  return {
    title: locale === "tr" ? "Sayfa bulunamadı" : "Page not found",
    description: copy.lead,
    robots: { index: false, follow: false },
    alternates: { canonical: absoluteUrl(locale, "/") },
  };
}

export default async function NotFound() {
  const locale = await getLocale();
  const copy = T[locale];

  return (
    <main className="not-found-shell">
      <StageHero
        tone="magenta"
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
        portalSlot={
          <NebulaPortal size={220} tone="magenta" pulse>
            <span
              aria-hidden="true"
              style={{
                fontSize: 96,
                color: "rgba(245, 252, 255, 0.92)",
                textShadow: "0 0 40px rgba(225, 130, 255, 0.5)",
                lineHeight: 1,
                fontFamily:
                  "Georgia, 'Cormorant Garamond', 'Times New Roman', serif",
              }}
            >
              ⌖
            </span>
          </NebulaPortal>
        }
      >
        <div className="not-found-cta-row">
          <CinemaCTA href="/" variant="primary" tone="magenta" trailingGlyph="→">
            {copy.cta}
          </CinemaCTA>
        </div>
      </StageHero>
    </main>
  );
}

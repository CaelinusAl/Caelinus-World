import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Caelinus tipografi (Bible §3): zarif serif başlık + temiz sans gövde.
// Self-host edilir; CSS değişkenleriyle tokens.css'e bağlanır.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";
import MemberSyncBridge from "@/components/members/MemberSyncBridge";
import WorldBackdrop from "@/components/world/WorldBackdrop";
import ResonanceBridge from "@/components/world/ResonanceBridge";
import GlobalAtmosphere from "@/components/experience/GlobalAtmosphere";
import JourneyProvider from "@/components/journey/JourneyProvider";
import { absoluteUrl, htmlLang, type Locale } from "@/lib/i18n/locale";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import { buildOrganization } from "@/lib/seo/jsonld";

const COPY = {
  tr: {
    title: "Caelinus — Frekansını Giy",
    titleTemplate: "%s · Caelinus",
    description:
      "Caelinus, modayı, toprağı ve bilinci tek bir kozmik portalda buluşturan bir frekans evrenidir. Frekansını giy, evrenle dans et.",
    ogDescription:
      "Modayı, toprağı ve bilinci aynı dokuda buluşturan kozmik frekans evreni.",
    ogImageAlt: "Caelinus Universe",
  },
  en: {
    title: "Caelinus — Wear Your Frequency",
    titleTemplate: "%s · Caelinus",
    description:
      "Caelinus is a frequency universe weaving fashion, earth and consciousness into a single cosmic portal. Wear your frequency, dance with the cosmos.",
    ogDescription:
      "A cosmic frequency universe weaving fashion, earth and consciousness.",
    ogImageAlt: "Caelinus Universe",
  },
} as const satisfies Record<Locale, Record<string, string>>;

const KEYWORDS = [
  "Caelinus",
  "frekans modası",
  "Solfeggio",
  "kozmik moda",
  "bilinçli moda",
  "Gaia",
  "konuşan bitkiler",
  "AI moda",
  "frequency fashion",
  "consciousness design",
  "zodiac fashion",
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = COPY[locale];
  const ogImage = "/universe/caelinus-universe.jpg";

  return {
    metadataBase: new URL(absoluteUrl(locale, "/")),
    title: {
      default: copy.title,
      template: copy.titleTemplate,
    },
    description: copy.description,
    applicationName: "Caelinus Universe",
    keywords: KEYWORDS,
    authors: [{ name: "Caelinus" }],
    creator: "Caelinus",
    publisher: "Caelinus",
    openGraph: {
      type: "website",
      siteName: "Caelinus Universe",
      title: copy.title,
      description: copy.ogDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: copy.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.ogDescription,
      images: [ogImage],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "fashion",
    ...buildLocaleMetadata(locale, "/"),
  };
}

export const viewport: Viewport = {
  themeColor: "#03060f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const orgNode = buildOrganization({ locale });
  return (
    <html lang={htmlLang(locale)} className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <JsonLd nodes={orgNode} />
        <MemberSyncBridge />
        <ResonanceBridge />
        <WorldBackdrop />
        <GlobalAtmosphere />
        <JourneyProvider>
          <TopBar />
          {children}
          <Footer />
        </JourneyProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://caelinus.universe";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Caelinus — Wear Your Frequency",
    template: "%s · Caelinus",
  },
  description:
    "Caelinus, modayı, toprağı ve bilinci tek bir kozmik portalda buluşturan bir frekans evrenidir. Frekansını giy, evrenle dans et.",
  applicationName: "Caelinus Universe",
  keywords: [
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
  ],
  authors: [{ name: "Caelinus" }],
  creator: "Caelinus",
  publisher: "Caelinus",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "Caelinus Universe",
    title: "Caelinus — Wear Your Frequency",
    description:
      "Modayı, toprağı ve bilinci aynı dokuda buluşturan kozmik frekans evreni.",
    images: [
      {
        url: "/universe/caelinus-universe.jpg",
        width: 1200,
        height: 630,
        alt: "Caelinus Universe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caelinus — Wear Your Frequency",
    description:
      "Modayı, toprağı ve bilinci aynı dokuda buluşturan kozmik frekans evreni.",
    images: ["/universe/caelinus-universe.jpg"],
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
  alternates: {
    canonical: SITE_URL,
    languages: {
      "tr-TR": "/",
      "en-US": "/?lang=en",
    },
  },
  category: "fashion",
};

export const viewport: Viewport = {
  themeColor: "#03060f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <TopBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

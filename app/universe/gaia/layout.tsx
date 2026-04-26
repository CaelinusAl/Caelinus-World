import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaia's Garden — Toprak Ana",
  description:
    "Konuşan bitkiler, Türkiye toprak haritası, üretici ağı ve Caelinus AI tarım danışmanı. Gaia'nın yaşayan ekosistemi.",
  openGraph: {
    title: "Gaia's Garden — Caelinus",
    description:
      "Living frequency map of the soil. Plants that speak. Producers that connect.",
    type: "website",
    images: [
      {
        url: "/universe/gaia-garden.png",
        width: 1200,
        height: 630,
        alt: "Gaia's Garden",
      },
    ],
  },
};

export default function GaiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Universe",
  description:
    "Caelinus Universe — kozmik portal. Gaia's Garden, Caelinus Shop, Play, Archive, Designers ve Cosmos kapılarını seç.",
  openGraph: {
    title: "Caelinus Universe — Choose Your Dimension",
    description:
      "Six portals to the cosmic consciousness platform: Gaia, Shop, Play, Archive, Designers, Cosmos.",
    type: "website",
    images: [
      {
        url: "/universe/caelinus-universe.jpg",
        width: 1200,
        height: 630,
        alt: "Caelinus Universe Portals",
      },
    ],
  },
};

export default function UniverseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

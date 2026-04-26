import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop — Frekans Mağazası",
  description:
    "Caelinus Shop. 12 burç, Solfeggio frekansları ve şiirsel hikâyelerle dokunmuş kozmik moda. AI avatarınla dene, frekansını giy.",
  openGraph: {
    title: "Caelinus Shop — Wear Your Frequency",
    description:
      "Try-on with your cosmic avatar. 12 zodiac collections tuned to Solfeggio frequencies.",
    type: "website",
    images: [
      {
        url: "/play/posters/12-burc-monokini.jpg",
        width: 1200,
        height: 630,
        alt: "Caelinus 12 Zodiac Collection",
      },
    ],
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

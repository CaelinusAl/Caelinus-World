import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frekansını Bul",
  description:
    "Caelinus eşiğine adım at. Doğum tarihin ve niyetin kozmik frekansına dönüşsün — burcun, elementin ve şifa Hz'in ortaya çıksın.",
  openGraph: {
    title: "Caelinus — Frekansını Bul",
    description: "Bir ritüel. Üç adım. Senin frekansın.",
    type: "website",
    images: [
      {
        url: "/universe/caelinus-universe.jpg",
        width: 1200,
        height: 630,
        alt: "Caelinus Onboarding",
      },
    ],
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

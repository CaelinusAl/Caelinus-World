import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Caelinus — Consciousness Design Intelligence",
  description:
    "Caelinus AI; frekansını okur, toprağa, bedene ve bilince çevirir. Bitki, kombin ve kozmik rehberlik için sor.",
  openGraph: {
    title: "Ask Caelinus AI",
    description: "Consciousness Design Intelligence — wear your frequency.",
    type: "website",
  },
};

export default function AiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

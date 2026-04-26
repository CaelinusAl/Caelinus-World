import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cosmos — The Symbolic Universe",
  description:
    "Caelinus Cosmos. 12 burcun sembolik haritası, frekans yolculukları ve kozmik kürasyon.",
  openGraph: {
    title: "Caelinus Cosmos",
    description: "The symbolic universe of fashion and consciousness.",
    type: "website",
  },
};

export default function CosmosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

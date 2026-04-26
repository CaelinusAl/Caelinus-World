import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive — Sacred Design Memory",
  description:
    "Caelinus Archive. Geçmiş koleksiyonlar, kutsal tasarım hafızası ve şiirsel arşiv.",
  openGraph: {
    title: "Caelinus Archive",
    description: "Sacred design memory of the Caelinus universe.",
    type: "website",
  },
};

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

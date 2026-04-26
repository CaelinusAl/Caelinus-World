import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play — Avatar Studio",
  description:
    "Caelinus Play. AI avatar stüdyosu. Frekansını seç, sahne kur, kombin yarat ve evrenle dans et.",
  openGraph: {
    title: "Caelinus Play",
    description: "Avatar studio — design your cosmic look.",
    type: "website",
  },
};

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

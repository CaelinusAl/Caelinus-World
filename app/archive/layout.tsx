import type { Metadata } from "next";

import CodexAmbientAudio from "@/components/archive/book/CodexAmbientAudio";
import { PUBLIC_ORIGINS } from "@/lib/public-domains";

import "./book.css";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGINS.codex),
  title: "Temple of Silence — The Living Caelinus Codex",
  description:
    "The official home of the Living Caelinus Codex: canon, Bibles, Image Vault and Knowledge Graph.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Temple of Silence — The Living Caelinus Codex",
    description: "Enter the living knowledge system of the Caelinus universe.",
    url: "/",
    siteName: "Temple of Silence",
    type: "website",
  },
};

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CodexAmbientAudio />
    </>
  );
}

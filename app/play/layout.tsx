import type { Metadata } from "next";

import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tr = locale === "tr";
  const title = tr ? "Play — Avatar Stüdyosu" : "Play — Avatar Studio";
  const description = tr
    ? "Caelinus Play. AI avatar stüdyosu. Frekansını seç, sahne kur, kombin yarat ve evrenle dans et."
    : "Caelinus Play. An AI avatar studio. Choose your frequency, build the scene, design the look and dance with the cosmos.";

  return {
    title,
    description,
    openGraph: {
      title: tr ? "Caelinus Play" : "Caelinus Play",
      description: tr
        ? "Avatar stüdyosu — kozmik kombinini tasarla."
        : "Avatar studio — design your cosmic look.",
      type: "website",
    },
    ...buildLocaleMetadata(locale, "/play"),
  };
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

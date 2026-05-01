/**
 * Naz Yardımcı — Caelinus Atelier'in açılış imza tasarımcısı
 * (`/atelier/n-yardimci`).
 *
 * Bu route Next.js'in dinamik `[slug]` segment'inden önce eşleşir, bu
 * yüzden DB'ye gitmeden statik landing render edilir. Atelier
 * altyapısı tüm ortamlarda kurulu olmasa bile bu sayfa stabil çalışır.
 *
 * İçerik launch listesinden (`data/atelier-launch.ts`) çekilir; aynı
 * kayıt `/atelier` ana sayfası ve `/atelier/kesfet` dizininde de
 * kullanılır, böylece imza biyografi tek bir kaynaktan beslenir.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findLaunchAtelier } from "@/data/atelier-launch";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

import LaunchAtelierBody from "./LaunchAtelierBody";

const SLUG = "n-yardimci";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const a = findLaunchAtelier(SLUG);
  if (!a) return { title: "Atelier · Caelinus" };
  const tr = locale === "tr";
  const description = (tr ? a.bio_tr : a.bio_en).slice(0, 160);
  return {
    title: `${a.name} · Caelinus Atelier`,
    description,
    openGraph: {
      title: `${a.name} · Caelinus Atelier`,
      description,
      type: "profile",
      images: [a.cover_image_url],
    },
    ...buildLocaleMetadata(locale, `/atelier/${a.slug}`),
  };
}

export default async function NYardimciPage() {
  const atelier = findLaunchAtelier(SLUG);
  if (!atelier) notFound();
  return <LaunchAtelierBody atelier={atelier} />;
}

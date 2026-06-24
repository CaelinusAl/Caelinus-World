import type { Metadata } from "next";

import JsonLd from "@/components/seo/JsonLd";
import { getLocale } from "@/lib/i18n/server";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { buildBreadcrumbList, buildItemList } from "@/lib/seo/jsonld";
import { products } from "@/data/products";

/**
 * Shop SEO — locale-aware metadata + schema.org yapısal veri.
 *
 * Bu bir server component; `page.tsx` ("use client") buradan sarmalanır.
 * Böylece arama motorları için kritik <head> ve JSON-LD bilgisi client
 * bundle'a girmeden, sunucuda render edilir.
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tr = locale === "tr";

  return {
    title: tr
      ? "Caelinus Shop — 12 Burç Kozmik Moda & AI Avatar Deneme"
      : "Caelinus Shop — 12 Zodiac Cosmic Fashion & AI Avatar Try-On",
    description: tr
      ? "Caelinus Shop: 12 burç koleksiyonu, Solfeggio frekansları ve şiirsel hikâyelerle dokunmuş kozmik moda. AI avatarınla aynada dene, frekansını giy, kombinleri keşfet."
      : "Caelinus Shop: 12 zodiac collections, Solfeggio frequencies and poetic stories woven into cosmic fashion. Try on with your AI avatar, wear your frequency, explore looks.",
    keywords: tr
      ? [
          "Caelinus",
          "kozmik moda",
          "burç koleksiyonu",
          "12 burç",
          "AI avatar deneme",
          "sanal kıyafet deneme",
          "Solfeggio frekans",
          "bikini",
          "after beach wear",
          "frekans modası",
        ]
      : [
          "Caelinus",
          "cosmic fashion",
          "zodiac collection",
          "12 zodiac",
          "AI avatar try-on",
          "virtual try-on",
          "Solfeggio frequency",
          "bikini",
          "after beach wear",
          "frequency fashion",
        ],
    openGraph: {
      title: tr
        ? "Caelinus Shop — Frekansını Giy"
        : "Caelinus Shop — Wear Your Frequency",
      description: tr
        ? "12 burç koleksiyonu, Solfeggio frekanslarına akort. Kozmik avatarınla aynada dene."
        : "12 zodiac collections tuned to Solfeggio frequencies. Try-on with your cosmic avatar.",
      type: "website",
      images: [
        {
          url: "/play/posters/12-burc-monokini.jpg",
          width: 1200,
          height: 630,
          alt: tr ? "Caelinus 12 Burç Koleksiyonu" : "Caelinus 12 Zodiac Collection",
        },
      ],
    },
    ...buildLocaleMetadata(locale, "/universe/shop"),
  };
}

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const tr = locale === "tr";

  const crumbs = buildBreadcrumbList(locale, [
    { name: "Caelinus", path: "/" },
    { name: tr ? "Evren" : "Universe", path: "/universe" },
    { name: "Shop", path: "/universe/shop" },
  ]);

  // 12 burç koleksiyonunu arama motorlarına bir ürün listesi olarak sun —
  // her parça kendi PDP'sine (`/universe/shop/urun/<id>`) bağlanır.
  const zodiacList = buildItemList({
    locale,
    path: "/universe/shop",
    name: tr ? "Caelinus 12 Burç Koleksiyonu" : "Caelinus 12 Zodiac Collection",
    items: products
      .filter((p) => p.category === "bikini")
      .map((p) => ({
        name: p.name,
        path: `/universe/shop/urun/${p.id}`,
        image: p.image,
      })),
  });

  return (
    <>
      <JsonLd nodes={[crumbs, zodiacList]} />
      {children}
    </>
  );
}

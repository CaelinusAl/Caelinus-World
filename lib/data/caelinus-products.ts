/**
 * CAELINUS — Ürün adaptörü (Moda AI için).
 *
 * Tek doğru kaynak `data/products.ts`. Burada yeni ürün YAZMIYORUZ;
 * Moda AI'nın system prompt'una gömeceği kompakt katalog bloğunu ve
 * sade ürün özetlerini türetiriz.
 */

import { products } from "@/data/products";
import type { Product } from "@/types/play";
import type { AILang } from "@/lib/ai/types";

export type ProductSummary = {
  id: string;
  name: string;
  category: string;
  price: string;
  frequency?: string;
  story?: string;
  zodiac?: string;
};

const CATEGORY_TR: Record<string, string> = {
  bikini: "Bikini / Mayo",
  pareo: "Pareo",
  bag: "Çanta",
  heels: "Topuklu",
  jewelry: "Takı",
};

export function toProductSummary(p: Product, lang: AILang): ProductSummary {
  return {
    id: p.id,
    name: p.name,
    category: lang === "tr" ? CATEGORY_TR[p.category] ?? p.category : p.category,
    price: p.price,
    frequency: p.frequency,
    story: p.story,
    zodiac: p.zodiac,
  };
}

export function allProductSummaries(lang: AILang): ProductSummary[] {
  return products.map((p) => toProductSummary(p, lang));
}

/** System prompt'a gömülecek kompakt katalog. Her ürün tek satır. */
export function buildProductBlock(lang: AILang): string {
  return products
    .map((p) => {
      const s = toProductSummary(p, lang);
      const freq = s.frequency ? ` · ${s.frequency}` : "";
      const story = s.story ? ` — ${s.story}` : "";
      return `- [${s.category}] ${s.name} (${s.price})${freq}${story}`;
    })
    .join("\n");
}

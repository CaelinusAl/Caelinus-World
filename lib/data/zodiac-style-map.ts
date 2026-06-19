/**
 * CAELINUS — Burç → stil adaptörü (Moda AI için).
 *
 * Tek doğru kaynak `lib/frequency.ts` (burç → frekans/element/arketip/ürün)
 * ve `data/products.ts` (ürün adları). Burada yeni veri YAZMIYORUZ;
 * Moda AI'nın system prompt'una gömeceği "burç stil haritası"nı türetiriz.
 */

import {
  ZODIACS,
  ZODIAC_LABEL,
  ZODIAC_ARCHETYPE,
  FREQUENCY_LABELS,
  ELEMENT_TONE,
  elementOf,
  frequencyOf,
  recommendProductId,
  type Zodiac,
} from "@/lib/frequency";
import { products } from "@/data/products";
import type { AILang } from "@/lib/ai/types";

export type ZodiacStyle = {
  id: Zodiac;
  label: string;
  symbol: string;
  element: string;
  elementColor: string;
  frequency: number;
  freqMeaning: string;
  archetype: string;
  productId: string;
  productName: string;
};

function productName(id: string): string {
  return products.find((p) => p.id === id)?.name ?? id;
}

export function getZodiacStyle(z: Zodiac, lang: AILang): ZodiacStyle {
  const element = elementOf(z);
  const hz = frequencyOf(z);
  const productId = recommendProductId(z);
  return {
    id: z,
    label: ZODIAC_LABEL[z][lang],
    symbol: ZODIAC_LABEL[z].symbol,
    element: ELEMENT_TONE[element].label[lang],
    elementColor: ELEMENT_TONE[element].color,
    frequency: hz,
    freqMeaning: FREQUENCY_LABELS[hz][lang],
    archetype: ZODIAC_ARCHETYPE[z][lang],
    productId,
    productName: productName(productId),
  };
}

export function allZodiacStyles(lang: AILang): ZodiacStyle[] {
  return ZODIACS.map((z) => getZodiacStyle(z, lang));
}

/** System prompt'a gömülecek kompakt burç stil haritası. */
export function buildZodiacStyleBlock(lang: AILang): string {
  return allZodiacStyles(lang)
    .map(
      (s) =>
        `- ${s.symbol} ${s.label} · ${s.element} · ${s.frequency}Hz (${s.freqMeaning}) · ${s.archetype} → ${s.productName}`,
    )
    .join("\n");
}

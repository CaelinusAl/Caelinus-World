/**
 * lib/shop/illusion-tryon.ts
 *
 * Caelinus AI try-on'da kullanılan illüzyon haritalama mantığı —
 * tüm "Caelinus 3D satış sahneleri" (caelinus-ai/try-on, universe/shop,
 * gelecekte stylist preview'ı vb.) bu modülü paylaşır.
 *
 * Cloth simulation YOK — bunun yerine her ürün **enerji** ile
 * eşleşir (zodiac → element, yoksa kategori fallback'i) ve sahne
 * o enerjinin rengiyle nefes alır:
 *
 *   • Avatar aurası bu renge kayar (conic-gradient rim halkası)
 *   • "✦ Bedeninde · {ürün}" tag'i fade-in olur
 *   • Ürün kartı "is-trying" class'ı ile altın halkalanır
 *   • Mood banner ürünün poetik açıklamasını gösterir
 *
 * Kullanım:
 *   const accent = productAccent(product);   // hex string
 *   const mood   = productMood(product);     // poetic line
 *   const label  = product ? product.name : null;
 *
 *   <AvatarScene tryOnAccent={accent} tryOnLabel={label} />
 *
 * Caelinus AI sayfası bu mantığı önceden inline tutuyordu; shop sayfasına
 * port ederken kopyala-yapıştır yerine ortak modüle aldık ki ileride
 * "stylist gives you a look" ya da "designer preview" gibi sahnelerde
 * de aynı dili konuşabilelim.
 */

import type { Product } from "@/types/play";

export type ElementId = "fire" | "water" | "air" | "earth";

/** Klasik astroloji — 12 burç → 4 element. */
export const ZODIAC_TO_ELEMENT: Record<string, ElementId> = {
  aries: "fire",
  leo: "fire",
  sagittarius: "fire",
  taurus: "earth",
  virgo: "earth",
  capricorn: "earth",
  gemini: "air",
  libra: "air",
  aquarius: "air",
  cancer: "water",
  scorpio: "water",
  pisces: "water",
};

/** Element → aura/aksent rengi (luxury tone). */
export const ELEMENT_COLOR: Record<ElementId, string> = {
  fire: "#e87a3d",
  water: "#6ba8c4",
  air: "#cfc8b8",
  earth: "#a87149",
};

/** Element → glyph (UI'da küçük sembol). */
export const ELEMENT_GLYPH: Record<ElementId, string> = {
  fire: "🜂",
  water: "🜄",
  air: "🜁",
  earth: "🜃",
};

/** Zodiac yoksa kategoriye göre fallback rengi. */
export const CATEGORY_FALLBACK_COLOR: Record<string, string> = {
  bikini: "#caa56a",
  pareo: "#6ba8c4",
  bag: "#e8c889",
  heels: "#caa56a",
  jewelry: "#f5d97a",
};

/** Default altın aksent — hiçbir eşleşme yoksa sahne nötr-luxury kalsın. */
export const DEFAULT_ACCENT = "#caa56a";

/**
 * Ürünün **enerji rengi**ni hesaplar.
 * Sıralama: zodiac → element → renk, yoksa kategori fallback'i, yoksa default.
 */
export function productAccent(p: Product | null | undefined): string {
  if (!p) return DEFAULT_ACCENT;
  if (p.zodiac && ZODIAC_TO_ELEMENT[p.zodiac]) {
    return ELEMENT_COLOR[ZODIAC_TO_ELEMENT[p.zodiac]];
  }
  return CATEGORY_FALLBACK_COLOR[p.category] || DEFAULT_ACCENT;
}

/** Ürünün enerji elementini döner (tag/glyph için). null = bilinmiyor. */
export function productElement(
  p: Product | null | undefined,
): ElementId | null {
  if (!p?.zodiac) return null;
  return ZODIAC_TO_ELEMENT[p.zodiac] ?? null;
}

/**
 * Ürünün mood cümlesi — kategori/element ile değişen poetik tek satır.
 *
 * Aynı element içindeki ürünler arasında **deterministik** seçim yapıyor
 * (`p.id.charCodeAt(0)` modulo) — aynı ürün her açılışta aynı cümleyi
 * versin diye.
 */
export function productMood(p: Product | null | undefined): string {
  if (!p) return "Caelinus seni bekliyor.";
  const el = productElement(p);
  if (el) {
    const moods: Record<ElementId, string[]> = {
      fire: [
        "Yangının kıvılcımı şimdi senin omzunda.",
        "Işığın kendisini taşıyorsun.",
        "Cesaretin ipek dokusu.",
      ],
      water: [
        "Bir nehir gibi sarmalıyor seni.",
        "Suyun kıvrımı seninle akıyor.",
        "Ay ışığında bir geçit.",
      ],
      air: [
        "Hafif, ama güçlü — hava gibi.",
        "Bir nefes — ve bedenin değişti.",
        "Düşüncenin uçuşan kumaşı.",
      ],
      earth: [
        "Toprağa kök saldın bu parçada.",
        "Köklerinin seramik dokusu.",
        "Sabrın ipekleşmiş hâli.",
      ],
    };
    const arr = moods[el];
    return arr[p.id.charCodeAt(0) % arr.length];
  }

  const categoryMoods: Record<string, string> = {
    bag: "Evrenin sırrını yanında taşıyorsun.",
    heels: "Adımların ritüel oluyor.",
    jewelry: "Frekansını bedeninde okuyabiliyorsun.",
    pareo: "Ay ışığını giyiniyorsun.",
  };
  return categoryMoods[p.category] || "Caelinus dokunduğunda her parça bir geçit oluyor.";
}

/** Sahne tag etiketi — "Bedeninde · {ürün}" formatı. */
export function productTag(p: Product | null | undefined): string | null {
  return p ? p.name : null;
}

/**
 * Tek seferde sahnenin ihtiyacı olan tüm illüzyon meta'sını döner.
 * Component'lerde tek satırda kullanılır:
 *
 *   const illusion = useMemo(() => buildIllusionState(trying), [trying]);
 *   <AvatarScene tryOnAccent={illusion.accent} tryOnLabel={illusion.tag} />
 */
export type IllusionState = {
  accent: string;
  element: ElementId | null;
  glyph: string | null;
  mood: string;
  tag: string | null;
};

export function buildIllusionState(
  p: Product | null | undefined,
): IllusionState {
  const element = productElement(p);
  return {
    accent: productAccent(p),
    element,
    glyph: element ? ELEMENT_GLYPH[element] : null,
    mood: productMood(p),
    tag: productTag(p),
  };
}

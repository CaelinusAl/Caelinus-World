/**
 * CAELINUS · Stylist Engine
 *
 * Vizyon: "AI ile seçtiğin… Bugün ne giysem, gün/gece kombini,
 *          mağazadaki ürünlerle."
 *
 * Bu motor **tamamen deterministiktir**: aynı girdi her zaman aynı
 * görünümü döndürür. Önemli kural — **ürünler katalog dışından
 * gelmez**: çıktı `data/products.ts` içindeki gerçek SKU id'lerini
 * referans alır. AI iyileştirme katmanı (sonra) yalnız bu listenin
 * üzerine *anlatı* ekleyebilir; ürün ID'leri AI'dan gelmez.
 *
 * `/api/stylist` route'u ve `StylistPanel` aynı motoru paylaşır.
 */

import { products, productsExtended } from "@/data/products";
import type { ProductExtended } from "@/types/play";

/** Hangi günün hangi anı? */
export type StylistSlot = "day" | "night" | "now";

export type StylistInput = {
  slot: StylistSlot;
  /** Burç verilirse o burcun signature bikini'si zorunlu kılınır. */
  zodiac?: string;
  /** Serbest niyet — "denize gidiyorum", "akşam yemeği" gibi.
   *  Şu an yalnızca title/narrative'a renk katar; AI katmanı
   *  geldiğinde semantic match'e de besler. */
  intent?: string;
  /** Saat — `slot === "now"` iken kullanılır. 0..23.
   *  Verilmezse server NaN ile gelir, mood "day"e düşer. */
  hour?: number;
};

export type StylistLookItem = {
  slot: "top" | "bottom" | "bag" | "shoes" | "accessory";
  product: ProductExtended;
  /** Neden seçildi — UI'da küçük rozet olarak gösterilebilir. */
  rationale: string;
};

export type StylistLook = {
  /** Stable id — aynı input aynı id verir; cache + analytics için. */
  id: string;
  title: string;
  narrative: string;
  /** Resolved zaman dilimi — "now" verildiğinde "day" veya "night"a düşer. */
  resolvedSlot: "day" | "night";
  /** Görünümü oluşturan parçalar — sıralı (top → bottom → bag → shoes → accessory). */
  items: StylistLookItem[];
  /** Numerik toplam — `productsExtended.numericPrice` toplamı. */
  totalPrice: number;
  /** Vurgulu Solfeggio frekansı (varsa). */
  signatureFrequency: string | null;
  /** Hangi ürün ID'leri — UI'dan stora aktarılırken hızlı erişim için. */
  productIds: string[];
};

/* ────────────────────────────────────────────────────────────
   KÜRATÖRİYEL HARİTALAR
   ─────────────────────────────────────────────────────────────
   Her slot için kategori bazında "öncelik sıralı" ID listesi.
   Buradaki sıra şu mantığı taşır:
     1) İlk eşleşen + stoğu olan ürün seçilir.
     2) Boşa düşerse aynı kategoride herhangi bir SKU'ya geri
        düşülür (kullanıcının önüne hiçbir zaman boş slot
        çıkmasın diye).
   Listeler products.ts'teki gerçek ID'leri referans alır. Yeni
   ürün geldiğinde (örn. b2/b5 GLB hazır olunca) buraya eklemek
   yeterli. */

const DAY_PICKS = {
  bikini: ["b1", "b3", "b6", "b7", "b9", "b11"], // sıcak/aydınlık burçlar
  pareo: ["pr1", "pr2"], // Golden Nebula Wrap, Gaia Silk Pareo
  bag: ["bg3", "bg2"], // Stardust Mini, Eclipse Tote
  shoes: ["h3"], // Aurora Sandal — flat, gün için
  jewelry: ["j1", "j2"], // Frequency Pendant, Zodiac Chain
} as const;

const NIGHT_PICKS = {
  bikini: ["b8", "b4", "b10", "b12"], // koyu / gece burçları
  pareo: ["pr3"], // Moonlight Drape
  bag: ["bg1", "bg2"], // Cosmos Clutch, Eclipse Tote
  shoes: ["h1", "h2"], // Venus Stiletto, Celestial Mule
  jewelry: ["j4", "j3"], // Crystal Ear Cuff, Moon Ring
} as const;

/** "Şu anki saat" → mood. 06:00–18:00 arası gün, gerisi gece. */
export function resolveSlot(slot: StylistSlot, hour?: number): "day" | "night" {
  if (slot === "day") return "day";
  if (slot === "night") return "night";
  const h = typeof hour === "number" && Number.isFinite(hour) ? hour : NaN;
  if (Number.isNaN(h)) return "day";
  return h >= 6 && h < 18 ? "day" : "night";
}

/** İlk stoklu ürünü bul; yoksa kategoride herhangi birine düş. */
function pickFirstAvailable(
  ids: readonly string[],
  fallbackCategory: ProductExtended["category"],
): ProductExtended | null {
  for (const id of ids) {
    const p = productsExtended.find((x) => x.id === id);
    if (!p) continue;
    const totalStock = Object.values(p.stock).reduce(
      (s, v) => s + (v ?? 0),
      0,
    );
    if (totalStock > 0) return p;
  }
  // Hiçbiri stokta yoksa: aynı kategoride ilk ürün — UI'da en
  // azından bir önerimiz var (out-of-stock rozeti ProductCard
  // tarafında zaten gösteriliyor).
  return (
    productsExtended.find((x) => x.category === fallbackCategory) ?? null
  );
}

/** Belirli bir burç için signature bikini ürünü. */
function pickByZodiac(zodiac: string): ProductExtended | null {
  const match = productsExtended.find(
    (p) => p.category === "bikini" && p.zodiac === zodiac,
  );
  return match ?? null;
}

/* ────────────────────────────────────────────────────────────
   ANLATI YARDIMCILARI
   ───────────────────────────────────────────────────────────── */

const TITLES: Record<"day" | "night", string[]> = {
  day: ["Solstice Drift", "Sun Veil", "Aurora Hour", "Salt & Light"],
  night: ["Night Oracle", "Moonlit Sovereign", "Velvet Eclipse", "Tide of Stars"],
};

const NARRATIVES: Record<"day" | "night", string[]> = {
  day: [
    "Güneşin alnını öpen, deniz ve toprağın aynı frekansta dans ettiği bir öğle.",
    "Hafif kumaşlar, açık ten, deniz tuzunun bıraktığı parlama. Gün senin için yumuşak.",
    "Gökyüzü açık, omuzlarına düşen ışık altın. Yürüyüşün bir ritüel.",
  ],
  night: [
    "Ay'ın altında manyetik, gizem dolu bir gece. Sessizliğin bile bir titreşimi var.",
    "Velvet karanlık, ince stiletto adımlar, parıltıyı tek bir küpede topla.",
    "Yıldızların aktığı saat. Sen sahnedesin, evren izleyici.",
  ],
};

const EN_TITLES: Record<"day" | "night", string[]> = {
  day: ["Solstice Drift", "Sun Veil", "Aurora Hour", "Salt & Light"],
  night: ["Night Oracle", "Moonlit Sovereign", "Velvet Eclipse", "Tide of Stars"],
};

const EN_NARRATIVES: Record<"day" | "night", string[]> = {
  day: [
    "A noon where sun, sea and earth dance on the same frequency.",
    "Light fabrics, salt-bright skin, the soft flare the sun leaves on your shoulders.",
    "Sky open, light gold on your shoulders. Walking is a ritual.",
  ],
  night: [
    "Magnetic and mysterious under the moon. Even silence has a vibration.",
    "Velvet dark, fine stiletto steps, all the shimmer in a single cuff.",
    "The hour of falling stars. You are the stage, the cosmos the audience.",
  ],
};

/** Düz, kararlı bir 32-bit hash (FNV-1a). Aynı stringe aynı sayıyı verir. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/* ────────────────────────────────────────────────────────────
   BUILD LOOK
   ───────────────────────────────────────────────────────────── */

export function buildStylistLook(
  input: StylistInput,
  lang: "tr" | "en" = "tr",
): StylistLook {
  const resolved = resolveSlot(input.slot, input.hour);
  const map = resolved === "day" ? DAY_PICKS : NIGHT_PICKS;

  // Bikini — burç verildiyse signature, yoksa slot'un öncelik listesi.
  const bikini =
    (input.zodiac ? pickByZodiac(input.zodiac) : null) ??
    pickFirstAvailable(map.bikini, "bikini");
  const pareo = pickFirstAvailable(map.pareo, "pareo");
  const bag = pickFirstAvailable(map.bag, "bag");
  const shoes = pickFirstAvailable(map.shoes, "heels");
  const accessory = pickFirstAvailable(map.jewelry, "jewelry");

  const lineup: StylistLookItem[] = [];
  if (bikini) {
    lineup.push({
      slot: "top",
      product: bikini,
      rationale:
        input.zodiac && bikini.zodiac === input.zodiac
          ? lang === "tr"
            ? `${input.zodiac} burcunun signature parçası`
            : `Signature piece for ${input.zodiac}`
          : lang === "tr"
            ? `${resolved === "day" ? "Gün" : "Gece"} için imza siluet`
            : `Signature silhouette for ${resolved}`,
    });
  }
  if (pareo) {
    lineup.push({
      slot: "bottom",
      product: pareo,
      rationale:
        lang === "tr"
          ? resolved === "day"
            ? "Hafif, akışkan örtü"
            : "Drape — gece için ay ışığı"
          : resolved === "day"
            ? "Light, flowing wrap"
            : "Drape — moonlight for the night",
    });
  }
  if (bag) {
    lineup.push({
      slot: "bag",
      product: bag,
      rationale:
        lang === "tr"
          ? resolved === "day"
            ? "Mini siluet, gün boyu eşlikçi"
            : "Clutch — gecenin minimal sırrı"
          : resolved === "day"
            ? "Mini silhouette, all-day companion"
            : "Clutch — the minimal secret of the night",
    });
  }
  if (shoes) {
    lineup.push({
      slot: "shoes",
      product: shoes,
      rationale:
        lang === "tr"
          ? resolved === "day"
            ? "Açık, rahat sandalet"
            : "Stiletto — adımların ritüel"
          : resolved === "day"
            ? "Light, easy sandal"
            : "Stiletto — every step a ritual",
    });
  }
  if (accessory) {
    lineup.push({
      slot: "accessory",
      product: accessory,
      rationale:
        lang === "tr"
          ? "Frekansının taşıyıcısı"
          : "Carrier of your frequency",
    });
  }

  // Anlatı seçimi — input'un FNV hash'iyle deterministik.
  const seed = fnv1a(
    `${input.slot}|${input.zodiac ?? ""}|${input.intent ?? ""}|${input.hour ?? ""}`,
  );
  const titles = lang === "tr" ? TITLES[resolved] : EN_TITLES[resolved];
  const narratives =
    lang === "tr" ? NARRATIVES[resolved] : EN_NARRATIVES[resolved];
  const title = titles[seed % titles.length];
  const narrativeBase = narratives[seed % narratives.length];
  const narrative = input.intent
    ? lang === "tr"
      ? `${narrativeBase} (Niyet: ${input.intent})`
      : `${narrativeBase} (Intent: ${input.intent})`
    : narrativeBase;

  // Sigatür frekans — bikini frekansı varsa o, yoksa accessory.
  const signatureFrequency =
    bikini?.frequency ?? accessory?.frequency ?? null;

  const totalPrice = lineup.reduce(
    (sum, it) => sum + (it.product.numericPrice ?? 0),
    0,
  );

  // Stable id — input + ürün ID'lerinden türeyen kısa hash.
  const productIds = lineup.map((it) => it.product.id);
  const idSeed = fnv1a(`${input.slot}|${productIds.join(",")}`);
  const id = `look_${idSeed.toString(36)}`;

  return {
    id,
    title,
    narrative,
    resolvedSlot: resolved,
    items: lineup,
    totalPrice,
    signatureFrequency,
    productIds,
  };
}

/** Geçerli zodiac değerleri — products.ts'te bikini olarak görülenler. */
export const STYLIST_ZODIACS: readonly string[] = Array.from(
  new Set(
    products
      .filter((p) => p.category === "bikini" && p.zodiac)
      .map((p) => p.zodiac as string),
  ),
);

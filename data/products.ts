import type {
  Product,
  ProductExtended,
  ProductSize,
  OutfitBindingConfig,
} from "../types/play";
import { mergeOutfitBinding } from "@/lib/config/outfit-binding-config";

/* ═══════════════════════════════════════════════════════════════
   GLB OUTFIT BINDING
   ─────────────────────────────────────────────────────────────
   Maps product ID → OutfitBindingConfig.
   Each entry uses a category preset from outfit-binding-config.ts
   and a GLB path under public/models/Meshy_Al/.

   Missing GLBs: taurus (b2), leo (b5), sagittarius (b9), aquarius (b11)
   Missing pareo GLBs: pr1, pr2, pr3
   Add entries here as new GLB files become available.
   ═══════════════════════════════════════════════════════════════ */

const OUTFIT_GLB_MAP: Record<string, OutfitBindingConfig> = {
  // b1: aries — GLB bozuk (zstd-blend, geçerli GLB değil). Düzgün GLB
  //     export edilene kadar önizleme-only. Dosya düzelince bu satırı geri aç:
  //     b1:  mergeOutfitBinding("bikini", "/models/Meshy_Al/aries.glb"),
  // b2: taurus — GLB henuz yok
  b3:  mergeOutfitBinding("bikini", "/models/Meshy_Al/gemini.glb"),
  b4:  mergeOutfitBinding("bikini", "/models/Meshy_Al/cancer.glb"),
  // b5: leo — GLB henuz yok
  b6:  mergeOutfitBinding("bikini", "/models/Meshy_Al/virgo.glb"),
  b7:  mergeOutfitBinding("bikini", "/models/Meshy_Al/libra.glb"),
  b8:  mergeOutfitBinding("bikini", "/models/Meshy_Al/scorpione.glb"),
  // b9: sagittarius — GLB henuz yok
  b10: mergeOutfitBinding("bikini", "/models/Meshy_Al/capricorn.glb"),
  // b11: aquarius — GLB henuz yok
  b12: mergeOutfitBinding("bikini", "/models/Meshy_Al/pices.glb"),
};

/* ═══════════════════════════════════════════════════════════════
   PRODUCT CATALOGUE
   ═══════════════════════════════════════════════════════════════ */

export const products: Product[] = [
  // ═══════════════════════ BIKINI — 12 Burc ═══════════════════════
  { id: "b1",  name: "Aries — Fire Muse",       brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$220", image: "/play/shop/aries-look.jpg",       frequency: "396 Hz", zodiac: "aries",       story: "Atesin ilk kivilcimi. Cesaretin bedene dokunan hali." },
  { id: "b2",  name: "Taurus — Earth Veil",      brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$220", image: "/play/shop/taurus-look.jpg",      frequency: "417 Hz", zodiac: "taurus",      story: "Topragin sabri, ipek gibi. Dokunusun en kadim hali." },
  { id: "b3",  name: "Gemini — Twin Light",      brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$220", image: "/play/shop/gemini-look.jpg",      frequency: "528 Hz", zodiac: "gemini",      story: "Iki yuzlu degil, iki isikli. Dualite bir guc." },
  { id: "b4",  name: "Cancer — Moon Veil",       brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$240", image: "/play/shop/cancer-look.jpg",      frequency: "639 Hz", zodiac: "cancer",      story: "Ay'in yansimasi, annelikin koruyan enerjisi." },
  { id: "b5",  name: "Leo — Solar Queen",        brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$260", image: "/play/shop/leo-look.jpg",         frequency: "741 Hz", zodiac: "leo",         story: "Gunesin tahti sana ait. Parlamak senin dogan." },
  { id: "b6",  name: "Virgo — Pearl Code",       brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$220", image: "/play/shop/virgo-look.jpg",       frequency: "528 Hz", zodiac: "virgo",       story: "Safligin sifresi. Inci gibi zarif, kristal gibi net." },
  { id: "b7",  name: "Libra — Venus Balance",    brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$240", image: "/play/shop/libra-look.jpg",       frequency: "639 Hz", zodiac: "libra",       story: "Dengenin estetigi. Venus'un zarif dokunusu." },
  { id: "b8",  name: "Scorpio — Night Oracle",   brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$260", image: "/play/shop/scorpio-look.jpg",     frequency: "852 Hz", zodiac: "scorpio",     story: "Gecenin derinliginde sakli guc. Gizemli, manyetik." },
  { id: "b9",  name: "Sagittarius — Golden Arrow", brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$240", image: "/play/shop/sagittarius-look.jpg", frequency: "741 Hz", zodiac: "sagittarius", story: "Altin okun izinde ozgurluk. Macera ruhunun bedene yansimasi." },
  { id: "b10", name: "Capricorn — Stone Siren",  brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$260", image: "/play/shop/capricorn-look.jpg",   frequency: "963 Hz", zodiac: "capricorn",   story: "Dagin zirvesindeki siren. Kararliligin luks hali." },
  { id: "b11", name: "Aquarius — Star Current",  brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$240", image: "/play/shop/aquarius-look.jpg",    frequency: "963 Hz", zodiac: "aquarius",    story: "Yildiz akintisinda yuzmek. Gelecegin frekansi." },
  { id: "b12", name: "Pisces — Dream Tide",      brand: "Caelinus", designer: "Celine River", category: "bikini", price: "$220", image: "/play/shop/pisces-look.jpg",      frequency: "852 Hz", zodiac: "pisces",      story: "Ruya dalgasinda suzulmek. Suyun en derin sarkisi." },

  // ═══════════════════════ PAREO ═══════════════════════
  { id: "pr1", name: "Golden Nebula Wrap",  brand: "Caelinus", designer: "Celine River", category: "pareo", price: "$120", image: "/play/shop/leo-look.jpg",    frequency: "432 Hz", story: "Nebula gibi sarmalayan, ruzgarla dans eden kumas." },
  { id: "pr2", name: "Gaia Silk Pareo",     brand: "Caelinus", designer: "Celine River", category: "pareo", price: "$140", image: "/play/shop/taurus-look.jpg", frequency: "528 Hz", story: "Topragin ipek hali. Gaia'nin dokunusu bedeninizde." },
  { id: "pr3", name: "Moonlight Drape",     brand: "Caelinus", designer: "Celine River", category: "pareo", price: "$130", image: "/play/shop/pisces-look.jpg", frequency: "639 Hz", story: "Ay isigini giyinmek. Yumusak, akiskan, kutsal." },

  // ═══════════════════════ BAG ═══════════════════════
  { id: "bg1", name: "Cosmos Clutch",  brand: "Caelinus", designer: "Celine River", category: "bag", price: "$180", image: "/play/shop/scorpio-look.jpg",   frequency: "963 Hz", story: "Evrenin sirrini tasiyan el cantasi." },
  { id: "bg2", name: "Eclipse Tote",   brand: "Caelinus", designer: "Celine River", category: "bag", price: "$280", image: "/play/shop/capricorn-look.jpg", frequency: "741 Hz", story: "Gunes tutulmasinin golgesinde dogan zarif siluet." },
  { id: "bg3", name: "Stardust Mini",  brand: "Caelinus", designer: "Celine River", category: "bag", price: "$160", image: "/play/shop/gemini-look.jpg",    frequency: "528 Hz", story: "Yildiz tozuyla kapli minimalist siklik." },

  // ═══════════════════════ HEELS ═══════════════════════
  { id: "h1", name: "Venus Stiletto",   brand: "Caelinus", designer: "Celine River", category: "heels", price: "$320", image: "/play/shop/libra-look.jpg",    frequency: "639 Hz", story: "Venus'un yeryuzundeki yansimasi. Adimlarin rituel." },
  { id: "h2", name: "Celestial Mule",   brand: "Caelinus", designer: "Celine River", category: "heels", price: "$240", image: "/play/shop/virgo-look.jpg",    frequency: "852 Hz", story: "Goksel yuruyus. Her adim bir meditasyon." },
  { id: "h3", name: "Aurora Sandal",    brand: "Caelinus", designer: "Celine River", category: "heels", price: "$200", image: "/play/shop/aquarius-look.jpg", frequency: "396 Hz", story: "Kuzey isiklarinin dans ettigi zarif kayislar." },

  // ═══════════════════════ JEWELRY ═══════════════════════
  { id: "j1", name: "Frequency Pendant", brand: "Caelinus", designer: "Celine River", category: "jewelry", price: "$90",  image: "/play/shop/cancer-look.jpg",       frequency: "432 Hz", story: "Frekansini boynunda tasi. Titresimin senin." },
  { id: "j2", name: "Zodiac Chain",      brand: "Caelinus", designer: "Celine River", category: "jewelry", price: "$110", image: "/play/shop/sagittarius-look.jpg", frequency: "528 Hz", story: "12 burcun enerjisi tek bir zincirde bulusuyor." },
  { id: "j3", name: "Moon Ring",         brand: "Caelinus", designer: "Celine River", category: "jewelry", price: "$75",  image: "/play/shop/cancer-look.jpg",       frequency: "639 Hz", story: "Ay'in parmigindaki yansimasi. Evrenle basin." },
  { id: "j4", name: "Crystal Ear Cuff",  brand: "Caelinus", designer: "Celine River", category: "jewelry", price: "$65",  image: "/play/shop/aries-look.jpg",        frequency: "963 Hz", story: "Kristalin frekansi kulaginda. Evreni duy." },
];

/* ═══════════════════════════════════════════════════════════════
   EXTENDED PRODUCT MAP
   ═══════════════════════════════════════════════════════════════ */

function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, "")) || 0;
}

// Caelinus mayo/bikini koleksiyonu iki bedende: XS-S ve M-L.
const ALL_SIZES: ProductSize[] = ["XS-S", "M-L"];

function defaultStock(): Partial<Record<ProductSize, number>> {
  return { "XS-S": 14, "M-L": 14 };
}

export const productsExtended: ProductExtended[] = products.map((p) => ({
  ...p,
  sizes: ALL_SIZES,
  stock: defaultStock(),
  numericPrice: parsePrice(p.price),
  outfitGlb: OUTFIT_GLB_MAP[p.id],
}));

export const SHOP_CATEGORY_ORDER: Product["category"][] = [
  "bikini",
  "pareo",
  "bag",
  "heels",
  "jewelry",
];

export const ZODIAC_PRODUCT_ORDER = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export function getProductSortRank(product: Product): number {
  const categoryRank = SHOP_CATEGORY_ORDER.indexOf(product.category);
  const safeCategoryRank =
    categoryRank === -1 ? SHOP_CATEGORY_ORDER.length : categoryRank;
  const zodiacRank = product.zodiac
    ? ZODIAC_PRODUCT_ORDER.indexOf(
        product.zodiac as (typeof ZODIAC_PRODUCT_ORDER)[number],
      )
    : -1;

  return safeCategoryRank * 100 + (zodiacRank === -1 ? 50 : zodiacRank);
}

export function sortProductsForAvatar<T extends Product>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rank = getProductSortRank(a) - getProductSortRank(b);
    if (rank !== 0) return rank;
    return a.id.localeCompare(b.id);
  });
}

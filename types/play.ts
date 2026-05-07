export type SceneId = "beach" | "coffee" | "night" | "resort";

export type ArchetypeId =
  | "light"
  | "golden"
  | "dark"
  | "cosmic"
  | "minimal"
  | "athletic"
  | "curvy";

export type ShopCategory =
  | "all"
  | "bikini"
  | "pareo"
  | "bag"
  | "heels"
  | "jewelry";

export type Scene = {
  id: SceneId;
  label: string;
  sub: string;
  image: string;
  description: string;
};

export type Archetype = {
  id: ArchetypeId;
  label: string;
  tone: string;
  glow: string;
};

export type ShowroomLook = {
  id: string;
  title: string;
  brand: string;
  designer: string;
  price: string;
  image: string;
  mood: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  designer: string;
  category: Exclude<ShopCategory, "all">;
  price: string;
  image: string;
  frequency?: string;
  story?: string;
  zodiac?: string;
};

export type OutfitSlot = "top" | "bottom" | "bag" | "shoes" | "accessory";

export type ProductSize = "XS" | "S" | "M" | "L" | "XL";

/* ═══════════════════════════════════════════
   Runtime GLB Outfit Binding
   ═══════════════════════════════════════════ */

/** Known skeleton targets on the avatar — safe fallback chain */
export type BindingTarget =
  | "hips"
  | "spine"
  | "spine1"
  | "chest"
  | "head"
  | "leftHand"
  | "rightHand"
  | "leftFoot"
  | "rightFoot"
  | string;

/** Per-product config for a GLB-based garment loaded at runtime. */
export type OutfitBindingConfig = {
  /** Path to the outfit GLB, e.g. "/models/outfits/bikini-aries.glb" */
  glbUrl: string;
  /** Primary avatar bone to attach to — outfit follows this bone */
  bindingTarget: BindingTarget;
  /** Fallback bones if primary not found (tried in order) */
  fallbackTargets?: BindingTarget[];
  /** Position offset relative to attach point */
  position: [number, number, number];
  /** Euler rotation offset (radians) */
  rotation: [number, number, number];
  /** Uniform or per-axis scale */
  scale: number | [number, number, number];
  /** Small Z push to reduce body clipping (added to outfit meshes' polygonOffset) */
  zOffset: number;
  /** Copy avatar bone transforms to outfit bones each frame */
  syncAnimation: boolean;

  /** Scene layer ID — determines render order and masking behavior. */
  layer?: import("./scene-layers").SceneLayerId;

  /** Avatar mesh parts to HIDE when this outfit is worn.
   *  Values are mesh-name substrings (case-insensitive). */
  hiddenMeshParts?: string[];

  /**
   * Avatar boyuna göre garment'ın hedef yüksekliği (0–1).
   * OutfitBindingLayer auto-scale'i `garmentScale = avatarH * targetFraction / worldMax`
   * formülüyle hesaplar. Değer kategoriye göre değişir:
   *   • bikini one-piece → 0.42 (gövde belden hipe)
   *   • bikini_top       → 0.18 (sadece bust)
   *   • bikini_bottom    → 0.18 (sadece kalça)
   *   • pareo            → 0.55 (boydan diz altına)
   *   • bag              → 0.18 (kalça yanı küçük obje)
   *   • heels            → 0.10 (ayak)
   *   • necklace         → 0.12 (boyun)
   *   • earring          → 0.05 (kulak)
   *   • bracelet         → 0.06 (bilek)
   *
   * Belirtilmezse OutfitBindingLayer 0.40 default'unu kullanır.
   * Ayrıca **her zaman** uygulanır (eski "ratio out of bounds" guard'ı
   * kaldırıldı — bikini ratio 1.2 olduğunda guard tetiklenmiyordu ve
   * garment 1:1 native scale'inde dev görünüyordu).
   */
  targetFraction?: number;

  /** Material overrides applied after GLB load (future) */
  materialOverrides?: import("./scene-layers").WearableMaterialOverride;
};

export type ProductExtended = Product & {
  sizes: ProductSize[];
  stock: Partial<Record<ProductSize, number>>;
  numericPrice: number;
  color?: string;
  /** Runtime GLB outfit binding */
  outfitGlb?: OutfitBindingConfig;
};

export type TryOnContext = {
  selectedStage: SceneId;
  avatarPreset: string;
  tryOnUsed: boolean;
};

export type CartItemExtended = {
  product: ProductExtended;
  size: ProductSize;
  qty: number;
  tryOnContext?: TryOnContext;
};

export type OrderItem = {
  productId: string;
  name: string;
  size: ProductSize;
  qty: number;
  unitPrice: number;
  tryOnContext?: TryOnContext;
};

export type OrderMetadata = {
  tryOnUsageCount: number;
  stagesUsed: SceneId[];
  avatarPreset: string;
};

export type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  address: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
  metadata?: OrderMetadata;
};

export type OutfitItem = {
  slot: OutfitSlot;
  product: Product;
};

export type WeeklyLook = {
  id: string;
  title: string;
  frequency: string;
  mood: string;
  items: string[];
  image: string;
};

export type OutfitId =
  | "none"
  | "virgo"
  | "taurus"
  | "aries"
  | "leo"
  | "scorpio"
  | "gemini"
  | "cancer"
  | "capricorn"
  | "sagittarius"
  | "pisces"
  | "libra"
  | "aquarius";
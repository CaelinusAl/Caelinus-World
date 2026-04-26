import { create } from "zustand";
import type {
  Product,
  ProductExtended,
  OutfitSlot,
  OutfitBindingConfig,
  ShopCategory,
} from "@/types/play";
import type { OutfitBindingStatus } from "@/components/shop/scene/OutfitBindingLayer";
import { productsExtended } from "@/data/products";

type DressedSlots = Partial<Record<OutfitSlot, Product>>;

const CATEGORY_TO_SLOT: Record<Exclude<ShopCategory, "all">, OutfitSlot> = {
  bikini: "top",
  pareo: "bottom",
  bag: "bag",
  heels: "shoes",
  jewelry: "accessory",
};

type WardrobeState = {
  tryOnProduct: ProductExtended | null;
  dressedSlots: DressedSlots;
  outfitStatus: OutfitBindingStatus | null;
  catwalkOn: boolean;
  debugBindings: boolean;
  tunerOverride: OutfitBindingConfig | null;
  showTuner: boolean;

  setTryOnProduct: (product: ProductExtended | null) => void;
  dressProduct: (product: Product) => void;
  undressSlot: (slot: OutfitSlot) => void;
  clearAllSlots: () => void;
  setOutfitStatus: (status: OutfitBindingStatus | null) => void;
  toggleCatwalk: () => void;
  toggleDebug: () => void;
  toggleTuner: () => void;
  setTunerOverride: (cfg: OutfitBindingConfig | null) => void;
};

export const useWardrobeStore = create<WardrobeState>((set) => ({
  tryOnProduct: null,
  dressedSlots: {},
  outfitStatus: null,
  catwalkOn: false,
  debugBindings: false,
  tunerOverride: null,
  showTuner: false,

  setTryOnProduct: (product) =>
    set({ tryOnProduct: product, outfitStatus: null, tunerOverride: null }),

  dressProduct: (product) =>
    set((s) => {
      const slot = CATEGORY_TO_SLOT[product.category];
      return { dressedSlots: { ...s.dressedSlots, [slot]: product } };
    }),

  undressSlot: (slot) =>
    set((s) => {
      const next = { ...s.dressedSlots };
      delete next[slot];
      return { dressedSlots: next };
    }),

  clearAllSlots: () => set({ dressedSlots: {} }),

  setOutfitStatus: (outfitStatus) => set({ outfitStatus }),
  toggleCatwalk: () => set((s) => ({ catwalkOn: !s.catwalkOn })),
  toggleDebug: () => set((s) => ({ debugBindings: !s.debugBindings })),
  toggleTuner: () => set((s) => ({ showTuner: !s.showTuner })),
  setTunerOverride: (tunerOverride) => set({ tunerOverride }),
}));

/** Derived: collect GLB outfit bindings from selected product + dressed slots */
export function useOutfitBindings(): OutfitBindingConfig[] {
  const tryOnProduct = useWardrobeStore((s) => s.tryOnProduct);
  const dressedSlots = useWardrobeStore((s) => s.dressedSlots);
  const tunerOverride = useWardrobeStore((s) => s.tunerOverride);

  const bindings: OutfitBindingConfig[] = [];

  if (tryOnProduct?.outfitGlb) {
    bindings.push(tunerOverride ?? tryOnProduct.outfitGlb);
  }

  for (const product of Object.values(dressedSlots)) {
    if (!product) continue;
    const ext = productsExtended.find((p) => p.id === product.id);
    if (ext?.outfitGlb && !bindings.some((b) => b.glbUrl === ext.outfitGlb!.glbUrl)) {
      bindings.push(ext.outfitGlb);
    }
  }

  return bindings;
}

export function useDressedCount(): number {
  return useWardrobeStore((s) => Object.keys(s.dressedSlots).length);
}

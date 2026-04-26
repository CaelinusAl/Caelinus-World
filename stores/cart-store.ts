import { create } from "zustand";
import type { CartItemExtended, ProductExtended, ProductSize, TryOnContext } from "@/types/play";
import {
  loadCart as loadCartFromStorage,
  saveCart,
  addItemToCart,
  removeItemFromCart,
  clearCart as clearCartStorage,
  cartTotal,
} from "@/lib/cart-storage";

type CartState = {
  items: CartItemExtended[];
  hydrated: boolean;

  hydrate: () => void;
  addToCart: (product: ProductExtended, size: ProductSize, qty?: number, tryOnContext?: TryOnContext) => void;
  removeFromCart: (productId: string, size: ProductSize) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ items: loadCartFromStorage(), hydrated: true });
  },

  addToCart: (product, size, qty = 1, tryOnContext) => {
    const updated = addItemToCart(get().items, product, size, qty, tryOnContext);
    set({ items: updated });
  },

  removeFromCart: (productId, size) => {
    const updated = removeItemFromCart(get().items, productId, size);
    set({ items: updated });
  },

  clearCart: () => {
    clearCartStorage();
    set({ items: [] });
  },
}));

export function useCartTotal(): number {
  return cartTotal(useCartStore((s) => s.items));
}

export function useCartCount(): number {
  return useCartStore((s) => s.items.length);
}

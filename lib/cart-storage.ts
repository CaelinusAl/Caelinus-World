import type { CartItemExtended, ProductExtended, ProductSize, TryOnContext } from "@/types/play";
import { productsExtended } from "@/data/products";

const STORAGE_KEY = "caelinus-cart";

type StoredCartItem = {
  productId: string;
  size: ProductSize;
  qty: number;
  tryOnContext?: TryOnContext;
};

export function loadCart(): CartItemExtended[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored: StoredCartItem[] = JSON.parse(raw);
    return stored
      .map((s) => {
        const product = productsExtended.find((p) => p.id === s.productId);
        if (!product) return null;
        return { product, size: s.size, qty: s.qty, tryOnContext: s.tryOnContext };
      })
      .filter(Boolean) as CartItemExtended[];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItemExtended[]): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredCartItem[] = items.map((i) => ({
      productId: i.product.id,
      size: i.size,
      qty: i.qty,
      tryOnContext: i.tryOnContext,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // silently skip
  }
}

export function addItemToCart(
  cart: CartItemExtended[],
  product: ProductExtended,
  size: ProductSize,
  qty = 1,
  tryOnContext?: TryOnContext
): CartItemExtended[] {
  const existing = cart.find(
    (c) => c.product.id === product.id && c.size === size
  );

  let updated: CartItemExtended[];
  if (existing) {
    updated = cart.map((c) =>
      c.product.id === product.id && c.size === size
        ? { ...c, qty: c.qty + qty, tryOnContext: tryOnContext ?? c.tryOnContext }
        : c
    );
  } else {
    updated = [...cart, { product, size, qty, tryOnContext }];
  }

  saveCart(updated);
  return updated;
}

export function removeItemFromCart(
  cart: CartItemExtended[],
  productId: string,
  size: ProductSize
): CartItemExtended[] {
  const updated = cart.filter(
    (c) => !(c.product.id === productId && c.size === size)
  );
  saveCart(updated);
  return updated;
}

export function clearCart(): CartItemExtended[] {
  saveCart([]);
  return [];
}

export function cartTotal(cart: CartItemExtended[]): number {
  return cart.reduce((sum, c) => sum + c.product.numericPrice * c.qty, 0);
}

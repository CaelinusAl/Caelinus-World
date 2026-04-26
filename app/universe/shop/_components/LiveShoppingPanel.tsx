"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSceneStore } from "@/stores/scene-store";
import { useCartStore } from "@/stores/cart-store";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { products } from "@/data/products";
import { cartTotal } from "@/lib/cart-storage";
import { productsExtended } from "@/data/products";
import type { ShopCategory } from "@/types/play";

const CATEGORY_ICONS: Record<ShopCategory, string> = {
  all: "✦",
  bikini: "👙",
  pareo: "🧣",
  bag: "👜",
  heels: "👠",
  jewelry: "💎",
};

export default function LiveShoppingPanel() {
  const activeCategory = useSceneStore((s) => s.activeCategory);
  const setCategory = useSceneStore((s) => s.setCategory);
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const dressProduct = useWardrobeStore((s) => s.dressProduct);
  const total = cartTotal(items);

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? products
        : products.filter((p) => p.category === activeCategory),
    [activeCategory],
  );

  return (
    <>
      <div className="shop-ai-header">
        <div className="shop-ai-kicker">CANLI ALISVERIS</div>
        <h2 className="shop-ai-title">Gercek Alisveris Deneyimi</h2>
        <p className="shop-ai-subtitle">Uretici agi, canli satin alma, sepet yonetimi</p>
      </div>

      <div className="shop-products-panel">
        <div className="shop-categories">
          {(Object.keys(CATEGORY_ICONS) as ShopCategory[]).map((cat) => (
            <button
              key={cat}
              className={`shop-cat-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              <span className="shop-cat-icon">{CATEGORY_ICONS[cat]}</span>
              <span className="shop-cat-label">
                {cat === "all" ? "Tumu" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </span>
            </button>
          ))}
        </div>
        <div className="shop-product-grid">
          {filtered.map((product) => {
            const ext = productsExtended.find((p) => p.id === product.id);
            return (
              <div key={product.id} className="shop-product-card">
                <div className="shop-product-image-wrap">
                  <img src={product.image} alt={product.name} className="shop-product-image" />
                </div>
                <div className="shop-product-info">
                  <h4 className="shop-product-name">{product.name}</h4>
                  <div className="shop-product-meta">
                    <span className="shop-product-price">{product.price}</span>
                    <span className="shop-product-designer">{product.designer}</span>
                  </div>
                  <div className="shop-product-actions">
                    <button
                      className="shop-cart-btn"
                      onClick={() => ext && addToCart(ext, "M")}
                      style={{ flex: "1 1 100%" }}
                    >
                      🛒 Sepete At
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shop-outfit-panel" style={{ gridTemplateColumns: "1fr" }}>
        <div className="shop-mini-cart" style={{ padding: "24px" }}>
          <h3 className="shop-outfit-title">🛒 Sepetim</h3>
          {items.length === 0 ? (
            <p className="shop-cart-empty">Sepet bos — urun ekle!</p>
          ) : (
            <>
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="shop-cart-item" style={{ marginBottom: "8px" }}>
                  <span className="shop-cart-item-name">{item.product.name}</span>
                  <span className="shop-cart-item-qty">x{item.qty}</span>
                  <span className="shop-cart-item-price">${item.product.numericPrice}</span>
                </div>
              ))}
              <div className="shop-cart-total">
                Toplam: <strong>${total.toFixed(0)}</strong>
              </div>
              <Link
                href="/universe/shop/checkout"
                className="shop-checkout-btn"
                style={{ marginTop: "14px", display: "block", textAlign: "center", textDecoration: "none" }}
              >
                💫 Satin Al
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

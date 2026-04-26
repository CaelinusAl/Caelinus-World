"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSceneStore } from "@/stores/scene-store";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { useCartStore } from "@/stores/cart-store";
import { productsExtended } from "@/data/products";
import { loadAvatarConfig } from "@/lib/avatar-storage";
import {
  buildRecommendationIndex,
  getTopRecommendedProducts,
} from "@/lib/avatar-recommendations";
import ProductCard from "@/components/shop/ProductCard";
import type { ShopCategory, ProductExtended } from "@/types/play";

const CATEGORY_ICONS: Record<ShopCategory, string> = {
  all: "✦",
  bikini: "👙",
  pareo: "🧣",
  bag: "👜",
  heels: "👠",
  jewelry: "💎",
};

export default function ProductSection() {
  const activeCategory = useSceneStore((s) => s.activeCategory);
  const setCategory = useSceneStore((s) => s.setCategory);
  const setTryOnProduct = useWardrobeStore((s) => s.setTryOnProduct);
  const addToCart = useCartStore((s) => s.addToCart);

  const avatarConfig = useMemo(() => loadAvatarConfig(), []);

  const filteredExtended = useMemo(
    () =>
      activeCategory === "all"
        ? productsExtended
        : productsExtended.filter((p) => p.category === activeCategory),
    [activeCategory],
  );

  const recommendationIndex = useMemo(
    () => buildRecommendationIndex(avatarConfig, filteredExtended),
    [avatarConfig, filteredExtended],
  );

  const sanaOnerilen = useMemo(
    () => getTopRecommendedProducts(avatarConfig, filteredExtended, 6),
    [avatarConfig, filteredExtended],
  );

  const handleTryOn = (product: ProductExtended) => {
    setTryOnProduct(product);
    useSceneStore.getState().setMode("tryon");
  };

  return (
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

      {sanaOnerilen.length > 0 && (
        <section className="shop-rec-strip" aria-label="Sana onerilen">
          <div className="shop-rec-strip-header">
            <div>
              <h3 className="shop-rec-strip-title">Sana Onerilen</h3>
              <p className="shop-rec-strip-sub">
                Avatar bedenine gore beden ve siluet uyumu (kural tabanli)
              </p>
            </div>
            <Link href="/universe/shop/avatar" className="shop-rec-strip-link">
              Avatarini guncelle
            </Link>
          </div>
          <div className="shop-rec-strip-scroll">
            {sanaOnerilen.map((product) => (
              <ProductCard
                key={`rec-${product.id}`}
                product={product}
                recommendation={recommendationIndex.get(product.id) ?? null}
                onTryOn={handleTryOn}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      <div className="shop-product-grid">
        {filteredExtended.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            recommendation={recommendationIndex.get(product.id) ?? null}
            onTryOn={handleTryOn}
            onAddToCart={addToCart}
          />
        ))}
      </div>
    </div>
  );
}

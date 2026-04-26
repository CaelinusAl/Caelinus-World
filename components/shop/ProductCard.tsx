"use client";

import { useState, useCallback, useEffect } from "react";
import type { ProductExtended, ProductSize } from "@/types/play";
import type { AvatarProductRecommendation } from "@/lib/avatar-recommendations";

type Props = {
  product: ProductExtended;
  onTryOn?: (product: ProductExtended) => void;
  onAddToCart?: (product: ProductExtended, size: ProductSize) => void;
  recommendation?: AvatarProductRecommendation | null;
};

export default function ProductCard({
  product,
  onTryOn,
  onAddToCart,
  recommendation,
}: Props) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [showStory, setShowStory] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const totalStock = Object.values(product.stock).reduce(
    (s, v) => s + (v ?? 0),
    0
  );

  const selectedStock = selectedSize ? (product.stock[selectedSize] ?? 0) : 0;

  useEffect(() => {
    if (!recommendation) return;
    const rs = recommendation.recommendedSize;
    if ((product.stock[rs] ?? 0) <= 0) return;
    setSelectedSize((prev) => (prev === null ? rs : prev));
  }, [product.id, recommendation]);

  const handleAddToCart = useCallback(() => {
    if (selectedSize && onAddToCart) {
      onAddToCart(product, selectedSize);
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1800);
    }
  }, [selectedSize, onAddToCart, product]);

  return (
    <div className="ecom-product-card">
      <div className="ecom-product-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="ecom-product-image"
          loading="lazy"
        />
        {recommendation?.tags.includes("best_fit") && (
          <div className="ecom-rec-badge ecom-rec-badge--ideal" title={recommendation.rationale}>
            Senin icin ideal
          </div>
        )}
        {recommendation?.tags.includes("highlight") &&
          !recommendation.tags.includes("best_fit") && (
            <div className="ecom-rec-badge ecom-rec-badge--highlight" title={recommendation.rationale}>
              One cikan
            </div>
          )}
        {product.frequency && (
          <div className="shop-product-freq">{product.frequency}</div>
        )}
      </div>

      <div className="ecom-product-body">
        <h4 className="ecom-product-name">{product.name}</h4>
        <div className="ecom-product-brand">{product.brand}</div>

        <div className="ecom-product-price-row">
          <span className="ecom-product-price">
            ${product.numericPrice}
          </span>
          <span
            className={`ecom-product-stock ${totalStock === 0 ? "out" : totalStock < 10 ? "low" : ""}`}
          >
            {totalStock > 0 ? `${totalStock} stokta` : "Tukendi"}
          </span>
        </div>

        {product.story && (
          <>
            <button
              className="shop-story-btn"
              onClick={() => setShowStory(!showStory)}
            >
              {showStory ? "Kapat" : "Hikayesini Oku"}
            </button>
            {showStory && (
              <p className="shop-product-story">{product.story}</p>
            )}
          </>
        )}

        {recommendation && (
          <div className="ecom-rec-size-hint" title={recommendation.rationale}>
            Onerilen beden: <strong>{recommendation.recommendedSize}</strong>
            <span className="ecom-rec-score">{recommendation.fitScore}/100 uyum</span>
          </div>
        )}

        <div className="ecom-sizes">
          {product.sizes.map((sz) => {
            const stock = product.stock[sz] ?? 0;
            const isRec = recommendation?.recommendedSize === sz;
            return (
              <button
                key={sz}
                className={`ecom-size-btn ${selectedSize === sz ? "active" : ""} ${stock === 0 ? "out-of-stock" : ""} ${isRec ? "recommended" : ""}`}
                onClick={() => stock > 0 && setSelectedSize(sz)}
                disabled={stock === 0}
              >
                {sz}
              </button>
            );
          })}
        </div>

        <div className="ecom-product-actions">
          {onTryOn && product.outfitGlb && (
            <button
              className="ecom-tryon-btn"
              onClick={() => onTryOn(product)}
            >
              Dene
            </button>
          )}
          <button
            className={`ecom-addcart-btn ${addedFeedback ? "added" : ""}`}
            disabled={!selectedSize || selectedStock === 0}
            onClick={handleAddToCart}
          >
            {addedFeedback
              ? "Eklendi"
              : selectedSize
                ? `${selectedSize} Sepete At`
                : "Beden Sec"}
          </button>
        </div>
      </div>
    </div>
  );
}

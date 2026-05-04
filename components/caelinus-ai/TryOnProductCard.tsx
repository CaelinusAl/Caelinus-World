"use client";

/**
 * TryOnProductCard — Caelinus AI try-on sayfasının ürün kartı.
 *
 * Caelinus shop product modeline bağlı. Kart tıklanınca "Ürünü Dene"
 * mantığı tetiklenir; kart "is-trying" state'iyle altın kontur alır.
 * "Satın Al" CTA'sı ürün detay sayfasına / sepete götürür.
 */

import LuxButton from "./LuxButton";
import type { Product } from "@/types/play";

type Props = {
  product: Product;
  isTrying?: boolean;
  onTry?: (product: Product) => void;
  onBuy?: (product: Product) => void;
};

export default function TryOnProductCard({
  product,
  isTrying = false,
  onTry,
  onBuy,
}: Props) {
  return (
    <article className={`tryon-product-card ${isTrying ? "is-trying" : ""}`}>
      <div className="tryon-product-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        {isTrying && (
          <div className="tryon-product-trying-tag">✦ Bedeninde</div>
        )}
      </div>
      <div className="tryon-product-meta">
        <div className="tryon-product-frequency">{product.frequency}</div>
        <h3 className="tryon-product-name">{product.name}</h3>
        <p className="tryon-product-story">{product.story}</p>
        <div className="tryon-product-price-row">
          <span className="tryon-product-price">{product.price}</span>
          <span className="tryon-product-designer">
            {product.designer}
          </span>
        </div>
        <div className="tryon-product-actions">
          <LuxButton
            variant={isTrying ? "nude" : "gold"}
            size="md"
            onClick={() => onTry?.(product)}
          >
            {isTrying ? "Deneniyor" : "Ürünü Dene"}
          </LuxButton>
          <LuxButton
            variant="ghost"
            size="md"
            onClick={() => onBuy?.(product)}
          >
            Satın Al
          </LuxButton>
        </div>
      </div>
    </article>
  );
}

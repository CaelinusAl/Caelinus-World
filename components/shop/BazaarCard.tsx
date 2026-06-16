"use client";

/**
 * BazaarCard — "aynadan çıkan" lüks vitrin kartı.
 *
 * Caelinus Bazaar deneyiminin atomu. Klasik e-ticaret kartından farkı:
 *  - karanlık lacivert/altın bir aynanın içinden beliriyormuş gibi yansıma
 *  - hover'da hafif büyüme + altın aura halkası + 3B parallax eğim
 *  - ürünün kısa hikâyesi hover'da açığa çıkar
 *
 * E-ticaret fonksiyonları AYNEN korunur: beden seçimi, stok, fiyat,
 * sepete ekle, "Avatar'da Dene", ürün detayına gidiş. ProductCard ile
 * aynı props sözleşmesini taşır (drop-in), bu yüzden recommendation
 * motoru ve cart store hiç değişmeden çalışır.
 */

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { ProductExtended, ProductSize } from "@/types/play";
import type { AvatarProductRecommendation } from "@/lib/avatar-recommendations";
import { ZODIAC_LABEL, type Zodiac } from "@/lib/frequency";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

type Props = {
  product: ProductExtended;
  /** Oda/koleksiyon adı (örn. "12 Burç After Beach Wear") */
  collection?: string;
  /** Atölye tasarımcısı (örn. "Selin Irmak") */
  designer?: string;
  /** Burç yoksa gösterilecek etiket (örn. "Tanrıça", "Ritüel") */
  tag?: string;
  onTryOn?: (product: ProductExtended) => void;
  onAddToCart?: (product: ProductExtended, size: ProductSize) => void;
  recommendation?: AvatarProductRecommendation | null;
};

export default function BazaarCard({
  product,
  collection,
  designer,
  tag,
  onTryOn,
  onAddToCart,
  recommendation,
}: Props) {
  // Önerilen beden stoktaysa varsayılan olarak seçili gelir (effect'siz).
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(() => {
    if (recommendation) {
      const rs = recommendation.recommendedSize;
      if ((product.stock[rs] ?? 0) > 0) return rs;
    }
    return null;
  });
  const [addedFeedback, setAddedFeedback] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const totalStock = Object.values(product.stock).reduce(
    (s, v) => s + (v ?? 0),
    0,
  );
  const selectedStock = selectedSize ? (product.stock[selectedSize] ?? 0) : 0;

  const handleAddToCart = useCallback(() => {
    if (selectedSize && onAddToCart) {
      onAddToCart(product, selectedSize);
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1800);
    }
  }, [selectedSize, onAddToCart, product]);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 9).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const zodiacLabel = product.zodiac
    ? ZODIAC_LABEL[product.zodiac as Zodiac]
    : null;

  return (
    <article
      ref={cardRef}
      className="bazaar-card"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="bazaar-mirror">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="bazaar-photo"
          loading="lazy"
          draggable={false}
        />
        {/* Ayna yansıması — aynı görsel, ters çevrilmiş ve sönümlenen */}
        <div
          className="bazaar-reflection"
          aria-hidden="true"
          style={{ backgroundImage: `url(${product.image})` }}
        />
        <span className="bazaar-aura" aria-hidden="true" />
        <span className="bazaar-edge" aria-hidden="true" />

        {product.frequency && (
          <span className="bazaar-freq">{product.frequency}</span>
        )}
        {recommendation?.tags.includes("best_fit") && (
          <span className="bazaar-rec" title={recommendation.rationale}>
            Senin için ideal
          </span>
        )}

        {/* Hover'da açılan hikâye */}
        {product.story && (
          <div className="bazaar-story">
            <span className="bazaar-story-glyph">✦</span>
            <p>{product.story}</p>
            <Link
              href={`/universe/shop/urun/${product.id}`}
              className="bazaar-story-more"
              prefetch={false}
            >
              Hikâyesini Oku →
            </Link>
          </div>
        )}
      </div>

      <div className="bazaar-info">
        {collection && <div className="bazaar-collection">{collection}</div>}

        <Link
          href={`/universe/shop/urun/${product.id}`}
          className="bazaar-name-link"
          prefetch={false}
        >
          <h4 className="bazaar-name">{product.name}</h4>
        </Link>

        <div className="bazaar-meta">
          <span className="bazaar-designer">{designer ?? product.designer}</span>
          {(zodiacLabel || tag) && (
            <span className="bazaar-sign">
              {zodiacLabel ? `${zodiacLabel.symbol} ${zodiacLabel.tr}` : tag}
            </span>
          )}
        </div>

        <div className="bazaar-price-row">
          <span className="bazaar-price">${product.numericPrice}</span>
          <span
            className={`bazaar-stock ${totalStock === 0 ? "out" : totalStock < 10 ? "low" : ""}`}
          >
            {totalStock > 0 ? `${totalStock} adet` : "Tükendi"}
          </span>
        </div>

        <div className="bazaar-sizes">
          {product.sizes.map((sz) => {
            const stock = product.stock[sz] ?? 0;
            const isRec = recommendation?.recommendedSize === sz;
            return (
              <button
                key={sz}
                className={`bazaar-size ${selectedSize === sz ? "active" : ""} ${stock === 0 ? "out" : ""} ${isRec ? "rec" : ""}`}
                onClick={() => stock > 0 && setSelectedSize(sz)}
                disabled={stock === 0}
                aria-label={`Beden ${sz}`}
              >
                {sz}
              </button>
            );
          })}
        </div>

        <div className="bazaar-actions">
          {onTryOn && product.outfitGlb && (
            <button className="bazaar-btn bazaar-btn--try" onClick={() => onTryOn(product)}>
              Avatar&apos;da Dene
            </button>
          )}
          <button
            className={`bazaar-btn bazaar-btn--cart ${addedFeedback ? "added" : ""}`}
            disabled={!selectedSize || selectedStock === 0}
            onClick={handleAddToCart}
          >
            {addedFeedback
              ? "✦ Eklendi"
              : selectedSize
                ? "Sepete Ekle"
                : "Beden Seç"}
          </button>
        </div>
      </div>
    </article>
  );
}

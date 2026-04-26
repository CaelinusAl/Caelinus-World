"use client";

import { useState, useCallback, useEffect, memo } from "react";
import type { ProductExtended, ProductSize } from "@/types/play";
import type { OutfitBindingStatus } from "@/components/shop/scene/OutfitBindingLayer";

type Props = {
  product: ProductExtended | null;
  onAddToCart?: (product: ProductExtended, size: ProductSize) => void;
  onClose?: () => void;
  /** Outfit GLB binding lifecycle state */
  outfitStatus?: OutfitBindingStatus | null;
};

function TryOnProductPanelInner({ product, onAddToCart, onClose, outfitStatus }: Props) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setSelectedSize(null);
    setAddedFeedback(false);
  }, [product?.id]);

  const selectedStock = selectedSize ? (product?.stock[selectedSize] ?? 0) : 0;

  const handleAdd = useCallback(() => {
    if (selectedSize && product && onAddToCart) {
      onAddToCart(product, selectedSize);
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 2000);
    }
  }, [selectedSize, product, onAddToCart]);

  if (!product) return null;

  const has3D = !!product.outfitGlb;

  return (
    <div className="tryon-panel">
      <div className="tryon-panel-header">
        <div>
          <div className="tryon-panel-brand">{product.brand}</div>
          <h3 className="tryon-panel-name">{product.name}</h3>
        </div>
        {onClose && (
          <button className="tryon-panel-close" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        )}
      </div>

      <div className="tryon-panel-binding-row">
        {has3D ? (
          <OutfitStatusBadge status={outfitStatus} />
        ) : (
          <span className="tryon-badge tryon-badge--none">3D model bekleniyor</span>
        )}
      </div>

      <div className="tryon-panel-price-row">
        <span className="tryon-panel-price">${product.numericPrice}</span>
        {product.frequency && (
          <span className="tryon-panel-freq">{product.frequency}</span>
        )}
      </div>

      {product.story && (
        <p className="tryon-panel-story">{product.story}</p>
      )}

      <div className="tryon-panel-sizes">
        <div className="tryon-panel-sizes-label">Beden Sec</div>
        <div className="tryon-panel-sizes-row">
          {product.sizes.map((sz) => {
            const stock = product.stock[sz] ?? 0;
            return (
              <button
                key={sz}
                className={`tryon-panel-size-btn ${selectedSize === sz ? "active" : ""} ${stock === 0 ? "out" : ""}`}
                onClick={() => stock > 0 && setSelectedSize(sz)}
                disabled={stock === 0}
              >
                {sz}
              </button>
            );
          })}
        </div>
        {selectedSize && (
          <div className="tryon-panel-stock">
            {selectedStock > 0
              ? `${selectedStock} adet stokta`
              : "Stok tukendi"}
          </div>
        )}
      </div>

      <div className="tryon-panel-total">
        {selectedSize ? (
          <>
            <span>{product.name}</span>
            <span>{selectedSize} — ${product.numericPrice}</span>
          </>
        ) : (
          <span className="tryon-panel-total-hint">
            Beden secin
          </span>
        )}
      </div>

      <button
        className={`tryon-panel-cart-btn ${addedFeedback ? "added" : ""}`}
        disabled={!selectedSize || selectedStock === 0}
        onClick={handleAdd}
      >
        {addedFeedback
          ? "Sepete Eklendi"
          : selectedSize
            ? `${selectedSize} — $${product.numericPrice} Sepete Ekle`
            : "Beden Secin"}
      </button>
    </div>
  );
}

/** Visual badge showing outfit GLB loading lifecycle */
function OutfitStatusBadge({ status }: { status?: OutfitBindingStatus | null }) {
  if (!status || status.state === "idle") {
    return <span className="tryon-badge tryon-badge--3d">3D Hazir</span>;
  }
  if (status.state === "loading") {
    return (
      <span className="tryon-badge tryon-badge--loading">
        <span className="tryon-badge-spinner" /> Yukleniyor...
      </span>
    );
  }
  if (status.state === "ready") {
    return (
      <span className="tryon-badge tryon-badge--ready" title={`method: ${status.method}`}>
        3D Giydirildi — {status.resolvedBone}
      </span>
    );
  }
  if (status.state === "error") {
    return (
      <span className="tryon-badge tryon-badge--error" title={status.message}>
        3D Yuklenemedi
      </span>
    );
  }
  return null;
}

export const TryOnProductPanel = memo(TryOnProductPanelInner);

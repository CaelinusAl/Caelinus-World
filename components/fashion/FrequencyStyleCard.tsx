"use client";

/**
 * FrequencyStyleCard — Caelinus koleksiyonundan tek bir parçayı "frekans
 * kartı" olarak gösterir. Tıklayınca Moda AI'ya o parçayla ilgili stil
 * sorusu gönderir (onAsk). Veri `data/products.ts`'ten gelir.
 */

import type { Product } from "@/types/play";

type Props = {
  product: Product;
  onAsk: (prompt: string) => void;
};

export default function FrequencyStyleCard({ product, onAsk }: Props) {
  return (
    <button
      type="button"
      className="moda-style-card"
      onClick={() =>
        onAsk(
          `"${product.name}" (${product.price}${product.frequency ? `, ${product.frequency}` : ""}) parçasını ` +
            `bana nasıl konumlandırırsın? Hangi enerjiye / burca yakışır, yanına ne yakışır ve hangi anda giyilir?`,
        )
      }
      aria-label={`${product.name} hakkında stil sor`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="moda-style-img" src={product.image} alt={product.name} loading="lazy" />
      {product.frequency && <span className="moda-style-freq">{product.frequency}</span>}
      <div className="moda-style-body">
        <p className="moda-style-name">{product.name}</p>
        <p className="moda-style-price">{product.price}</p>
        {product.story && <p className="moda-style-story">{product.story}</p>}
      </div>
      <span className="moda-style-cta" aria-hidden="true">
        Bu parçayı sor →
      </span>
    </button>
  );
}

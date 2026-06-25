import Link from "next/link";
import { products } from "@/data/products";
import { lineupPoseSrc } from "@/data/lineup-poses";

/**
 * BikiniLineup — Shop girişinin 1. bölümü.
 *
 * 12 bikinin seçili manken pozunu (şeffaf cutout) açık zeminli bir
 * "showroom rafı" üzerinde yan yana dizer; her figür kendi ürün
 * sayfasına (PDP) götürür. Referans: yan-yana ayakta manken dizisi.
 */
const bikinis = products.filter((p) => p.category === "bikini");

export default function BikiniLineup() {
  return (
    <section className="shop-lineup" aria-label="Bikini koleksiyonu">
      <div className="shop-lineup-inner">
        <div className="shop-lineup-head">
          <span className="shop-lineup-label">ÜRÜNLER</span>
          <span className="shop-lineup-count">{bikinis.length}</span>
        </div>

        <div className="shop-lineup-row">
          {bikinis.map((p) => {
            const src = lineupPoseSrc(p.zodiac);
            if (!src) return null;
            return (
              <Link
                key={p.id}
                href={`/universe/shop/urun/${p.id}`}
                className="shop-lineup-fig"
                title={p.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={p.name}
                  className="shop-lineup-img"
                  loading="lazy"
                  decoding="async"
                />
                <span className="shop-lineup-meta">
                  <span className="shop-lineup-name">{p.name}</span>
                  <span className="shop-lineup-price">{p.price}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

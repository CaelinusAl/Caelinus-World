"use client";

/**
 * ProductSection — "Caelinus Bazaar / Atelier District".
 *
 * Klasik e-ticaret grid'i yerine, içinde gezilen yaşayan bir dijital pazar:
 *  - üstte canlı bir giriş alanı (Bazaar hero)
 *  - tasarımcıların / koleksiyonların kendi "atölye odaları"
 *  - ürünler düz grid yerine yatay akan "ayna vitrinleri" (BazaarCard)
 *
 * Odalar filtre değil, gezilebilir alanlardır: nav pill'leri ilgili odaya
 * kaydırır. E-ticaret fonksiyonları (sepet, beden, stok, fiyat, detay,
 * try-on, öneri motoru) hiç değişmeden korunur — sadece deneyim dönüşür.
 */

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { useCartStore } from "@/stores/cart-store";
import { productsExtended } from "@/data/products";
import { loadAvatarConfig } from "@/lib/avatar-storage";
import {
  buildRecommendationIndex,
  getTopRecommendedProducts,
} from "@/lib/avatar-recommendations";
import BazaarCard from "@/components/shop/BazaarCard";
import BazaarShowcase from "@/components/shop/BazaarShowcase";
import { useSceneStore } from "@/stores/scene-store";
import type { ProductExtended } from "@/types/play";

type RoomKind = "atelier" | "products" | "guest";

type Room = {
  id: string;
  name: string;
  designer: string;
  collection: string;
  glyph: string;
  tag: string;
  tagline: string;
  kind: RoomKind;
  match?: (p: ProductExtended) => boolean;
};

/**
 * Atölye odaları. Mevcut katalog bu odalara dağıtılır — hiçbir ürün verisi
 * değişmez, sadece sunum/gruplama yapılır. Tasarımcı kimliği "Selin Irmak".
 */
const ROOMS: Room[] = [
  {
    id: "selin-atelier",
    name: "Selin Irmak Atelier",
    designer: "Selin Irmak",
    collection: "Caelinus Signature",
    glyph: "✦",
    tag: "Atölye",
    tagline:
      "Her parça bir hikâyeyle dokunur. Frekans, beden ve niyet aynı anda giyilir.",
    kind: "atelier",
  },
  {
    id: "zodiac-room",
    name: "Zodiac Room",
    designer: "Selin Irmak",
    collection: "12 Burç After Beach Wear",
    glyph: "☉",
    tag: "Burç",
    tagline: "On iki burcun frekansı, deniz sonrası ışığında.",
    kind: "products",
    match: (p) => p.category === "bikini",
  },
  {
    id: "goddess-room",
    name: "Goddess Room",
    designer: "Selin Irmak",
    collection: "Goddess Collection",
    glyph: "♀",
    tag: "Tanrıça",
    tagline: "Tanrıçanın yeryüzündeki yansıması — topuk, kristal, ışıltı.",
    kind: "products",
    match: (p) => p.category === "heels" || p.category === "jewelry",
  },
  {
    id: "ritual-room",
    name: "Ritual Pieces",
    designer: "Selin Irmak",
    collection: "Caelinus Ritual Wear",
    glyph: "☾",
    tag: "Ritüel",
    tagline: "Sarınılan kumaşlar, taşınan sırlar — bedenin ritüeli.",
    kind: "products",
    match: (p) => p.category === "pareo" || p.category === "bag",
  },
  {
    id: "guest-room",
    name: "Guest Designers",
    designer: "Caelinus",
    collection: "Davetli Atölyeler",
    glyph: "✧",
    tag: "Davet",
    tagline: "Kapılar açılıyor. Hikâyesi olan tasarımcılar Caelinus'a katılıyor.",
    kind: "guest",
  },
];

export default function ProductSection() {
  const setTryOnProduct = useWardrobeStore((s) => s.setTryOnProduct);
  const addToCart = useCartStore((s) => s.addToCart);
  const shellRef = useRef<HTMLDivElement>(null);

  const avatarConfig = useMemo(() => loadAvatarConfig(), []);

  const recommendationIndex = useMemo(
    () => buildRecommendationIndex(avatarConfig, productsExtended),
    [avatarConfig],
  );

  const sanaOnerilen = useMemo(
    () => getTopRecommendedProducts(avatarConfig, productsExtended, 6),
    [avatarConfig],
  );

  const handleTryOn = (product: ProductExtended) => {
    setTryOnProduct(product);
    useSceneStore.getState().setMode("tryon");
  };

  const scrollToRoom = (id: string) => {
    const root = shellRef.current;
    if (!root) return;
    const el = root.querySelector(`#${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bazaar" ref={shellRef}>
      {/* ── Giriş alanı ───────────────────────────────────────── */}
      <header className="bazaar-hero">
        <span className="bazaar-hero-kicker">CAELINUS UNIVERSE</span>
        <h2 className="bazaar-hero-title">Caelinus Bazaar</h2>
        <p className="bazaar-hero-sub">Ürün değil, hikâyesi olan parçalar.</p>

        {/* ── Ana vitrin: tüm burçların sahnede yürüdüğü video ── */}
        <BazaarShowcase />

        <button
          className="bazaar-hero-cta"
          onClick={() => scrollToRoom("selin-atelier")}
        >
          Atölye&apos;leri Keşfet ↓
        </button>

        <nav className="bazaar-nav" aria-label="Atölye odaları">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              className="bazaar-nav-pill"
              onClick={() => scrollToRoom(r.id)}
            >
              <span className="bazaar-nav-glyph">{r.glyph}</span>
              {r.name}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Sana özel vitrin ──────────────────────────────────── */}
      {sanaOnerilen.length > 0 && (
        <section className="bazaar-room bazaar-room--curated" aria-label="Sana özel">
          <div className="bazaar-room-head">
            <div>
              <span className="bazaar-room-glyph">❖</span>
              <h3 className="bazaar-room-name">Sana Özel Vitrin</h3>
              <p className="bazaar-room-tagline">
                Avatar bedenine göre seçilen siluetler.
              </p>
            </div>
            <Link href="/universe/shop/avatar" className="bazaar-room-link">
              Avatarını güncelle →
            </Link>
          </div>
          <div className="bazaar-vitrine">
            {sanaOnerilen.map((product) => (
              <BazaarCard
                key={`rec-${product.id}`}
                product={product}
                collection="Sana Özel"
                designer="Selin Irmak"
                recommendation={recommendationIndex.get(product.id) ?? null}
                onTryOn={handleTryOn}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Atölye odaları ────────────────────────────────────── */}
      {ROOMS.map((room) => {
        if (room.kind === "atelier") {
          return (
            <section key={room.id} id={room.id} className="bazaar-room bazaar-room--portal">
              <div className="bazaar-portal">
                <div className="bazaar-portal-ring" aria-hidden="true" />
                <span className="bazaar-portal-glyph">{room.glyph}</span>
                <div className="bazaar-portal-body">
                  <span className="bazaar-portal-kicker">Atölye · {room.designer}</span>
                  <h3 className="bazaar-portal-name">{room.name}</h3>
                  <p className="bazaar-portal-tagline">{room.tagline}</p>
                  <div className="bazaar-portal-links">
                    <button className="bazaar-room-link" onClick={() => scrollToRoom("zodiac-room")}>
                      Zodiac Room →
                    </button>
                    <button className="bazaar-room-link" onClick={() => scrollToRoom("goddess-room")}>
                      Goddess Room →
                    </button>
                    <button className="bazaar-room-link" onClick={() => scrollToRoom("ritual-room")}>
                      Ritual Pieces →
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (room.kind === "guest") {
          return (
            <section key={room.id} id={room.id} className="bazaar-room bazaar-room--guest">
              <div className="bazaar-guest">
                <span className="bazaar-room-glyph">{room.glyph}</span>
                <h3 className="bazaar-room-name">{room.name}</h3>
                <p className="bazaar-room-tagline">{room.tagline}</p>
                <Link href="/designers" className="bazaar-hero-cta">
                  Atölyeni Aç →
                </Link>
              </div>
            </section>
          );
        }

        const items = productsExtended.filter((p) => room.match?.(p));
        if (items.length === 0) return null;

        return (
          <section key={room.id} id={room.id} className="bazaar-room">
            <div className="bazaar-room-head">
              <div>
                <span className="bazaar-room-glyph">{room.glyph}</span>
                <h3 className="bazaar-room-name">{room.name}</h3>
                <p className="bazaar-room-tagline">
                  {room.collection} · {room.tagline}
                </p>
              </div>
              <span className="bazaar-room-count">{items.length} parça</span>
            </div>
            <div className="bazaar-vitrine">
              {items.map((product) => (
                <BazaarCard
                  key={product.id}
                  product={product}
                  collection={room.collection}
                  designer={room.designer}
                  tag={room.tag}
                  recommendation={recommendationIndex.get(product.id) ?? null}
                  onTryOn={handleTryOn}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

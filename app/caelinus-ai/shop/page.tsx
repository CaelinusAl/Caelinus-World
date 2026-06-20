"use client";

/**
 * /caelinus-ai/shop — Caelinus AI Bütiği.
 *
 * Founder vision'daki üçüncü ana sayfa. Try-on'dan farkı:
 * try-on bir "kıyafet denemesi", shop bir "alışveriş deneyimi".
 * Kullanıcı:
 *   1. Sol tarafta sahnedeki bedenini görür (carousel ile değiştirebilir)
 *   2. Sağ tarafta kategori filtreli ürün ızgarasını görür
 *   3. Ürünü kart üstünden "Bedenimde Dene" ile sahneye giydirir
 *   4. "Satın Al" sepete ekler ve ana shop checkout'una yönlendirir
 *
 * Avatar carousel — kullanıcı kendi AI avatar'ı yoksa Caelinus Body
 * Library'den birini seçebilir. QR-ready: ileride telefondan selfie
 * çekildiğinde yeni avatar carousel'a düşer.
 *
 * Cart-aware: localStorage tabanlı `lib/cart-storage` ile entegre,
 * mevcut /universe/shop checkout flow'una köprü kurar.
 */

import Link from "next/link";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AvatarCarousel, {
  type CarouselAvatar,
  getDefaultCarouselSelection,
} from "@/components/caelinus-ai/AvatarCarousel";
import LuxButton from "@/components/caelinus-ai/LuxButton";
import { CAELINUS_BODY_LIBRARY } from "@/lib/avatar-bodies";
import {
  GENERATED_AVATAR_KEY,
  loadGeneratedAvatar,
  TRYON_VARIANT_COUNT,
  getVariantForProduct,
  getVariantIndexForProduct,
  type GeneratedAvatar,
} from "@/lib/caelinus-ai";
import { products, productsExtended } from "@/data/products";
import type { Product, ProductExtended } from "@/types/play";

const Caelinus3DScene = lazy(
  () => import("@/components/caelinus-ai/Caelinus3DScene"),
);

const FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "bikini", label: "Bikini" },
  { id: "pareo", label: "Pareo" },
  { id: "bag", label: "Çanta" },
  { id: "heels", label: "Topuklu" },
  { id: "jewelry", label: "Mücevher" },
];

/* ────────── Ürün enerji rengi (try-on sayfasındakiyle senkron) ────────── */

const ZODIAC_TO_ELEMENT: Record<string, "fire" | "earth" | "air" | "water"> = {
  aries: "fire",
  leo: "fire",
  sagittarius: "fire",
  taurus: "earth",
  virgo: "earth",
  capricorn: "earth",
  gemini: "air",
  libra: "air",
  aquarius: "air",
  cancer: "water",
  scorpio: "water",
  pisces: "water",
};

const ELEMENT_COLOR: Record<string, string> = {
  fire: "#e87a3d",
  water: "#6ba8c4",
  air: "#cfc8b8",
  earth: "#a87149",
};

const CATEGORY_FALLBACK_COLOR: Record<string, string> = {
  bikini: "#caa56a",
  pareo: "#6ba8c4",
  bag: "#e8c889",
  heels: "#caa56a",
  jewelry: "#f5d97a",
};

function productAccent(p: Product): string {
  if (p.zodiac && ZODIAC_TO_ELEMENT[p.zodiac]) {
    return ELEMENT_COLOR[ZODIAC_TO_ELEMENT[p.zodiac]];
  }
  return CATEGORY_FALLBACK_COLOR[p.category] ?? "#caa56a";
}

/* ────────── Sepet — küçük localStorage helper ────────── */

const CART_KEY = "caelinus_ai_cart";

type CartLine = { productId: string; addedAt: string; avatarId?: string };

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* swallow */
  }
}

/* ────────── Ana sayfa ────────── */

export default function CaelinusShopPage() {
  const [avatar, setAvatar] = useState<GeneratedAvatar | null>(null);
  const [selected, setSelected] = useState<CarouselAvatar | null>(null);
  const [trying, setTrying] = useState<Product | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [mounted, setMounted] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  /* Hydration + storage sync */
  useEffect(() => {
    setMounted(true);
    setAvatar(loadGeneratedAvatar());
    setCart(loadCart());
    setSelected(getDefaultCarouselSelection());

    const onStorage = (e: StorageEvent) => {
      if (e.key === GENERATED_AVATAR_KEY || e.key === null) {
        setAvatar(loadGeneratedAvatar());
      }
      if (e.key === CART_KEY || e.key === null) {
        setCart(loadCart());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Filter ürünleri */
  const filtered = useMemo<ProductExtended[]>(() => {
    if (filter === "all") return productsExtended;
    return productsExtended.filter((p) => p.category === filter);
  }, [filter]);

  /* Sahne'ye geçen GLB url'i — try-on varyantı varsa onu kullan */
  const sceneAvatarUrl = useMemo(() => {
    if (trying) return getVariantForProduct(trying);
    if (selected) return selected.url;
    return undefined;
  }, [trying, selected]);

  /* Sahnenin avatar prop'u — Caelinus3DScene avatar.styleProfile gerektirir,
   * eğer kullanıcı kendi avatar'ı yoksa style fallback için synthetic avatar */
  const sceneAvatar = useMemo<GeneratedAvatar | null>(() => {
    if (avatar) return avatar;
    if (!selected) return null;
    const body = CAELINUS_BODY_LIBRARY.find((b) => b.id === selected.id);
    return {
      id: `synthetic-${selected.id}`,
      glbUrl: selected.url,
      thumbnailUrl: selected.preview,
      styleProfile: {
        hair: { length: "long", texture: "wavy", color: "#1a1410" },
        skinTone: "#d4ad8a",
        faceStyle: "natural",
        bodyType: "balanced",
        outfitMood: "noir-luxe",
        frequencyTag: body?.vibe ?? selected.vibe ?? "Auteur",
      },
      provider: "synthetic",
      generatedAt: new Date().toISOString(),
      outfitBindingHints: {
        bindingScale: 1,
        supportsSkinToneOverride:
          body?.supportsSkinToneOverride ?? false,
        isPhotorealistic: !(body?.supportsSkinToneOverride ?? false),
      },
    };
  }, [avatar, selected]);

  /* Try-on toggle */
  const handleTry = useCallback((p: Product) => {
    setTrying((cur) => (cur?.id === p.id ? null : p));
  }, []);

  /* Buy → sepete ekle + visual confirmation + universe/shop'a yönlendir */
  const handleBuy = useCallback(
    (p: Product) => {
      setCart((cur) => {
        const next: CartLine[] = [
          ...cur,
          {
            productId: p.id,
            addedAt: new Date().toISOString(),
            avatarId: avatar?.id ?? selected?.id,
          },
        ];
        saveCart(next);
        return next;
      });
      setJustAdded(p.id);
      window.setTimeout(() => setJustAdded(null), 1600);
    },
    [avatar, selected],
  );

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    if (typeof window !== "undefined") {
      window.location.href = "/universe/shop?source=caelinus-ai";
    }
  }, [cart]);

  const accent = trying ? productAccent(trying) : null;
  const tryOnLabel = trying?.name ?? null;
  const variantIndex = trying ? getVariantIndexForProduct(trying) : null;

  return (
    <div className="cai-page cai-shop-page">
      {/* ── Hero ── */}
      <section className="cai-hero cai-hero--narrow">
        <div className="cai-hero-kicker">CAELINUS AI · BÜTİK</div>
        <h1 className="cai-hero-title">
          Frekansını giy — <em>kendi bedeninde</em>
        </h1>
        <p className="cai-hero-sub">
          Caelinus tasarımcılarının zodyak frekanslarıyla ördüğü parçalar.
          Bedenini seç, ürünü dene, doğru hissettiğinde &ldquo;Satın Al&rdquo; de.
        </p>
      </section>

      <div className="cai-shop-layout">
        {/* SOL — sahne + carousel */}
        <div className="cai-shop-stage-col">
          <div className="cai-shop-stage">
            <Suspense
              fallback={
                <div className="cai-canvas-fallback">
                  <div className="cai-canvas-pulse" />
                  <span>Bedenin yükleniyor…</span>
                </div>
              }
            >
              <Caelinus3DScene
                avatar={sceneAvatar}
                skinTone={sceneAvatar?.styleProfile.skinTone}
                animationUrl="/models/caelinus-catwalk.glb"
                autoRotate
                tryOnAccent={accent}
                tryOnLabel={tryOnLabel}
                avatarUrlOverride={sceneAvatarUrl}
              />
            </Suspense>

            <div className="cai-shop-stage-meta">
              <div className="cai-shop-stage-frequency">
                {avatar?.reading?.styleIdentity.label ??
                  selected?.label ??
                  "Caelinus"}
              </div>
              {trying ? (
                <div className="cai-shop-stage-trying">
                  <span
                    className="cai-shop-stage-trying-dot"
                    style={{ background: accent ?? "#caa56a" }}
                  />
                  Şu an: <strong>{trying.name}</strong>
                  {variantIndex !== null && (
                    <span className="cai-shop-stage-variant">
                      Siluet {variantIndex + 1} / {TRYON_VARIANT_COUNT}
                    </span>
                  )}
                </div>
              ) : (
                <div className="cai-shop-stage-trying cai-shop-stage-trying--idle">
                  Bir parça seç — bedeninde belirsin
                </div>
              )}
            </div>
          </div>

          <AvatarCarousel
            selectedId={selected?.id ?? null}
            onSelect={(a) => {
              setSelected(a);
              // Avatar değiştiğinde try-on'u sıfırla — yeni bedene geçiş
              setTrying(null);
            }}
            heading="Bedenini Seç"
            subtitle="Caelinus body library veya kendi AI avatar'ın"
            includeUserAvatar
            variant="thumbs"
            className="cai-shop-carousel"
          />

          <div className="cai-shop-stage-actions">
            <Link href="/caelinus-ai/avatar" className="cai-shop-stage-link">
              ← AI ile yeniden okutmak istiyorum
            </Link>
            <Link href="/caelinus-ai/try-on" className="cai-shop-stage-link">
              Try-on stüdyosuna git →
            </Link>
          </div>
        </div>

        {/* SAĞ — ürünler */}
        <aside className="cai-shop-side">
          <div className="cai-shop-filters" role="tablist">
            {FILTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={filter === c.id}
                className={`cai-tryon-filter ${
                  filter === c.id ? "is-active" : ""
                }`}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="cai-shop-products">
            {filtered.map((p, idx) => {
              const isTrying = trying?.id === p.id;
              const wasAdded = justAdded === p.id;
              return (
                <article
                  key={p.id}
                  className={`cai-shop-product-card cai-fade-up ${
                    isTrying ? "is-trying" : ""
                  } ${wasAdded ? "is-just-added" : ""}`}
                  style={{ animationDelay: `${idx * 35}ms` }}
                >
                  <div className="cai-shop-product-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} loading="lazy" />
                    {isTrying && (
                      <div className="cai-shop-product-trying-tag">
                        ✦ Bedeninde
                      </div>
                    )}
                    {wasAdded && (
                      <div className="cai-shop-product-added-tag">
                        ✦ Sepete eklendi
                      </div>
                    )}
                  </div>

                  <div className="cai-shop-product-meta">
                    <div className="cai-shop-product-frequency">
                      {p.frequency}
                    </div>
                    <h3 className="cai-shop-product-name">{p.name}</h3>
                    {p.story && (
                      <p className="cai-shop-product-story">{p.story}</p>
                    )}
                    <div className="cai-shop-product-price-row">
                      <span className="cai-shop-product-price">{p.price}</span>
                      <span className="cai-shop-product-designer">
                        {p.designer}
                      </span>
                    </div>
                    <div className="cai-shop-product-actions">
                      <LuxButton
                        variant={isTrying ? "nude" : "gold"}
                        size="md"
                        onClick={() => handleTry(p)}
                      >
                        {isTrying ? "Deneniyor" : "Bedenimde Dene"}
                      </LuxButton>
                      <LuxButton
                        variant="ghost"
                        size="md"
                        onClick={() => handleBuy(p)}
                      >
                        Satın Al
                      </LuxButton>
                    </div>
                  </div>
                </article>
              );
            })}
            {filtered.length === 0 && (
              <div className="cai-tryon-empty-cat">
                Bu kategoride henüz ürün yok.
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Floating cart bar ── */}
      {mounted && cart.length > 0 && (
        <div className="cai-shop-cartbar" role="region" aria-label="Sepetim">
          <div className="cai-shop-cartbar-inner">
            <div className="cai-shop-cartbar-meta">
              <span className="cai-shop-cartbar-glyph" aria-hidden="true">
                ✦
              </span>
              <div>
                <div className="cai-shop-cartbar-count">
                  {cart.length} parça sepetinde
                </div>
                <div className="cai-shop-cartbar-sub">
                  Caelinus AI bütiği — frekanslar dünyanı bekliyor
                </div>
              </div>
            </div>
            <LuxButton
              variant="gold"
              size="lg"
              onClick={handleCheckout}
            >
              Ödemeye Geç →
            </LuxButton>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * /caelinus-ai/try-on — Caelinus AI'ın "Ürünü Dene" sayfası.
 *
 * Try-on illüzyonu (cloth simulation YOK):
 *   • Bir ürün seçildiğinde sahnenin `tryOnAccent` rengi ürünün
 *     enerji renginin (zodiac/category mapping) tonuna kayar
 *   • Sahnenin üzerinde "✦ Bedeninde · {ürün}" tag fade-in olur
 *   • Avatar'ın aura/ışık halkası nabız atar
 *   • Ürün kartı altın halka + "✦ Bedeninde" rozeti ile öne çıkar
 *   • Reading kartı transition ile değişir (animated mood line)
 *
 * Renk sistemi: zodiac → element → renk. Bikini'lerin zodiac
 * frekansları var; pareo/çanta için kategoriye göre fallback.
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

import LuxButton from "@/components/caelinus-ai/LuxButton";
import ReadingCard from "@/components/caelinus-ai/ReadingCard";
import TryOnProductCard from "@/components/caelinus-ai/TryOnProductCard";
import { products } from "@/data/products";
import {
  GENERATED_AVATAR_KEY,
  TRYON_VARIANT_COUNT,
  getVariantForProduct,
  getVariantIndexForProduct,
  loadGeneratedAvatar,
  type GeneratedAvatar,
} from "@/lib/caelinus-ai";
import type { Product } from "@/types/play";

const Caelinus3DScene = lazy(
  () => import("@/components/caelinus-ai/Caelinus3DScene"),
);

const FILTERABLE_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "all", label: "Hepsi" },
  { id: "bikini", label: "Bikini" },
  { id: "pareo", label: "Pareo" },
  { id: "bag", label: "Çanta" },
];

/* ────────── Ürün → enerji rengi mapping ────────── */

/** Zodiac → 4 element mapping (klasik astroloji). */
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
};

/** Ürünün enerji rengini hesapla — zodiac → element → renk, yoksa kategori. */
function productAccent(p: Product): string {
  if (p.zodiac && ZODIAC_TO_ELEMENT[p.zodiac]) {
    return ELEMENT_COLOR[ZODIAC_TO_ELEMENT[p.zodiac]];
  }
  return CATEGORY_FALLBACK_COLOR[p.category] || "#caa56a";
}

/** Ürünün mood cümlesi — kategori + frekansa göre. */
function productMood(p: Product): string {
  if (p.zodiac && ZODIAC_TO_ELEMENT[p.zodiac]) {
    const el = ZODIAC_TO_ELEMENT[p.zodiac];
    const moods: Record<string, string[]> = {
      fire: [
        "Yangının kıvılcımı şimdi senin omzunda.",
        "Işığın kendisini taşıyorsun.",
      ],
      water: [
        "Bir nehir gibi sarmalıyor seni.",
        "Suyun kıvrımı seninle akıyor.",
      ],
      air: [
        "Hafif, ama güçlü — hava gibi.",
        "Bir nefes — ve bedenin değişti.",
      ],
      earth: [
        "Toprağa kök saldın bu parçada.",
        "Köklerinin seramik dokusu.",
      ],
    };
    const arr = moods[el];
    return arr[p.id.charCodeAt(0) % arr.length];
  }
  return "Caelinus dokunduğunda her parça bir geçit oluyor.";
}

export default function CaelinusTryOnPage() {
  const [avatar, setAvatar] = useState<GeneratedAvatar | null>(null);
  const [mounted, setMounted] = useState(false);
  const [trying, setTrying] = useState<Product | null>(null);
  const [filter, setFilter] = useState<string>("bikini");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setAvatar(loadGeneratedAvatar());
    setMounted(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === GENERATED_AVATAR_KEY || e.key === null) {
        setAvatar(loadGeneratedAvatar());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleTry = useCallback((p: Product) => {
    setTransitioning(true);
    setTrying((cur) => (cur?.id === p.id ? null : p));
    // Kısa transition penceresi — UI'da fade efektini garanti eder
    window.setTimeout(() => setTransitioning(false), 320);
  }, []);

  const handleBuy = useCallback((p: Product) => {
    if (typeof window !== "undefined") {
      window.location.href = `/universe/shop?p=${encodeURIComponent(p.id)}`;
    }
  }, []);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? products
        : products.filter((p) => p.category === filter),
    [filter],
  );

  /* Empty state */
  if (mounted && !avatar) {
    return (
      <div className="cai-page cai-tryon-empty">
        <div className="cai-tryon-empty-card cai-fade-in">
          <div className="cai-tryon-empty-glow" aria-hidden="true" />
          <div className="cai-tryon-empty-kicker">CAELINUS AI · TRY-ON</div>
          <h1 className="cai-tryon-empty-title">Önce avatarını yarat</h1>
          <p className="cai-tryon-empty-sub">
            Try-on Caelinus AI ile yarattığın 3D bedenin üstünde çalışır.
            Selfie&apos;ni ver, frekansını okuyalım, sonra ürünleri kendi
            bedeninde dene.
          </p>
          <Link href="/caelinus-ai/avatar" className="cai-tryon-empty-cta">
            <LuxButton variant="gold" size="lg">
              ✦ Avatarımı Oluştur
            </LuxButton>
          </Link>
        </div>
      </div>
    );
  }

  const accent = trying ? productAccent(trying) : null;
  const tryOnLabel = trying ? trying.name : null;
  const variantUrl = trying ? getVariantForProduct(trying) : null;
  const variantIndex = trying ? getVariantIndexForProduct(trying) : null;

  return (
    <div className="cai-page cai-tryon-page">
      <section className="cai-hero cai-hero--narrow">
        <div className="cai-hero-kicker">CAELINUS AI · TRY-ON</div>
        <h1 className="cai-hero-title">
          Bedeninde dene — <em>satın al</em>
        </h1>
        <p className="cai-hero-sub">
          Caelinus tasarımcılarının frekanslarla işlediği parçalar, senin 3D
          bedeninde. Bir ürün seç, sahnede dene; uyduysa satın al.
        </p>
      </section>

      <div className="cai-tryon-layout">
        {/* SOL — sahne + reading */}
        <div className="cai-tryon-stage">
          <Suspense
            fallback={
              <div className="cai-canvas-fallback">
                <div className="cai-canvas-pulse" />
                <span>Bedenin yükleniyor…</span>
              </div>
            }
          >
            <Caelinus3DScene
              avatar={avatar}
              skinTone={avatar?.styleProfile.skinTone}
              animationUrl="/models/catwalk.glb"
              autoRotate
              tryOnAccent={accent}
              tryOnLabel={tryOnLabel}
              avatarUrlOverride={variantUrl}
            />
          </Suspense>

          <div className={`cai-tryon-stage-meta ${transitioning ? "is-transitioning" : ""}`}>
            <div className="cai-tryon-stage-frequency">
              {avatar?.reading?.styleIdentity.label ??
                avatar?.styleProfile.frequencyTag ??
                "Auteur"}
            </div>
            {trying ? (
              <div className="cai-tryon-stage-trying">
                <span
                  className="cai-tryon-stage-trying-dot"
                  style={{ background: accent ?? "#caa56a" }}
                />
                Şu an: <strong>{trying.name}</strong>
              </div>
            ) : (
              <div className="cai-tryon-stage-trying cai-tryon-stage-trying--idle">
                Bir parça seç — bedeninde belirsin
              </div>
            )}
          </div>

          {trying && (
            <div className="cai-tryon-mood-banner cai-fade-in" key={trying.id}>
              <span className="cai-tryon-mood-glyph" aria-hidden="true">
                ✦
              </span>
              <p>{productMood(trying)}</p>
              {variantIndex !== null && (
                <span className="cai-tryon-variant-pill">
                  Siluet {variantIndex + 1} / {TRYON_VARIANT_COUNT}
                </span>
              )}
            </div>
          )}

          {avatar?.reading && !trying && (
            <div className="cai-tryon-reading-compact">
              <ReadingCard reading={avatar.reading} variant="compact" />
            </div>
          )}

          <Link href="/caelinus-ai/avatar" className="cai-tryon-edit-link">
            ← Avatarımı Düzenle
          </Link>
        </div>

        {/* SAĞ — ürünler */}
        <div className="cai-tryon-side">
          <div className="cai-tryon-filters" role="tablist">
            {FILTERABLE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={filter === c.id}
                className={`cai-tryon-filter ${filter === c.id ? "is-active" : ""}`}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="cai-tryon-products">
            {filtered.map((p, idx) => (
              <div
                key={p.id}
                className="cai-tryon-product-wrapper cai-fade-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <TryOnProductCard
                  product={p}
                  isTrying={trying?.id === p.id}
                  onTry={handleTry}
                  onBuy={handleBuy}
                />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="cai-tryon-empty-cat">
                Bu kategoride henüz ürün yok.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

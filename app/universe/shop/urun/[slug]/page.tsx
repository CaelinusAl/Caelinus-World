/**
 * Caelinus PDP — `/universe/shop/urun/[slug]`.
 *
 * Faz 1 iskeleti. Şimdilik kaynak: `data/products.ts` statik kataloğu;
 * slug = ürün id (b1, pr2, …). Faz 2'de Supabase `atelier_items`'a
 * bağlanacak ve aynı bileşen DB satırından beslenecek.
 *
 * Sayfanın amacı manifestonun teknik karşılığı:
 *   "Avatarınla giydiğin, AI ile seçtiğin, hikâyesini yaşadığın ürün."
 * Bu nedenle iki birincil CTA var:
 *   • "Avatarımda Dene" → /universe/shop?try=<id>
 *   • "Hikâyeyi Yaşa"   → /play?preset=<zodiac>  (varsa)
 *
 * Server component — statik render. Hidrasyon yok.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { products, productsExtended } from "@/data/products";
import { absoluteUrl } from "@/lib/i18n/locale";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

import TryOnCTA from "./TryOnCTA";
import "./pdp.css";

type Params = { slug: string };

function findProduct(slug: string) {
  // Faz 1: id == slug. Faz 2'de gerçek slug alanı eklenecek.
  return products.find((p) => p.id === slug) ?? null;
}

export async function generateStaticParams(): Promise<Params[]> {
  return products.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  const locale = await getLocale();
  if (!product) {
    return {
      title: locale === "tr" ? "Ürün bulunamadı" : "Product not found",
    };
  }
  const isTr = locale === "tr";
  const title = `${product.name} — ${isTr ? "Hikâye" : "Story"}`;
  const description = product.story
    ? product.story
    : isTr
      ? "Caelinus evreninden hikâyeli bir parça."
      : "A storied piece from the Caelinus universe.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(locale, `/universe/shop/urun/${slug}`),
      type: "article",
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
    ...buildLocaleMetadata(locale, `/universe/shop/urun/${slug}`),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const locale = await getLocale();
  const isTr = locale === "tr";

  const playHref = product.zodiac
    ? `/play?archetype=cosmic&zodiac=${encodeURIComponent(product.zodiac)}&scene=night`
    : "/play";

  // 3D outfit binding'i olan ürünleri PDP'de "Direkt Giydir" CTA ile
  // göster — yan paneli açmaya gerek kalmadan ürün avatarın üstüne
  // düşer. Yoksa sadece "Avatarımda Dene" gösterilir.
  const productExt = productsExtended.find((p) => p.id === product.id);
  const has3D = !!productExt?.outfitGlb;

  return (
    <main className="pdp-scene">
      <div className="pdp-shell">
        <nav className="pdp-breadcrumbs" aria-label={isTr ? "Yol" : "Breadcrumb"}>
          <Link href="/universe">{isTr ? "Evren" : "Universe"}</Link>
          <span className="pdp-breadcrumbs-sep">/</span>
          <Link href="/universe/shop">{isTr ? "Mağaza" : "Shop"}</Link>
          <span className="pdp-breadcrumbs-sep">/</span>
          <span>{product.name}</span>
        </nav>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="pdp-hero">
          <div className="pdp-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="pdp-image"
              loading="eager"
            />
            {product.frequency ? (
              <div className="pdp-freq-tag">{product.frequency}</div>
            ) : null}
            {product.zodiac ? (
              <div className="pdp-zodiac-tag">{product.zodiac}</div>
            ) : null}
          </div>

          <div className="pdp-info">
            <div className="pdp-kicker">
              ✦ {isTr ? "Caelinus · Hikâyeli Parça" : "Caelinus · Storied Piece"}
            </div>
            <h1 className="pdp-title">{product.name}</h1>
            <div className="pdp-designer">
              {isTr ? "Tasarımcı" : "Designer"}: <strong>{product.designer}</strong>
              <span style={{ opacity: 0.5, padding: "0 8px" }}>·</span>
              {product.brand}
            </div>

            {product.story ? (
              <p className="pdp-story-lead">{product.story}</p>
            ) : null}

            <div className="pdp-price">{product.price}</div>

            <div className="pdp-cta-row">
              <TryOnCTA
                productId={product.id}
                hasOutfitGlb={has3D}
                isTr={isTr}
              />
              <Link href={playHref} className="pdp-cta">
                {isTr ? "Hikâyeyi Yaşa" : "Live the Story"}
              </Link>
              <Link href="/manifesto" className="pdp-cta pdp-cta--ghost">
                {isTr ? "Manifesto" : "Manifesto"}
              </Link>
            </div>
          </div>
        </section>

        {/* ── PROVENANCE ───────────────────────────────────── */}
        <section className="pdp-section">
          <p className="pdp-section-heading">{isTr ? "Köken Hattı" : "Provenance"}</p>
          <div className="pdp-provenance">
            <div className="pdp-provenance-cell">
              <span className="pdp-provenance-label">{isTr ? "Marka" : "Brand"}</span>
              <span className="pdp-provenance-value">{product.brand}</span>
            </div>
            <div className="pdp-provenance-cell">
              <span className="pdp-provenance-label">{isTr ? "Tasarımcı" : "Designer"}</span>
              <span className="pdp-provenance-value">{product.designer}</span>
            </div>
            <div className="pdp-provenance-cell">
              <span className="pdp-provenance-label">{isTr ? "Frekans" : "Frequency"}</span>
              <span className="pdp-provenance-value">{product.frequency ?? "—"}</span>
            </div>
            <div className="pdp-provenance-cell">
              <span className="pdp-provenance-label">{isTr ? "Burç" : "Zodiac"}</span>
              <span className="pdp-provenance-value">{product.zodiac ?? "—"}</span>
            </div>
          </div>
        </section>

        {/* ── STORY CHAPTERS — Faz 2 placeholder ──────────── */}
        <section className="pdp-section">
          <p className="pdp-section-heading">{isTr ? "Hikâyenin Bölümleri" : "Chapters of the Story"}</p>
          <h2 className="pdp-section-title">
            {isTr ? "Bu parçanın yolculuğu" : "The journey of this piece"}
          </h2>
          <p className="pdp-section-body">
            {isTr
              ? "Caelinus'ta her ürünün bir kökeni, bir tasarımcısı ve bir hikâyesi vardır. Faz 2'de bu bölümler doğrudan tasarımcının atölyesinden, gerçek üretim adımlarıyla beslenecek."
              : "Every Caelinus piece has an origin, a designer and a story. In Phase 2 these chapters will be fed directly from the atelier, with the real production steps."}
          </p>

          <div className="pdp-chapters">
            <article className="pdp-chapter">
              <div className="pdp-chapter-mark">I — {isTr ? "Niyet" : "Intent"}</div>
              <h3 className="pdp-chapter-title">{isTr ? "İlk Frekans" : "The First Frequency"}</h3>
              <p className="pdp-chapter-text">
                {isTr
                  ? "Tasarımcının ilk eskiziyle birlikte parçanın enerjisi belirlenir; hangi Solfeggio bandına demir atacağı burada seçilir."
                  : "With the designer's first sketch, the piece's energy is set — the Solfeggio band it will anchor to is chosen here."}
              </p>
            </article>

            <article className="pdp-chapter">
              <div className="pdp-chapter-mark">II — {isTr ? "Köken" : "Origin"}</div>
              <h3 className="pdp-chapter-title">{isTr ? "Toprak ve Eller" : "Earth & Hands"}</h3>
              <p className="pdp-chapter-text">
                {isTr
                  ? "Kumaşın ya da malzemenin geldiği bölge, üretici kolektifi ve nasıl işlendiği bu bölümde anlatılır."
                  : "The region the fabric or material came from, the producer collective and how it was worked are told in this chapter."}
              </p>
            </article>

            <article className="pdp-chapter">
              <div className="pdp-chapter-mark">III — {isTr ? "Beden" : "Body"}</div>
              <h3 className="pdp-chapter-title">{isTr ? "Avatardan Sana" : "From Avatar to You"}</h3>
              <p className="pdp-chapter-text">
                {isTr
                  ? "Kendi 3D avatarında dene, AI'nin önerdiği kombinle gör. Sipariş ettiğinde fiziksel parça aynı titreşimle gelir."
                  : "Try it on your own 3D avatar, see it in the look the AI proposes. When you order, the physical piece arrives with the same vibration."}
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

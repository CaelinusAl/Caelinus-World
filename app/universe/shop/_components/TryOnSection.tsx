"use client";

/**
 * TryOnSection — Caelinus 3D mesh + bone-bound garment try-on.
 *
 * Vizyon (Faz 4 / pivot): "Sen 3D mesin. Ürünleri kendi bedeninde dene."
 *
 * Önceki sürüm (Faz 3.4–3.5) 2D AI portresine dönmüştü çünkü 3D mesh'in
 * yüzünde saç/kaş/göz/dudak eksikti. Ama o yaklaşım kullanıcıyı
 * "ürünü gerçekten giymek" hissinden uzaklaştırıyordu — sadece
 * bir resim göstermek try-on değildi. Şimdi geri dönüyoruz: 3D
 * mesh + bone-bound GLB garmentler. Yüz detayları zaman içinde
 * face-deform metrics + opsiyonel face texture decal ile yakınlaşır.
 *
 * Bu bileşen şunları yapar:
 *   1. Kayıtlı `AvatarConfig`'i (boy, kilo, vücut tipi, ten rengi)
 *      yükler. Hiç yoksa CTA gösterip /universe/shop/avatar'a
 *      yönlendirir — kullanıcı önce bedenini şekillendirmeli.
 *   2. `AvatarScene`'i (R3F Canvas) render eder; ModelAvatar bone'a
 *      göre vücudu deform eder, opsiyonel face texture'u alın
 *      kemiğine giydirir, opsiyonel face metrics'i morph target'a
 *      aktarır.
 *   3. `useOutfitBindings()` ile seçilen ürünleri (try-on +
 *      dressedSlots) `OutfitBindingLayer` içinde Hips/Spine/Chest
 *      bone'larına attach eder. Her garment otomatik avatar
 *      yüksekliğine ölçeklenir, gerekli body part'lar mask
 *      edilir.
 *   4. `StageControls` + outfit chip bar + `TryOnProductPanel`
 *      yan tarafta — kullanıcı tek tıkla burç/kategori değiştirir,
 *      "giydir" / "sepete at" akışı korunur.
 *
 * Gate logic — yumuşatıldı: artık AI portrait gerekmez. Avatar
 * config kaydedilmiş (default'tan farklı en az bir alan) ya da
 * face texture varsa kullanıcı "avatarı var" sayılır. Hiç yoksa
 * tek hedefli onboarding kartı gösterilir.
 */

import Link from "next/link";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSceneStore } from "@/stores/scene-store";
import {
  useWardrobeStore,
  useOutfitBindings,
  useActiveTryOnProduct,
} from "@/stores/wardrobe-store";
import { useCartStore } from "@/stores/cart-store";
import { scenes } from "@/data/scenes";
import { archetypes } from "@/data/archetypes";
import { productsExtended } from "@/data/products";
import {
  loadAvatarConfig,
  hasUserAvatarConfig,
  loadAvatarBodyId,
  AVATAR_BODY_ID_KEY,
} from "@/lib/avatar-storage";
import {
  getBody,
  DEFAULT_BODY_ID,
  AVATARS_IN_PRODUCTION,
  type BodyEntry,
} from "@/lib/avatar-bodies";
import AvatarsInProduction from "@/components/avatar/AvatarsInProduction";
import { TryOnProductPanel } from "@/components/shop/TryOnProductPanel";
import type { OutfitId } from "@/types/play";
import StageControls from "./StageControls";
import { buildIllusionState } from "@/lib/shop/illusion-tryon";
import "./tryon-empty.css";

const AvatarScene = lazy(() => import("@/components/shop/AvatarScene"));
const OutfitTransformTuner = lazy(
  () => import("@/components/shop/OutfitTransformTuner"),
);

const IS_DEV = process.env.NODE_ENV === "development";

const FACE_TEXTURE_KEY = "caelinus_face_texture";

const ZODIAC_CHIPS: OutfitId[] = [
  "none", "virgo", "taurus", "aries", "leo", "scorpio", "gemini",
  "cancer", "capricorn", "sagittarius", "pisces", "libra", "aquarius",
];

export default function TryOnSection() {
  /* ── Stage / archetype ─────────────────────────────────── */
  const stageId = useSceneStore((s) => s.stageId);
  const archetypeId = useSceneStore((s) => s.archetypeId);
  const scene = scenes.find((s) => s.id === stageId) ?? scenes[0];
  const archetype =
    archetypes.find((a) => a.id === archetypeId) ?? archetypes[0];

  /* ── Wardrobe store ────────────────────────────────────── */
  const tryOnProduct = useWardrobeStore((s) => s.tryOnProduct);
  const setTryOnProduct = useWardrobeStore((s) => s.setTryOnProduct);
  const outfitStatus = useWardrobeStore((s) => s.outfitStatus);
  const setOutfitStatus = useWardrobeStore((s) => s.setOutfitStatus);
  const catwalkOn = useWardrobeStore((s) => s.catwalkOn);
  const debugBindings = useWardrobeStore((s) => s.debugBindings);
  const showTuner = useWardrobeStore((s) => s.showTuner);
  const tunerOverride = useWardrobeStore((s) => s.tunerOverride);
  const setTunerOverride = useWardrobeStore((s) => s.setTunerOverride);
  const outfitBindings = useOutfitBindings();
  const addToCart = useCartStore((s) => s.addToCart);

  // ── Try-on illüzyon meta'sı ───────────────────────────────
  // Ürün → enerji rengi + tag + mood. AvatarScene aura/tag bunu
  // okur, ProductSection / TryOnProductPanel mood'u gösterebilir.
  //
  // useActiveTryOnProduct hem `tryOnProduct` hem `dressedSlots`'taki
  // ana ürünü kapsar — PDP'den "Giydir" (?dress=...) ile gelinen
  // akışta da illüzyon halkası ve tag tetiklenir.
  const activeTryOnProduct = useActiveTryOnProduct();
  const illusion = useMemo(
    () => buildIllusionState(activeTryOnProduct),
    [activeTryOnProduct],
  );

  /* ── 3D body + face state ──────────────────────────────── */
  // Hydration safety: localStorage sadece client'ta. SSR'da default
  // gösterip mounted olunca gerçek değerleri alıyoruz, "avatarı yok"
  // flash'i olmasın diye.
  const [mounted, setMounted] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState(() => loadAvatarConfig());
  const [hasAvatar, setHasAvatar] = useState(false);
  const [faceTextureUrl, setFaceTextureUrl] = useState<string | null>(null);
  const [selectedBody, setSelectedBody] = useState<BodyEntry>(() =>
    getBody(DEFAULT_BODY_ID),
  );

  useEffect(() => {
    setAvatarConfig(loadAvatarConfig());
    setHasAvatar(hasUserAvatarConfig());
    setFaceTextureUrl(localStorage.getItem(FACE_TEXTURE_KEY));

    // Caelinus body library — kullanıcı önceden hangi mesh'i seçtiyse
    setSelectedBody(getBody(loadAvatarBodyId()));

    setMounted(true);

    // Storage update'lerini dinle — kullanıcı /universe/shop/avatar'da
    // değişiklik yapıp dönerse bu sahne yansıtsın (cross-tab + same-tab).
    const onStorage = (e: StorageEvent) => {
      if (e.key === FACE_TEXTURE_KEY) {
        setFaceTextureUrl(e.newValue);
      }
      if (e.key === null || e.key === "caelinus-avatar-config") {
        setAvatarConfig(loadAvatarConfig());
        setHasAvatar(hasUserAvatarConfig());
      }
      if (e.key === AVATAR_BODY_ID_KEY || e.key === null) {
        setSelectedBody(getBody(loadAvatarBodyId()));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ── Avatarlar yapımda — kütüphane boşken 3D yerine placeholder ── */
  if (AVATARS_IN_PRODUCTION) {
    return (
      <div className="shop-avatar-stage">
        <AvatarsInProduction />
      </div>
    );
  }

  /* Body seçimi yapılmışsa "avatarı var" sayılır — gate aç. */
  const effectiveHasAvatar = hasAvatar;

  /* ── Empty state — kullanıcı henüz bedenini şekillendirmedi ─── */
  if (mounted && !effectiveHasAvatar) {
    return (
      <div className="shop-avatar-stage">
        <div className="tryon-empty-scene">
          <div className="tryon-empty-glow" aria-hidden="true" />
          <div className="tryon-empty-card">
            <p className="tryon-empty-kicker">✦ Caelinus Avatar Studio</p>
            <h2 className="tryon-empty-title">
              Önce bedenini şekillendir
            </h2>
            <p className="tryon-empty-sub">
              Caelinus Shop'taki ürünleri 3D bedeninde dene. Vücut
              tipini, boyunu, ten rengini seç — istersen yüzünü de
              yükle. Kıyafet seçimi otomatik olarak senin bedenine
              giyecek.
            </p>
            <ol className="tryon-empty-steps">
              <li>
                <span className="tryon-empty-step-num">1</span>
                Vücut tipi · boy · kilo · ten rengi
              </li>
              <li>
                <span className="tryon-empty-step-num">2</span>
                Opsiyonel: yüzünü yükle (face-deform)
              </li>
              <li>
                <span className="tryon-empty-step-num">3</span>
                Shop'ta ürünleri 3D bedeninde dene
              </li>
            </ol>
            <Link
              href={`/universe/shop/avatar?next=${encodeURIComponent("/universe/shop")}`}
              className="tryon-empty-cta"
            >
              ✦ Avatarımı Oluştur
            </Link>
            <p className="tryon-empty-fineprint">
              Veriler sadece tarayıcında kalır (localStorage).
              Değiştirmek istediğinde geri dönüp sliders'ı yeniden
              ayarlayabilirsin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Active state — 3D mesh + bone-bound garmentler ────── */
  return (
    <div className="shop-avatar-stage">
      <div className="tryon-scene-layout">
        <div className="tryon-scene-canvas">
          <Suspense
            fallback={
              <div className="shop-3d-loading">
                <div className="shop-3d-loading-text">
                  Işık bedenin yükleniyor…
                </div>
              </div>
            }
          >
            <AvatarScene
              stageId={stageId}
              skinTone={avatarConfig.skinTone || archetype.tone}
              auraColor={archetype.tone}
              avatarConfig={avatarConfig}
              avatarUrl={selectedBody.url}
              // Texture'lı external mesh'lerin (selin.glb, model_texture)
              // kendi yüzü var — selfie face decal/deform'u SADECE
              // Caelinus default bald mesh'te uygula (skin tone override
              // de aynı body'lere ait).
              faceTextureUrl={
                selectedBody.supportsSkinToneOverride ? faceTextureUrl : null
              }
              animationUrl={catwalkOn ? "/models/catwalk.glb" : null}
              outfitBindings={outfitBindings}
              debugBindings={debugBindings}
              onOutfitStatus={setOutfitStatus}
              // Illüzyon try-on: ürün seçildiğinde sahnenin aura halkası
              // ürünün enerji rengine kayar, üstte "✦ Bedeninde · {ürün}"
              // tag'i fade-in olur. Cloth simulation YOK — pareo, çanta,
              // takı gibi GLB binding'i olmayan kategorilerde bile "denedim"
              // hissi veriyor. Bikini gibi gerçek GLB'si olan ürünlerde
              // ise binding ile birlikte ek vurgu olur.
              tryOnAccent={illusion.accent}
              tryOnLabel={illusion.tag}
            />
          </Suspense>

          {/* Avatarımı düzenle quick link — kullanıcı sahne içinde
              bedenini değiştirmek istediğinde tek tıkla builder'a. */}
          <Link
            href={`/universe/shop/avatar?next=${encodeURIComponent("/universe/shop")}`}
            className="tryon-edit-avatar"
          >
            ✦ Avatarımı Düzenle
          </Link>
        </div>

        <div className="tryon-scene-sidebar">
          <TryOnProductPanel
            product={tryOnProduct}
            onAddToCart={addToCart}
            outfitStatus={outfitStatus}
            onClose={() => setTryOnProduct(null)}
          />
          {!tryOnProduct && (
            <div className="tryon-sidebar-empty">
              <p>Bir ürün seç — 3D bedeninde otomatik giyecek.</p>
            </div>
          )}
        </div>
      </div>

      <StageControls />

      <section className="shop-outfit-bar">
        {ZODIAC_CHIPS.map((id) => (
          <button
            key={id}
            className={`shop-outfit-chip ${
              tryOnProduct?.zodiac === id || (!tryOnProduct && id === "none")
                ? "active"
                : ""
            }`}
            onClick={() => {
              if (id === "none") {
                setTryOnProduct(null);
              } else {
                const match = productsExtended.find((p) => p.zodiac === id);
                if (match) setTryOnProduct(match);
              }
            }}
          >
            {id === "none" ? "Clear" : id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </section>

      <div className="shop-stage-info">
        <div className="shop-stage-scene-name">
          <span className="shop-stage-label">Sahne:</span> {scene.label} —{" "}
          {scene.sub}
        </div>
        <div className="shop-stage-archetype-name">
          <span className="shop-stage-label">Arketip:</span> {archetype.label}
        </div>
      </div>

      {IS_DEV && showTuner && tryOnProduct?.outfitGlb && (
        <Suspense fallback={null}>
          <OutfitTransformTuner
            config={tunerOverride ?? tryOnProduct.outfitGlb}
            onChange={setTunerOverride}
            productName={tryOnProduct.name}
          />
        </Suspense>
      )}
    </div>
  );
}

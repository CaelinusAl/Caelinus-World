"use client";

import { lazy, Suspense, useMemo } from "react";
import { useSceneStore } from "@/stores/scene-store";
import { useWardrobeStore, useOutfitBindings } from "@/stores/wardrobe-store";
import { useCartStore } from "@/stores/cart-store";
import { scenes } from "@/data/scenes";
import { archetypes } from "@/data/archetypes";
import { productsExtended } from "@/data/products";
import { loadAvatarConfig } from "@/lib/avatar-storage";
import { TryOnProductPanel } from "@/components/shop/TryOnProductPanel";
import type { OutfitId } from "@/types/play";
import StageControls from "./StageControls";

const AvatarScene = lazy(() => import("@/components/shop/AvatarScene"));
const OutfitTransformTuner = lazy(() => import("@/components/shop/OutfitTransformTuner"));

const IS_DEV = process.env.NODE_ENV === "development";

const ZODIAC_CHIPS: OutfitId[] = [
  "none", "virgo", "taurus", "aries", "leo", "scorpio", "gemini",
  "cancer", "capricorn", "sagittarius", "pisces", "libra", "aquarius",
];

export default function TryOnSection() {
  const stageId = useSceneStore((s) => s.stageId);
  const archetypeId = useSceneStore((s) => s.archetypeId);
  const scene = scenes.find((s) => s.id === stageId) ?? scenes[0];
  const archetype = archetypes.find((a) => a.id === archetypeId) ?? archetypes[0];

  const tryOnProduct = useWardrobeStore((s) => s.tryOnProduct);
  const setTryOnProduct = useWardrobeStore((s) => s.setTryOnProduct);
  const dressedSlots = useWardrobeStore((s) => s.dressedSlots);
  const outfitStatus = useWardrobeStore((s) => s.outfitStatus);
  const setOutfitStatus = useWardrobeStore((s) => s.setOutfitStatus);
  const catwalkOn = useWardrobeStore((s) => s.catwalkOn);
  const debugBindings = useWardrobeStore((s) => s.debugBindings);
  const showTuner = useWardrobeStore((s) => s.showTuner);
  const tunerOverride = useWardrobeStore((s) => s.tunerOverride);
  const setTunerOverride = useWardrobeStore((s) => s.setTunerOverride);
  const outfitBindings = useOutfitBindings();

  const addToCart = useCartStore((s) => s.addToCart);

  const avatarConfig = useMemo(() => loadAvatarConfig(), []);
  const faceTextureUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("caelinus_face_texture");
  }, []);

  return (
    <div className="shop-avatar-stage">
      <div className="tryon-scene-layout">
        <div className="tryon-scene-canvas">
          <Suspense
            fallback={
              <div className="shop-3d-loading">
                <div className="shop-3d-loading-text">Isik bedenin yukleniyor...</div>
              </div>
            }
          >
            <AvatarScene
              stageId={stageId}
              skinTone={archetype.tone}
              avatarConfig={avatarConfig}
              faceTextureUrl={faceTextureUrl}
              animationUrl={catwalkOn ? "/models/catwalk.glb" : null}
              outfitBindings={outfitBindings}
              debugBindings={debugBindings}
              onOutfitStatus={setOutfitStatus}
            />
          </Suspense>

          <div className="shop-stage-sidecard left">
            <div className="shop-stage-sidecard-title">ARKETIP</div>
            <div className="shop-stage-sidecard-text">{archetype.label}</div>
          </div>
          <div className="shop-stage-sidecard right">
            <div className="shop-stage-sidecard-title">SAHNE</div>
            <div className="shop-stage-sidecard-text">{scene.label} — {scene.sub}</div>
          </div>

          {dressedSlots.bag && (
            <div className="shop-accessory-badge shop-badge-bag">{dressedSlots.bag.name}</div>
          )}
          {dressedSlots.shoes && (
            <div className="shop-accessory-badge shop-badge-shoes">{dressedSlots.shoes.name}</div>
          )}
          {dressedSlots.accessory && (
            <div className="shop-accessory-badge shop-badge-accessory">{dressedSlots.accessory.name}</div>
          )}
        </div>

        <div className="tryon-scene-sidebar">
          <TryOnProductPanel
            product={tryOnProduct}
            onAddToCart={addToCart}
            outfitStatus={outfitStatus}
            onClose={() => setTryOnProduct(null)}
          />
          {!tryOnProduct && (
            <div style={{ textAlign: "center", padding: "40px 12px", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
              Urun secin — avatar uzerinde deneyin
            </div>
          )}
        </div>
      </div>

      <StageControls />

      <section className="shop-outfit-bar">
        {ZODIAC_CHIPS.map((id) => (
          <button
            key={id}
            className={`shop-outfit-chip ${tryOnProduct?.zodiac === id || (!tryOnProduct && id === "none") ? "active" : ""}`}
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
          <span className="shop-stage-label">Sahne:</span> {scene.label} — {scene.sub}
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

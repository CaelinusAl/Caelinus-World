"use client";

import React, { Suspense, useMemo, useState, useCallback, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { SceneId, OutfitBindingConfig } from "@/types/play";
import type { AvatarConfig } from "@/types/avatar";
import { DEFAULT_AVATAR } from "@/types/avatar";
import type { AvatarFaceDeformConfig } from "@/lib/face";
import ModelAvatar from "./ModelAvatar";
import OutfitBindingLayer, { type OutfitBindingStatus } from "./scene/OutfitBindingLayer";
import {
  StageEnvironment,
  SceneLighting,
  AccessoriesLayer,
  EnergyPlatform,
  EnergyParticles,
  Portal,
  getStageConfig,
} from "./scene";

const DEFAULT_MODEL_PATH = "/models/caelinus-body-base-fem.glb";
const FEET_Y = -0.03;

/* ═══════════════════════════════════════════
   Props
   ═══════════════════════════════════════════ */

export type AvatarSceneProps = {
  stageId: SceneId;
  skinTone?: string;
  auraColor?: string;
  avatarConfig?: AvatarConfig;
  /** Custom avatar GLB URL — Avaturn avatarı varsa onu kullan, yoksa default Caelinus mesh */
  avatarUrl?: string | null;
  /** Data URL or fetchable path — head decal */
  faceTextureUrl?: string | null;
  /** Parametric face shape deform */
  faceDeform?: AvatarFaceDeformConfig | null;
  /** External animation GLB (e.g. "/models/caelinus-catwalk.glb") */
  animationUrl?: string | null;
  /** Runtime-bound outfit GLB configs */
  outfitBindings?: OutfitBindingConfig[];
  /** Show binding debug overlays in 3D scene */
  debugBindings?: boolean;
  /** Outfit binding lifecycle callback (loading/ready/error) */
  onOutfitStatus?: (status: OutfitBindingStatus) => void;

  /**
   * Try-on illüzyon rengi — bir ürün aktif denenirken sahnenin
   * conic-gradient rim halkası + tepe key-light bu renge kayar.
   * `lib/shop/illusion-tryon.ts → productAccent(p)` ile hesaplanır.
   * null/undefined → sahne nötr-luxury altın halkada kalır.
   */
  tryOnAccent?: string | null;
  /**
   * Try-on tag etiketi — sahnenin üst kısmında "✦ Bedeninde · {ürün}"
   * rozeti olarak fade-in animasyonu ile gösterilir.
   */
  tryOnLabel?: string | null;
};

/* ═══════════════════════════════════════════
   Error Boundary — graceful fallback for GL crashes
   ═══════════════════════════════════════════ */

type EBProps = { children: ReactNode; fallback: ReactNode };
type EBState = { hasError: boolean };

class SceneErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ═══════════════════════════════════════════
   Inner scene — everything that lives inside Canvas
   ═══════════════════════════════════════════ */

function SceneContent({
  stageId,
  skinTone,
  auraColor,
  avatarConfig,
  avatarUrl,
  faceTextureUrl,
  faceDeform,
  animationUrl,
  outfitBindings,
  debugBindings = false,
  onOutfitStatus,
  tryOnAccent,
}: AvatarSceneProps) {
  const stage = useMemo(() => getStageConfig(stageId), [stageId]);
  const skin = skinTone || avatarConfig?.skinTone || DEFAULT_AVATAR.skinTone;
  // Try-on aksent varsa aura'yı onunla bas; yoksa stage portal rengi.
  const aura = tryOnAccent || auraColor || stage.portalColor;
  const modelUrl = avatarUrl || DEFAULT_MODEL_PATH;

  // Avatar root ref for outfit bone attachment
  const [avatarRoot, setAvatarRoot] = useState<THREE.Object3D | null>(null);
  const handleSceneReady = useCallback((s: THREE.Object3D) => setAvatarRoot(s), []);

  return (
    <>
      <StageEnvironment stage={stage} />
      <SceneLighting stage={stage} />

      <Portal color={stage.portalColor} />

      <ModelAvatar
        url={modelUrl}
        skinTone={skin}
        auraColor={aura}
        avatarConfig={avatarConfig}
        faceTextureUrl={faceTextureUrl ?? null}
        faceDeform={faceDeform ?? null}
        animationUrl={animationUrl ?? null}
        onSceneReady={handleSceneReady}
      />

      <AccessoriesLayer />

      {/* Phase C: Runtime-bound GLB outfits */}
      {outfitBindings?.map((cfg) => (
        <OutfitBindingLayer
          key={cfg.glbUrl}
          config={cfg}
          avatarRoot={avatarRoot}
          debug={debugBindings}
          onStatus={onOutfitStatus}
        />
      ))}

      <EnergyPlatform color={stage.platformColor} />
      <EnergyParticles color={stage.particleColor} />

      <ContactShadows
        position={[0, FEET_Y, 0]}
        opacity={0.3}
        scale={4}
        blur={2.5}
        far={4}
        color={aura}
      />

      {/* OrbitControls auto-rotate hızı: drei/three default 2.0 ≈
       * 30 saniye/devir; biz 0.6'da ~100s/devir'e yavaşlatmıştık,
       * kullanıcı "11 saniye geri dönüş" hissini buradan alıyordu.
       * Şimdi 4.0'a çekiyoruz — 1 devir ≈ 7.5 saniye, izlenebilir
       * ama yavaş değil. damping factor sıkı (0.18) ki release
       * sonrası ~3sn'de durulsun. */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.18}
        minPolarAngle={Math.PI / 2.35}
        maxPolarAngle={Math.PI / 1.82}
        autoRotate
        autoRotateSpeed={4.0}
        rotateSpeed={0.5}
        target={[0, 1.3, 0]}
        makeDefault
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   Loading fallback
   ═══════════════════════════════════════════ */

function LoadingFallback() {
  return (
    <div className="shop-3d-loading">
      <div className="shop-3d-loading-text">Isik bedenin yukleniyor...</div>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="shop-3d-loading">
      <div className="shop-3d-loading-text" style={{ color: "rgba(255,120,120,0.7)" }}>
        Sahne yuklenemedi. Sayfayi yenile.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Exported component
   ═══════════════════════════════════════════ */

export default function AvatarScene(props: AvatarSceneProps) {
  const { tryOnAccent = null, tryOnLabel = null } = props;
  // CSS değişkeni: rim/tag halkasının rengi try-on rengine kayar.
  const sceneStyle = tryOnAccent
    ? ({ ["--shop-tryon-accent" as string]: tryOnAccent } as React.CSSProperties)
    : undefined;
  const isTrying = Boolean(tryOnLabel);

  return (
    <SceneErrorBoundary fallback={<ErrorFallback />}>
      <div
        className={`shop-avatar-canvas ${isTrying ? "is-trying" : ""}`}
        style={sceneStyle}
      >
        {/*
         * Try-on illüzyon overlay'leri:
         *   • shop-canvas-rim — conic-gradient halka, is-trying iken pulse
         *   • shop-canvas-tryon-tag — "✦ Bedeninde · {ürün}" rozeti
         * Cloth simulation YOK; bu CSS katmanları sahnede kıyafetin
         * "değişme" hissini tek başına vermek için yeterli (caelinus-ai
         * sayfasında aynı pattern başarıyla çalışıyor).
         */}
        <div className="shop-canvas-rim" aria-hidden="true" />
        {tryOnLabel && (
          <div className="shop-canvas-tryon-tag" key={tryOnLabel}>
            <span className="shop-canvas-tryon-tag-glyph">✦</span>
            <span className="shop-canvas-tryon-tag-text">
              Bedeninde · <strong>{tryOnLabel}</strong>
            </span>
          </div>
        )}

        <Suspense fallback={<LoadingFallback />}>
          <Canvas camera={{ position: [0, 1.3, 7.0], fov: 32 }}>
            <Suspense fallback={null}>
              <SceneContent {...props} />
            </Suspense>
          </Canvas>
        </Suspense>
      </div>
    </SceneErrorBoundary>
  );
}

useGLTF.preload(DEFAULT_MODEL_PATH);

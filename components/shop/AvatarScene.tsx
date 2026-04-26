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

const MODEL_PATH = "/models/caelinus-avatar.glb";
const FEET_Y = -0.03;

/* ═══════════════════════════════════════════
   Props
   ═══════════════════════════════════════════ */

export type AvatarSceneProps = {
  stageId: SceneId;
  skinTone?: string;
  auraColor?: string;
  avatarConfig?: AvatarConfig;
  /** Data URL or fetchable path — head decal */
  faceTextureUrl?: string | null;
  /** Parametric face shape deform */
  faceDeform?: AvatarFaceDeformConfig | null;
  /** External animation GLB (e.g. "/models/catwalk.glb") */
  animationUrl?: string | null;
  /** Runtime-bound outfit GLB configs */
  outfitBindings?: OutfitBindingConfig[];
  /** Show binding debug overlays in 3D scene */
  debugBindings?: boolean;
  /** Outfit binding lifecycle callback (loading/ready/error) */
  onOutfitStatus?: (status: OutfitBindingStatus) => void;
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
  faceTextureUrl,
  faceDeform,
  animationUrl,
  outfitBindings,
  debugBindings = false,
  onOutfitStatus,
}: AvatarSceneProps) {
  const stage = useMemo(() => getStageConfig(stageId), [stageId]);
  const skin = skinTone || avatarConfig?.skinTone || DEFAULT_AVATAR.skinTone;
  const aura = auraColor || stage.portalColor;

  // Avatar root ref for outfit bone attachment
  const [avatarRoot, setAvatarRoot] = useState<THREE.Object3D | null>(null);
  const handleSceneReady = useCallback((s: THREE.Object3D) => setAvatarRoot(s), []);

  return (
    <>
      <StageEnvironment stage={stage} />
      <SceneLighting stage={stage} />

      <Portal color={stage.portalColor} />

      <ModelAvatar
        url={MODEL_PATH}
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

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.35}
        maxPolarAngle={Math.PI / 1.82}
        autoRotate
        autoRotateSpeed={0.6}
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
  return (
    <SceneErrorBoundary fallback={<ErrorFallback />}>
      <div className="shop-avatar-canvas">
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

useGLTF.preload(MODEL_PATH);

"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  MeshReflectorMaterial,
  Sparkles,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import type { AvatarConfig } from "@/types/avatar";
import type { OutfitBindingConfig } from "@/types/play";
import type { AvatarFaceDeformConfig, ModelCapabilities } from "@/lib/face";
import { AVATARS_IN_PRODUCTION } from "@/lib/avatar-bodies";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import AvatarsInProduction from "@/components/avatar/AvatarsInProduction";
import ModelAvatar from "./ModelAvatar";
import OutfitBindingLayer, { type OutfitBindingStatus } from "./scene/OutfitBindingLayer";

const DEFAULT_MODEL_PATH = "/models/caelinus-avatar-pbr.glb";

// Kamera ev konumu — double-click reset bu değerlere yumuşak döner.
// Avatar BASE_HEIGHT≈2.8 birime ölçeklenir (ModelAvatar). Hedef avatar
// merkezinde (y≈1.4) + fov=26 ile avatar kareyi DOLDURUR: ayaklar alta,
// baş üste yakın; altta-üstte boş zemin/gökyüzü kalmaz.
const CAMERA_FOV = 26;
const HOME_POS = new THREE.Vector3(0, 1.4, 7.4);
const HOME_TARGET = new THREE.Vector3(0, 1.4, 0);

type Props = {
  config: AvatarConfig;
  /** GLB URL — Avaturn avatar varsa onu, yoksa default Caelinus mesh. */
  avatarUrl?: string | null;
  faceTextureUrl?: string | null;
  faceDeform?: AvatarFaceDeformConfig | null;
  animationUrl?: string | null;
  outfitBindings?: OutfitBindingConfig[];
  onCapabilities?: (caps: ModelCapabilities) => void;
  onOutfitStatus?: (status: OutfitBindingStatus) => void;
};

/**
 * Sinematik ışık süpürmesi — yumuşak bir spotlight'ı avatarın önünden
 * yavaşça soldan sağa geçirir (DressX / Vision Pro "tarama" hissi).
 * reduced-motion'da sabit kalır.
 */
function LightSweep({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = reduced ? 0.4 : (Math.sin(state.clock.getElapsedTime() * 0.32) + 1) / 2;
    ref.current.position.x = -3.4 + t * 6.8;
    ref.current.target.position.x = (-3.4 + t * 6.8) * 0.35;
    ref.current.target.updateMatrixWorld();
  });
  return (
    <spotLight
      ref={ref}
      position={[0, 4.6, 3.2]}
      angle={0.42}
      penumbra={1}
      intensity={reduced ? 18 : 36}
      distance={16}
      decay={1.4}
      color="#fff3df"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-bias={-0.0004}
    />
  );
}

/**
 * Premium ayna-oda zemini — koyu, hafif yansıtıcı mermer hissi.
 * MeshReflectorMaterial gerçek runtime yansıma üretir (avatar + ışıklar
 * zeminde belli belirsiz görünür → lüks "fitting room" atmosferi).
 */
function MirrorFloor({ reduced }: { reduced: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[14, 64]} />
      <MeshReflectorMaterial
        resolution={reduced ? 256 : 512}
        mirror={0.55}
        blur={[320, 110]}
        mixBlur={8}
        mixStrength={1.1}
        roughness={0.85}
        depthScale={1.0}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        metalness={0.45}
        color="#070710"
      />
    </mesh>
  );
}

/**
 * Çift tıkla kamerayı ev konumuna yumuşak döndür (damped lerp ~0.6s).
 * makeDefault'lı OrbitControls'u useThree(state.controls) ile alır.
 */
function DoubleClickReset() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  // drei OrbitControls makeDefault → state.controls'a yazılır.
  const controls = useThree((s) => s.controls) as
    | { target: THREE.Vector3; update: () => void; enabled: boolean }
    | null;
  const animating = useRef(false);

  useEffect(() => {
    const dom = gl.domElement;
    const onDbl = () => { animating.current = true; };
    dom.addEventListener("dblclick", onDbl);
    return () => dom.removeEventListener("dblclick", onDbl);
  }, [gl]);

  useFrame(() => {
    if (!animating.current || !controls) return;
    camera.position.lerp(HOME_POS, 0.12);
    controls.target.lerp(HOME_TARGET, 0.12);
    controls.update();
    if (camera.position.distanceTo(HOME_POS) < 0.02) {
      camera.position.copy(HOME_POS);
      controls.target.copy(HOME_TARGET);
      controls.update();
      animating.current = false;
    }
  });
  return null;
}

export default function AvatarConfigurator({
  config,
  avatarUrl = null,
  faceTextureUrl = null,
  faceDeform = null,
  animationUrl = null,
  outfitBindings = [],
  onCapabilities,
  onOutfitStatus,
}: Props) {
  const [avatarRoot, setAvatarRoot] = useState<THREE.Object3D | null>(null);
  const handleSceneReady = useCallback((scene: THREE.Object3D) => {
    setAvatarRoot(scene);
  }, []);

  const reduced = useMemo(
    () => (typeof window !== "undefined" ? prefersReducedMotion() : false),
    [],
  );

  if (AVATARS_IN_PRODUCTION) {
    return <AvatarsInProduction className="avcfg-canvas" />;
  }
  const modelUrl = avatarUrl || DEFAULT_MODEL_PATH;

  return (
    <div className="avcfg-canvas">
      {/* Mirror Room — sinematik lüks giyinme odası.
          Kamera çerçevesi: z=7.4 + fov=30 ile avatar viewport'un ~%75'ini
          kaplar. dpr clamp + ACES tonemapping ile foto-gerçek PBR. */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          powerPreference: "high-performance",
        }}
        camera={{ position: [HOME_POS.x, HOME_POS.y, HOME_POS.z], fov: CAMERA_FOV }}
      >
        <Suspense fallback={null}>
          {/* Koyu sinematik arka plan + çok hafif sis (derinlik) */}
          <color attach="background" args={["#05050b"]} />
          <fog attach="fog" args={["#05050b", 9, 22]} />

          {/* HDRI benzeri ortam — ağ gerektirmez (Lightformer panelleri).
              Avatarın PBR materyalleri bu paneli yansıtır → gerçek
              stüdyo aydınlatması hissi. */}
          <Environment resolution={256} frames={1}>
            <Lightformer
              intensity={1.7}
              position={[0, 5, -6]}
              scale={[10, 6, 1]}
              color="#cdd6ff"
            />
            <Lightformer
              intensity={1.1}
              position={[4, 3, 4]}
              scale={[6, 8, 1]}
              color="#fff1de"
            />
            <Lightformer
              intensity={0.8}
              position={[-5, 2, 3]}
              scale={[6, 8, 1]}
              color="#b9a3ff"
            />
          </Environment>

          {/* Ambient + hemisphere — yumuşak taban dolgu */}
          <ambientLight intensity={0.45} />
          <hemisphereLight args={["#3a3550", "#04040a", 0.55]} />

          {/* Key ışık — gölge üreten ana kaynak (yumuşak) */}
          <directionalLight
            position={[3, 5, 4]}
            intensity={1.5}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0004}
            shadow-camera-near={1}
            shadow-camera-far={18}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={6}
            shadow-camera-bottom={-1}
          />
          {/* Rim / arka ışık — siluet kenarını ayırır (Vision Pro hissi) */}
          <directionalLight position={[-3, 3.5, -4]} intensity={1.3} color="#8ea0ff" />
          {/* Soğuk dolgu */}
          <directionalLight position={[-2, 1.5, 3]} intensity={0.5} color="#a9b6ff" />

          {/* Sinematik ışık süpürmesi */}
          <LightSweep reduced={reduced} />

          <ModelAvatar
            key={modelUrl}
            url={modelUrl}
            skinTone={config.skinTone}
            auraColor="#8b6fff"
            avatarConfig={config}
            faceTextureUrl={faceTextureUrl}
            faceDeform={faceDeform}
            animationUrl={animationUrl}
            onCapabilities={onCapabilities}
            onSceneReady={handleSceneReady}
          />

          {outfitBindings.map((binding) => (
            <OutfitBindingLayer
              key={binding.glbUrl}
              config={binding}
              avatarRoot={avatarRoot}
              onStatus={onOutfitStatus}
            />
          ))}

          {/* Yansıtıcı premium zemin */}
          <MirrorFloor reduced={reduced} />

          {/* Ayaklara yumuşak temas gölgesi — yerçekimi hissi */}
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.45}
            scale={9}
            blur={3}
            far={5}
            resolution={reduced ? 256 : 512}
            color="#04040a"
          />

          {/* Havada süzülen ince toz zerreleri — lüks atmosfer */}
          {!reduced && (
            <Sparkles
              count={48}
              scale={[6, 5, 4]}
              position={[0, 1.6, 0]}
              size={2.2}
              speed={0.18}
              opacity={0.5}
              color="#f3e8d0"
            />
          )}

          {/*
           * OrbitControls — enableDamping ile yumuşak inertia, pinch-zoom
           * (touch) ve drag-rotate yerleşik. Pan kapalı (avatar merkezde
           * kalsın). Çift tık DoubleClickReset ile eve döner.
           */}
          <OrbitControls
            enablePan={false}
            enableZoom
            enableDamping
            dampingFactor={0.12}
            rotateSpeed={0.85}
            zoomSpeed={0.7}
            minDistance={4}
            maxDistance={12}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.9}
            target={[HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z]}
            makeDefault
          />
          <DoubleClickReset />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(DEFAULT_MODEL_PATH);

"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import type { AvatarConfig } from "@/types/avatar";
import type { AvatarFaceDeformConfig, ModelCapabilities } from "@/lib/face";
import { AVATARS_IN_PRODUCTION } from "@/lib/avatar-bodies";
import AvatarsInProduction from "@/components/avatar/AvatarsInProduction";
import ModelAvatar from "./ModelAvatar";

const DEFAULT_MODEL_PATH = "/models/caelinus-avatar.glb";

type Props = {
  config: AvatarConfig;
  /** GLB URL — Avaturn avatar varsa onu, yoksa default Caelinus mesh. */
  avatarUrl?: string | null;
  faceTextureUrl?: string | null;
  faceDeform?: AvatarFaceDeformConfig | null;
  animationUrl?: string | null;
  onCapabilities?: (caps: ModelCapabilities) => void;
};

export default function AvatarConfigurator({
  config,
  avatarUrl = null,
  faceTextureUrl = null,
  faceDeform = null,
  animationUrl = null,
  onCapabilities,
}: Props) {
  if (AVATARS_IN_PRODUCTION) {
    return <AvatarsInProduction className="avcfg-canvas" />;
  }
  const modelUrl = avatarUrl || DEFAULT_MODEL_PATH;
  return (
    <div className="avcfg-canvas">
      {/* Kamera çerçevesi: avatar 2.8m yükseklik (170 cm referans), tam
          boy görünür kalsın diye z=8.5 + fov=32. min/max distance avatar
          yüksekliğine göre genişletildi (3 → 4, 8 → 12) ki kullanıcı
          orbit ederken yakın gelmeye zorlanmasın. */}
      <Canvas camera={{ position: [0, 1.4, 8.5], fov: 32 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#080c14"]} />
          <fog attach="fog" args={["#080c14", 8, 18]} />

          <ambientLight intensity={1.0} />
          <directionalLight position={[2, 3, 2]} intensity={1.6} color="#ffffff" />
          <directionalLight position={[-2, 1, -2]} intensity={0.7} color="#7b8dff" />

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
          />

          <ContactShadows
            position={[0, -0.02, 0]}
            opacity={0.25}
            scale={4}
            blur={2.5}
            far={4}
            color="#8b6fff"
          />

          <Environment preset="night" />

          {/*
           * OrbitControls: enableDamping=true + tight dampingFactor
           * (0.18) sayesinde release sonrası inertia ~3 saniye içinde
           * sönüyor (önceki "11 saniye geri dönüş" hissinin kaynağı
           * varsayılan damping=0.05'in çok yumuşak olmasıydı).
           *
           * minDistance/maxDistance avatar yüksekliği için genişletildi
           * — kullanıcı zoom out edip rahatça baksın, sonra zoom in
           * etse tekrar yakına dönmesin.
           */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableDamping
            dampingFactor={0.18}
            minDistance={4}
            maxDistance={14}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.7}
            target={[0, 1.4, 0]}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(DEFAULT_MODEL_PATH);

"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import type { AvatarConfig } from "@/types/avatar";
import type { AvatarFaceDeformConfig, ModelCapabilities } from "@/lib/face";
import ModelAvatar from "./ModelAvatar";

const MODEL_PATH = "/models/caelinus-avatar.glb";

type Props = {
  config: AvatarConfig;
  faceTextureUrl?: string | null;
  faceDeform?: AvatarFaceDeformConfig | null;
  animationUrl?: string | null;
  onCapabilities?: (caps: ModelCapabilities) => void;
};

export default function AvatarConfigurator({
  config,
  faceTextureUrl = null,
  faceDeform = null,
  animationUrl = null,
  onCapabilities,
}: Props) {
  return (
    <div className="avcfg-canvas">
      <Canvas camera={{ position: [0, 1.3, 5.5], fov: 34 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#080c14"]} />
          <fog attach="fog" args={["#080c14", 6, 14]} />

          <ambientLight intensity={1.0} />
          <directionalLight position={[2, 3, 2]} intensity={1.6} color="#ffffff" />
          <directionalLight position={[-2, 1, -2]} intensity={0.7} color="#7b8dff" />

          <ModelAvatar
            url={MODEL_PATH}
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

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={8}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.7}
            target={[0, 1.3, 0]}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);

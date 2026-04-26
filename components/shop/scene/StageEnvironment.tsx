"use client";

import { memo, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import type { StageConfig } from "./stage-config";

type Props = {
  stage: StageConfig;
};

function StageEnvironmentInner({ stage }: Props) {
  const tex = useLoader(THREE.TextureLoader, stage.bgImage);

  const envPreset = useMemo(() => stage.envPreset, [stage.envPreset]);

  return (
    <>
      <color attach="background" args={[stage.bgColor]} />
      <fog attach="fog" args={[stage.fogColor, stage.fogNear, stage.fogFar]} />

      {/* Scene background plane */}
      <mesh position={[0, 1.3, -4.5]}>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial
          map={tex}
          toneMapped={false}
          transparent
          opacity={stage.bgOpacity}
        />
      </mesh>

      <Environment preset={envPreset} />
    </>
  );
}

export const StageEnvironment = memo(StageEnvironmentInner);

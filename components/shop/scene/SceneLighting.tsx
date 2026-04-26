"use client";

import { memo } from "react";
import type { StageConfig } from "./stage-config";

type Props = {
  stage: StageConfig;
};

function SceneLightingInner({ stage }: Props) {
  return (
    <>
      <ambientLight intensity={stage.ambientIntensity} />
      <directionalLight
        position={stage.mainLightPos}
        intensity={stage.mainLightIntensity}
        color={stage.mainLightColor}
        castShadow
      />
      <directionalLight
        position={stage.fillLightPos}
        intensity={stage.fillLightIntensity}
        color={stage.fillLightColor}
      />
    </>
  );
}

export const SceneLighting = memo(SceneLightingInner);

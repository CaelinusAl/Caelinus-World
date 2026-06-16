"use client";

/**
 * WorldScenes — sahne registry'si. WebGL dünyasının "hangi sahne" anahtarı.
 *
 * Şeyma'nın repo'su geldiğinde yeni sahneler buraya eklenir (gaia, sanctum,
 * atölye…). Şu an hepsi CosmosScene'e düşüyor (tek ambient sahne).
 */

import CosmosScene from "./scenes/CosmosScene";
import type { WorldSceneId } from "@/lib/world/config";
import type { WorldQuality } from "@/lib/world/store";
import type { Resonance } from "@/lib/world/resonance";

type Props = {
  scene: WorldSceneId;
  reducedMotion: boolean;
  quality: WorldQuality;
  resonance: Resonance;
};

export default function WorldScenes({
  scene,
  reducedMotion,
  quality,
  resonance,
}: Props) {
  switch (scene) {
    // case "gaia":    return <GaiaScene ... />;      // Faz 1 — Şeyma sahnesi
    // case "sanctum": return <SanctumScene ... />;   // Faz 1 — Şeyma sahnesi
    case "cosmos":
    case "gaia":
    case "sanctum":
    default:
      return (
        <CosmosScene
          reducedMotion={reducedMotion}
          quality={quality}
          resonance={resonance}
        />
      );
  }
}

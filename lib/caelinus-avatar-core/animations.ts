/**
 * Caelinus Avatar Core — Animation Preset Library.
 *
 * Mevcut tek animasyon: `/models/caelinus-catwalk.glb` (Mixamo retarget).
 * "Idle" (statik) ve "Catwalk" preset'leri var; ileride başka GLB
 * animasyonları eklendiğinde aynı yapıyla genişler.
 */

import type { AnimationPreset } from "./types";

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: "idle",
    label: "Statik",
    tagline: "Bedeninin duruşu, başka söze gerek yok",
    glbUrl: null,
    autoplay: false,
  },
  {
    id: "catwalk",
    label: "Catwalk",
    tagline: "Podyum yürüyüşü — Caelinus ritmiyle",
    glbUrl: "/models/caelinus-catwalk.glb",
    autoplay: true,
  },
];

export const DEFAULT_ANIMATION_ID = "catwalk";

export function getAnimation(id: string | null | undefined): AnimationPreset {
  if (!id) {
    return (
      ANIMATION_PRESETS.find((a) => a.id === DEFAULT_ANIMATION_ID) ??
      ANIMATION_PRESETS[0]
    );
  }
  return (
    ANIMATION_PRESETS.find((a) => a.id === id) ??
    ANIMATION_PRESETS.find((a) => a.id === DEFAULT_ANIMATION_ID) ??
    ANIMATION_PRESETS[0]
  );
}

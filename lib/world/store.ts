/**
 * Caelinus WebGL Dünyası — paylaşılan çalışma-zamanı durumu.
 *
 * Global canvas ile sayfa-içi etkileşimleri köprülemek için. Bir sayfa
 * `useWorldScene("gaia")` ile aktif sahneyi (geçici olarak) değiştirebilir;
 * canvas bunu dinler ve yumuşakça geçer. Kalite/azaltılmış-hareket gibi
 * cihaz-uyumu sinyalleri de buradan akar.
 */

import { create } from "zustand";
import type { WorldSceneId } from "./config";
import { DEFAULT_RESONANCE, type Resonance } from "./resonance";

export type WorldQuality = "high" | "medium" | "low";

type WorldState = {
  /** Sayfa tarafından override edilmiş sahne (null → route eşlemesi geçerli). */
  sceneOverride: WorldSceneId | null;
  /** Cihaz performansına göre düşürülen kalite kademesi. */
  quality: WorldQuality;
  /** prefers-reduced-motion açık mı — animasyonları dindir. */
  reducedMotion: boolean;
  /** Kullanıcının frekansına göre türetilen sahne parametreleri (5D). */
  resonance: Resonance;

  setSceneOverride: (scene: WorldSceneId | null) => void;
  setQuality: (q: WorldQuality) => void;
  setReducedMotion: (b: boolean) => void;
  setResonance: (r: Resonance) => void;
};

export const useWorldStore = create<WorldState>((set) => ({
  sceneOverride: null,
  quality: "high",
  reducedMotion: false,
  resonance: DEFAULT_RESONANCE,
  setSceneOverride: (scene) => set({ sceneOverride: scene }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setResonance: (resonance) => set({ resonance }),
}));

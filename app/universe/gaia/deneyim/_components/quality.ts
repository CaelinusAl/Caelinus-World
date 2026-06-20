/**
 * Adaptif kalite — Desktop Ultra / Mobil Optimize.
 * Cihaz sinyallerine göre render bütçesi (dpr, partikül, post-FX) seçer.
 */

export type QualityTier = "ultra" | "high" | "mobile";

export type QualitySettings = {
  tier: QualityTier;
  dpr: [number, number];
  envResolution: number;
  shafts: number;
  forest: number;
  flowers: number;
  pollen: number;
  postDoF: boolean;
  postGrain: boolean;
};

const ULTRA: QualitySettings = {
  tier: "ultra",
  dpr: [1, 2],
  envResolution: 512,
  shafts: 8,
  forest: 110,
  flowers: 240,
  pollen: 260,
  postDoF: true,
  postGrain: true,
};

const HIGH: QualitySettings = {
  tier: "high",
  dpr: [1, 1.5],
  envResolution: 384,
  shafts: 6,
  forest: 80,
  flowers: 180,
  pollen: 160,
  postDoF: true,
  postGrain: false,
};

const MOBILE: QualitySettings = {
  tier: "mobile",
  dpr: [1, 1.5],
  envResolution: 256,
  shafts: 4,
  forest: 48,
  flowers: 110,
  pollen: 90,
  postDoF: false,
  postGrain: false,
};

export function detectQuality(): QualitySettings {
  if (typeof navigator === "undefined") return HIGH;
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Mobile|Opera Mini/i.test(ua);
  const cores = (navigator.hardwareConcurrency as number | undefined) ?? 4;
  const mem = ((navigator as unknown as { deviceMemory?: number }).deviceMemory) ?? 4;

  if (isMobile || cores <= 4 || mem <= 4) return MOBILE;
  if (cores >= 8 && mem >= 8) return ULTRA;
  return HIGH;
}

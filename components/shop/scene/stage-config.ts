import type { SceneId } from "@/types/play";

export type StageConfig = {
  id: SceneId;
  label: string;
  sub: string;
  bgImage: string;
  envPreset: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  fogColor: string;
  fogNear: number;
  fogFar: number;
  bgColor: string;
  ambientIntensity: number;
  mainLightColor: string;
  mainLightIntensity: number;
  mainLightPos: [number, number, number];
  fillLightColor: string;
  fillLightIntensity: number;
  fillLightPos: [number, number, number];
  portalColor: string;
  platformColor: string;
  particleColor: string;
  bgOpacity: number;
};

export const STAGE_CONFIGS: Record<SceneId, StageConfig> = {
  beach: {
    id: "beach",
    label: "Beach",
    sub: "Solar",
    bgImage: "/play/scenes/beach.jpg",
    envPreset: "sunset",
    fogColor: "#0a1628",
    fogNear: 6,
    fogFar: 14,
    bgColor: "#050a14",
    ambientIntensity: 1.0,
    mainLightColor: "#ffe8c8",
    mainLightIntensity: 1.6,
    mainLightPos: [3, 4, 2],
    fillLightColor: "#7bc8ff",
    fillLightIntensity: 0.6,
    fillLightPos: [-2, 1, -2],
    portalColor: "#fbbf24",
    platformColor: "#2fd6ff",
    particleColor: "#fbbf24",
    bgOpacity: 0.6,
  },
  coffee: {
    id: "coffee",
    label: "Coffee",
    sub: "Daylight",
    bgImage: "/play/scenes/coffee.jpg",
    envPreset: "apartment",
    fogColor: "#12100e",
    fogNear: 5,
    fogFar: 13,
    bgColor: "#0e0c0a",
    ambientIntensity: 1.1,
    mainLightColor: "#fff4e0",
    mainLightIntensity: 1.4,
    mainLightPos: [2, 3, 3],
    fillLightColor: "#c8a878",
    fillLightIntensity: 0.5,
    fillLightPos: [-2, 1, -1],
    portalColor: "#d4a76a",
    platformColor: "#d4a76a",
    particleColor: "#f5d9a8",
    bgOpacity: 0.5,
  },
  night: {
    id: "night",
    label: "Night",
    sub: "Magnetic",
    bgImage: "/play/scenes/night.jpg",
    envPreset: "night",
    fogColor: "#05070d",
    fogNear: 5,
    fogFar: 12,
    bgColor: "#000000",
    ambientIntensity: 0.7,
    mainLightColor: "#a885ff",
    mainLightIntensity: 1.8,
    mainLightPos: [1, 3, 2],
    fillLightColor: "#ff6baa",
    fillLightIntensity: 0.7,
    fillLightPos: [-3, 1, -2],
    portalColor: "#a885ff",
    platformColor: "#a885ff",
    particleColor: "#c4b5fd",
    bgOpacity: 0.65,
  },
  resort: {
    id: "resort",
    label: "Resort",
    sub: "Luxury",
    bgImage: "/play/scenes/resort.jpg",
    envPreset: "dawn",
    fogColor: "#0d0818",
    fogNear: 6,
    fogFar: 14,
    bgColor: "#08050f",
    ambientIntensity: 0.9,
    mainLightColor: "#ffd4a8",
    mainLightIntensity: 1.5,
    mainLightPos: [2, 4, 2],
    fillLightColor: "#9f7bff",
    fillLightIntensity: 0.6,
    fillLightPos: [-2, 1, -2],
    portalColor: "#c4a0ff",
    platformColor: "#c4a0ff",
    particleColor: "#e8d4ff",
    bgOpacity: 0.55,
  },
};

export function getStageConfig(id: SceneId): StageConfig {
  return STAGE_CONFIGS[id] ?? STAGE_CONFIGS.beach;
}

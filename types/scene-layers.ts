/**
 * ═══════════════════════════════════════════════════════════════
 * SCENE LAYER ARCHITECTURE — Future-Phase Type Foundation
 * ═══════════════════════════════════════════════════════════════
 *
 * Every visual element on the avatar belongs to a LAYER.
 * Layers are rendered in a defined order and share a common
 * config interface so the binding system can manage them uniformly.
 *
 * RENDER ORDER (back → front):
 *
 *   0  body          Avatar base mesh
 *   1  body_mask     Hidden body parts (e.g. torso under a dress)
 *   2  underwear     Base underwear / skin-tight layer
 *   3  bottom        Bikini bottom, skirt, pants
 *   4  top           Bikini top, shirt, jacket
 *   5  one_piece     Full-body swimwear, dress, jumpsuit
 *   6  outerwear     Coat, cape, pareo wrap
 *   7  footwear      Shoes, heels, sandals
 *   8  bag           Handbag, clutch, backpack
 *   9  hair          Hairstyle GLB
 *  10  face_overlay  Face texture projection (makeup, face paint)
 *  11  head_acc      Hat, tiara, headband, earrings
 *  12  body_acc      Necklace, bracelet, ring, belt
 *  13  fx            Aura, particles, glow effects
 *
 * Each layer maps to a specific renderOrder range so Three.js
 * draws them correctly even with transparency.
 */

import type { BindingTarget } from "./play";

/* ═══════════════════════════════════════════
   Layer IDs
   ═══════════════════════════════════════════ */

export type SceneLayerId =
  | "body"
  | "body_mask"
  | "underwear"
  | "bottom"
  | "top"
  | "one_piece"
  | "outerwear"
  | "footwear"
  | "bag"
  | "hair"
  | "face_overlay"
  | "head_acc"
  | "body_acc"
  | "fx";

export const LAYER_RENDER_ORDER: Record<SceneLayerId, number> = {
  body:         0,
  body_mask:    1,
  underwear:    2,
  bottom:       3,
  top:          4,
  one_piece:    5,
  outerwear:    6,
  footwear:     7,
  bag:          8,
  hair:         9,
  face_overlay: 10,
  head_acc:     11,
  body_acc:     12,
  fx:           13,
};

/* ═══════════════════════════════════════════
   Common Wearable Config
   ─────────────────────────────────────────
   Shared interface for anything that gets
   loaded and attached to the avatar:
   outfits, accessories, hair, face overlays.
   ═══════════════════════════════════════════ */

export type WearableConfig = {
  /** Unique identifier (usually product ID or asset slug) */
  id: string;

  /** Which layer this wearable belongs to */
  layer: SceneLayerId;

  /** Asset source — GLB URL for 3D, image URL for texture overlay */
  assetUrl: string;

  /** Asset type — determines which loader/renderer to use */
  assetType: "glb" | "texture" | "procedural";

  /** Primary skeleton bone to attach to */
  bindingTarget: BindingTarget;

  /** Fallback bones if primary not found */
  fallbackTargets?: BindingTarget[];

  /** Local position offset relative to binding target */
  position: [number, number, number];

  /** Local euler rotation (radians) */
  rotation: [number, number, number];

  /** Uniform or per-axis scale */
  scale: number | [number, number, number];

  /** Z-offset for polygon offset (anti-clipping) */
  zOffset: number;

  /** Copy avatar bone transforms to wearable bones per frame */
  syncAnimation: boolean;

  /** Avatar mesh parts to HIDE when this wearable is active.
   *  Values are mesh name substrings or regex patterns.
   *  Example: ["torso", "upperBody"] → hides any avatar mesh
   *  whose name includes "torso" or "upperBody". */
  hiddenMeshParts?: string[];

  /** Optional material overrides applied after load */
  materialOverrides?: WearableMaterialOverride;

  /** Priority within the same layer (higher = rendered later) */
  priority?: number;

  /** Whether this wearable is currently active/visible */
  enabled?: boolean;
};

/* ═══════════════════════════════════════════
   Material Override Config
   ═══════════════════════════════════════════ */

export type WearableMaterialOverride = {
  /** Override base color (hex) */
  color?: string;
  /** Override opacity (0–1) */
  opacity?: number;
  /** Override metalness (0–1) */
  metalness?: number;
  /** Override roughness (0–1) */
  roughness?: number;
  /** Override emissive color (hex) */
  emissiveColor?: string;
  /** Override emissive intensity */
  emissiveIntensity?: number;
  /** Use double-sided rendering */
  doubleSide?: boolean;
  /** Enable/disable transparency */
  transparent?: boolean;
};

/* ═══════════════════════════════════════════
   Body Mask Config
   ─────────────────────────────────────────
   When a wearable covers a body region, the
   underlying avatar mesh should be hidden or
   clipped to avoid z-fighting.

   This config defines the masking strategy.
   ═══════════════════════════════════════════ */

export type BodyMaskStrategy = "hide" | "clip" | "shrink";

export type BodyMaskConfig = {
  /** Which body mesh parts to affect (name substring match) */
  parts: string[];

  /** How to handle the masked parts:
   *  - "hide":   set visible=false (simplest, best perf)
   *  - "clip":   vertex displacement inward (smoother edges)
   *  - "shrink": scale bone regions slightly inward
   */
  strategy: BodyMaskStrategy;

  /** Scale factor for "shrink" strategy (default 0.95) */
  shrinkFactor?: number;
};

/* ═══════════════════════════════════════════
   Hair Config Extension
   ═══════════════════════════════════════════ */

export type HairConfig = WearableConfig & {
  layer: "hair";

  /** Physics simulation hint (future cloth/hair sim) */
  simType?: "none" | "spring" | "cloth";

  /** Gravity multiplier for sim (1 = normal) */
  simGravity?: number;

  /** Wind responsiveness (0 = none, 1 = full) */
  simWind?: number;

  /** Color tint override (hex) — applied as vertex color multiply */
  tintColor?: string;
};

/* ═══════════════════════════════════════════
   Face Overlay Config Extension
   ═══════════════════════════════════════════ */

export type FaceOverlayConfig = WearableConfig & {
  layer: "face_overlay";

  /** Blend mode for the face texture */
  blendMode?: "normal" | "multiply" | "overlay" | "screen";

  /** Opacity of the face overlay (0–1) */
  blendOpacity?: number;

  /** Specific face regions to apply to */
  regions?: ("full" | "eyes" | "lips" | "skin" | "cheeks")[];
};

/* ═══════════════════════════════════════════
   Cloth Sim Fallback Config (future)
   ═══════════════════════════════════════════ */

export type ClothSimConfig = {
  /** Simulation quality level */
  quality: "off" | "low" | "medium" | "high";

  /** Number of solver iterations per frame */
  iterations?: number;

  /** Gravity strength */
  gravity?: number;

  /** Wind vector [x, y, z] */
  wind?: [number, number, number];

  /** Cloth stiffness (0 = silk, 1 = leather) */
  stiffness?: number;

  /** Damping factor */
  damping?: number;

  /** Pinned vertices — bone names whose vertices shouldn't move */
  pinnedBones?: string[];
};

/* ═══════════════════════════════════════════
   Scene Layer State
   ─────────────────────────────────────────
   Runtime state managed by the scene controller.
   Maps layer IDs to their active wearable configs.
   ═══════════════════════════════════════════ */

export type SceneLayerState = Partial<Record<SceneLayerId, WearableConfig[]>>;

/* ═══════════════════════════════════════════
   Layer Capability Declaration
   ─────────────────────────────────────────
   Each layer component declares what it can do.
   Used by the scene controller to validate configs
   and show appropriate UI.
   ═══════════════════════════════════════════ */

export type LayerCapability = {
  id: SceneLayerId;
  label: string;
  maxItems: number;
  supportedAssetTypes: WearableConfig["assetType"][];
  supportsBodyMask: boolean;
  supportsClothSim: boolean;
};

export const LAYER_CAPABILITIES: LayerCapability[] = [
  { id: "body",         label: "Body",           maxItems: 1, supportedAssetTypes: ["glb"],                supportsBodyMask: false, supportsClothSim: false },
  { id: "body_mask",    label: "Body Mask",      maxItems: 8, supportedAssetTypes: ["procedural"],         supportsBodyMask: true,  supportsClothSim: false },
  { id: "underwear",    label: "Underwear",      maxItems: 1, supportedAssetTypes: ["glb", "texture"],     supportsBodyMask: true,  supportsClothSim: false },
  { id: "bottom",       label: "Bottom",         maxItems: 1, supportedAssetTypes: ["glb", "texture"],     supportsBodyMask: true,  supportsClothSim: true  },
  { id: "top",          label: "Top",            maxItems: 1, supportedAssetTypes: ["glb", "texture"],     supportsBodyMask: true,  supportsClothSim: true  },
  { id: "one_piece",    label: "One Piece",      maxItems: 1, supportedAssetTypes: ["glb", "texture"],     supportsBodyMask: true,  supportsClothSim: true  },
  { id: "outerwear",    label: "Outerwear",      maxItems: 1, supportedAssetTypes: ["glb", "texture"],     supportsBodyMask: false, supportsClothSim: true  },
  { id: "footwear",     label: "Footwear",       maxItems: 2, supportedAssetTypes: ["glb"],                supportsBodyMask: true,  supportsClothSim: false },
  { id: "bag",          label: "Bag",            maxItems: 1, supportedAssetTypes: ["glb"],                supportsBodyMask: false, supportsClothSim: false },
  { id: "hair",         label: "Hair",           maxItems: 1, supportedAssetTypes: ["glb"],                supportsBodyMask: false, supportsClothSim: true  },
  { id: "face_overlay", label: "Face Overlay",   maxItems: 3, supportedAssetTypes: ["texture"],            supportsBodyMask: false, supportsClothSim: false },
  { id: "head_acc",     label: "Head Accessory", maxItems: 4, supportedAssetTypes: ["glb"],                supportsBodyMask: false, supportsClothSim: false },
  { id: "body_acc",     label: "Body Accessory", maxItems: 6, supportedAssetTypes: ["glb"],                supportsBodyMask: false, supportsClothSim: false },
  { id: "fx",           label: "Effects",        maxItems: 4, supportedAssetTypes: ["procedural"],         supportsBodyMask: false, supportsClothSim: false },
];

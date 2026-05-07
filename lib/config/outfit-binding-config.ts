import * as THREE from "three";
import type { OutfitBindingConfig, BindingTarget } from "@/types/play";

/* ═══════════════════════════════════════════
   Defaults
   ═══════════════════════════════════════════ */

export const DEFAULT_OUTFIT_BINDING: OutfitBindingConfig = {
  glbUrl: "",
  bindingTarget: "hips",
  fallbackTargets: ["spine", "Hips", "mixamorigHips"],
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
  zOffset: 0.002,
  syncAnimation: true,
};

/* ═══════════════════════════════════════════
   Category presets
   ═══════════════════════════════════════════ */

export const BINDING_PRESETS: Record<string, Partial<OutfitBindingConfig>> = {
  bikini_top: {
    layer: "top",
    bindingTarget: "chest",
    fallbackTargets: ["spine1", "Spine", "mixamorigSpine1"],
    position: [0, 0, 0],
    scale: 1,
    targetFraction: 0.18,
    zOffset: 0.003,
    syncAnimation: true,
    hiddenMeshParts: [
      "upperBody",
      "torso_upper",
      // External avatarlar (Avaturn vb.) — default top mesh'i gizle
      "Wolf3D_Outfit_Top",
      "outfit_top",
      "avaturn_top",
      "Top",
    ],
  },
  bikini_bottom: {
    layer: "bottom",
    bindingTarget: "hips",
    fallbackTargets: ["spine", "Hips", "mixamorigHips"],
    position: [0, 0, 0],
    scale: 1,
    targetFraction: 0.18,
    zOffset: 0.003,
    syncAnimation: true,
    hiddenMeshParts: [
      "lowerBody",
      "torso_lower",
      "Wolf3D_Outfit_Bottom",
      "outfit_bottom",
      "avaturn_bottom",
      "Bottom",
      "Pants",
    ],
  },
  bikini: {
    layer: "one_piece",
    bindingTarget: "hips",
    fallbackTargets: ["Hips", "mixamorigHips", "pelvis", "spine"],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    targetFraction: 0.42,
    zOffset: 0.003,
    syncAnimation: false,
    hiddenMeshParts: [
      "torso",
      // External avatarlarda full outfit gizle
      "Wolf3D_Outfit_Top",
      "Wolf3D_Outfit_Bottom",
      "outfit_top",
      "outfit_bottom",
      "avaturn_top",
      "avaturn_bottom",
      "Top",
      "Bottom",
      "Pants",
    ],
  },
  one_piece: {
    layer: "one_piece",
    bindingTarget: "hips",
    fallbackTargets: ["spine", "Hips", "mixamorigHips"],
    position: [0, 0, 0],
    scale: 1,
    targetFraction: 0.55,
    zOffset: 0.003,
    syncAnimation: true,
    hiddenMeshParts: [
      "torso",
      "upperBody",
      "lowerBody",
      "Wolf3D_Outfit_Top",
      "Wolf3D_Outfit_Bottom",
      "Wolf3D_Outfit_Footwear",
      "outfit_top",
      "outfit_bottom",
      "outfit_footwear",
      "avaturn_top",
      "avaturn_bottom",
      "avaturn_shoes",
      "Top",
      "Bottom",
      "Pants",
      "Shoes",
    ],
  },
  pareo: {
    layer: "outerwear",
    bindingTarget: "hips",
    fallbackTargets: ["spine", "Hips", "mixamorigHips"],
    position: [0, -0.05, 0],
    scale: 1,
    targetFraction: 0.55,
    zOffset: 0.004,
    syncAnimation: true,
  },
  bag: {
    layer: "bag",
    bindingTarget: "leftHand",
    fallbackTargets: ["LeftHand", "mixamorigLeftHand", "Hand_L"],
    position: [0.15, -0.3, 0.1],
    scale: 0.5,
    targetFraction: 0.18,
    zOffset: 0,
    syncAnimation: false,
  },
  heels: {
    layer: "footwear",
    bindingTarget: "leftFoot",
    fallbackTargets: ["LeftFoot", "mixamorigLeftFoot", "Foot_L"],
    position: [0, 0, 0],
    scale: 1,
    targetFraction: 0.10,
    zOffset: 0.002,
    syncAnimation: false,
    hiddenMeshParts: ["foot"],
  },
  hair: {
    layer: "hair",
    bindingTarget: "head",
    fallbackTargets: ["Head", "mixamorigHead"],
    position: [0, 0.02, 0],
    scale: 1,
    targetFraction: 0.18,
    zOffset: 0,
    syncAnimation: true,
    hiddenMeshParts: ["hair", "defaultHair"],
  },
  earring: {
    layer: "head_acc",
    bindingTarget: "head",
    fallbackTargets: ["Head", "mixamorigHead"],
    position: [0, 0, 0],
    scale: 0.3,
    targetFraction: 0.05,
    zOffset: 0,
    syncAnimation: true,
  },
  necklace: {
    layer: "body_acc",
    bindingTarget: "neck",
    fallbackTargets: ["Neck", "mixamorigNeck", "chest"],
    position: [0, -0.05, 0.08],
    scale: 1,
    targetFraction: 0.12,
    zOffset: 0.001,
    syncAnimation: true,
  },
  bracelet: {
    layer: "body_acc",
    bindingTarget: "leftHand",
    fallbackTargets: ["LeftHand", "mixamorigLeftHand"],
    position: [0, 0.05, 0],
    scale: 1,
    zOffset: 0,
    syncAnimation: true,
  },
  hat: {
    layer: "head_acc",
    bindingTarget: "head",
    fallbackTargets: ["Head", "mixamorigHead"],
    position: [0, 0.12, 0],
    scale: 1,
    zOffset: 0,
    syncAnimation: true,
  },
  jewelry: {
    layer: "body_acc",
    bindingTarget: "head",
    fallbackTargets: ["Head", "mixamorigHead"],
    position: [0, 0, 0],
    scale: 0.3,
    zOffset: 0,
    syncAnimation: false,
  },
};

/* ═══════════════════════════════════════════
   Body-region bone aliases — comprehensive
   mapping across Mixamo, Blender, DAZ, RPM,
   Unreal and custom naming conventions.
   ═══════════════════════════════════════════ */

export const BONE_ALIASES: Record<string, string[]> = {
  hips:      ["Hips", "hips", "mixamorigHips", "Pelvis", "pelvis",
              "Root", "root", "J_Bip_C_Hips", "CC_Base_Hip",
              "hip_03", "pelvis_04"],
  spine:     ["Spine", "spine", "mixamorigSpine", "Spine1", "spine1",
              "J_Bip_C_Spine", "CC_Base_Spine01",
              "chestLower_041"],
  spine1:    ["Spine1", "spine1", "mixamorigSpine1", "Spine2", "spine2",
              "J_Bip_C_Spine2", "CC_Base_Spine02",
              "chestUpper_042"],
  chest:     ["Chest", "chest", "mixamorigSpine2", "UpperChest", "upperchest",
              "Spine2", "spine2", "J_Bip_C_Chest", "CC_Base_NeckTwist01",
              "chestUpper_042", "chestLower_041"],
  neck:      ["Neck", "neck", "mixamorigNeck", "J_Bip_C_Neck", "CC_Base_Neck",
              "neckLower_091", "neckUpper_092"],
  head:      ["Head", "head", "mixamorigHead", "J_Bip_C_Head", "CC_Base_Head",
              "head_093"],

  leftShoulder:  ["LeftShoulder", "leftShoulder", "mixamorigLeftShoulder",
                   "L_Shoulder", "shoulder_l", "J_Bip_L_Shoulder"],
  rightShoulder: ["RightShoulder", "rightShoulder", "mixamorigRightShoulder",
                   "R_Shoulder", "shoulder_r", "J_Bip_R_Shoulder"],
  leftUpperArm:  ["LeftUpperArm", "leftUpperArm", "mixamorigLeftArm",
                   "LeftArm", "L_UpperArm", "upperarm_l"],
  rightUpperArm: ["RightUpperArm", "rightUpperArm", "mixamorigRightArm",
                   "RightArm", "R_UpperArm", "upperarm_r"],
  leftHand:  ["LeftHand", "leftHand", "mixamorigLeftHand", "Hand_L",
              "hand_l", "L_Hand", "J_Bip_L_Hand",
              "lHand_048"],
  rightHand: ["RightHand", "rightHand", "mixamorigRightHand", "Hand_R",
              "hand_r", "R_Hand", "J_Bip_R_Hand",
              "rHand_073"],

  leftUpperLeg:  ["LeftUpLeg", "leftUpLeg", "mixamorigLeftUpLeg",
                   "LeftThigh", "L_Thigh", "thigh_l", "J_Bip_L_UpperLeg",
                   "lThighBend_05"],
  rightUpperLeg: ["RightUpLeg", "rightUpLeg", "mixamorigRightUpLeg",
                   "RightThigh", "R_Thigh", "thigh_r", "J_Bip_R_UpperLeg",
                   "rThighBend_021"],
  leftLowerLeg:  ["LeftLeg", "leftLeg", "mixamorigLeftLeg",
                   "LeftCalf", "L_Calf", "calf_l", "J_Bip_L_LowerLeg"],
  rightLowerLeg: ["RightLeg", "rightLeg", "mixamorigRightLeg",
                   "RightCalf", "R_Calf", "calf_r", "J_Bip_R_LowerLeg"],
  leftFoot:  ["LeftFoot", "leftFoot", "mixamorigLeftFoot", "Foot_L",
              "foot_l", "L_Foot", "J_Bip_L_Foot",
              "lFoot_08"],
  rightFoot: ["RightFoot", "rightFoot", "mixamorigRightFoot", "Foot_R",
              "foot_r", "R_Foot", "J_Bip_R_Foot",
              "rFoot_024"],
};

/**
 * Canonical region hierarchy — if a target isn't found,
 * walk UP the skeleton to find the nearest parent region.
 */
const REGION_PARENT: Record<string, string> = {
  head: "neck",
  neck: "chest",
  chest: "spine1",
  spine1: "spine",
  spine: "hips",
  leftShoulder: "chest",
  rightShoulder: "chest",
  leftUpperArm: "leftShoulder",
  rightUpperArm: "rightShoulder",
  leftHand: "leftUpperArm",
  rightHand: "rightUpperArm",
  leftUpperLeg: "hips",
  rightUpperLeg: "hips",
  leftLowerLeg: "leftUpperLeg",
  rightLowerLeg: "rightUpperLeg",
  leftFoot: "leftLowerLeg",
  rightFoot: "rightLowerLeg",
};

/* ═══════════════════════════════════════════
   Utility
   ═══════════════════════════════════════════ */

export function mergeOutfitBinding(
  category: string,
  glbUrl: string,
  overrides?: Partial<OutfitBindingConfig>
): OutfitBindingConfig {
  const preset = BINDING_PRESETS[category] ?? {};
  return {
    ...DEFAULT_OUTFIT_BINDING,
    ...preset,
    glbUrl,
    ...overrides,
  };
}

/** Build a name→Bone map from the full avatar scene graph. */
export function buildBoneMap(root: THREE.Object3D): Map<string, THREE.Bone> {
  const map = new Map<string, THREE.Bone>();
  root.traverse((obj) => {
    if (obj instanceof THREE.Bone) {
      map.set(obj.name, obj);
      map.set(obj.name.toLowerCase(), obj);
    }
  });
  return map;
}

/**
 * Resolve a binding target to an actual bone.
 *
 * Strategy (in order):
 * 1. Exact name match
 * 2. Case-insensitive match
 * 3. Alias table match (all naming conventions)
 * 4. Explicit fallbackTargets from config
 * 5. Walk UP the region hierarchy (e.g. head→neck→chest→spine1→spine→hips)
 * 6. Return null (caller attaches to scene root)
 */
export function resolveBone(
  boneMap: Map<string, THREE.Bone>,
  target: BindingTarget,
  fallbacks?: BindingTarget[]
): THREE.Bone | null {
  // 1+2: Direct / lowercase
  const direct = boneMap.get(target) ?? boneMap.get(target.toLowerCase());
  if (direct) return direct;

  // 3: Alias table
  const aliases = BONE_ALIASES[target] ?? [];
  for (const alias of aliases) {
    const bone = boneMap.get(alias) ?? boneMap.get(alias.toLowerCase());
    if (bone) return bone;
  }

  // 3b: Substring/fuzzy — find any bone whose name contains the target keyword
  const targetLC = target.toLowerCase();
  for (const [key, bone] of boneMap) {
    if (key.toLowerCase().includes(targetLC)) return bone;
  }

  // 4: Explicit fallback list
  if (fallbacks?.length) {
    for (const fb of fallbacks) {
      const bone = resolveBone(boneMap, fb);
      if (bone) return bone;
    }
  }

  // 5: Walk up the region hierarchy (max 8 hops to prevent loops)
  let parent = REGION_PARENT[target];
  let hops = 0;
  while (parent && hops < 8) {
    const bone = resolveBone(boneMap, parent);
    if (bone) return bone;
    parent = REGION_PARENT[parent];
    hops++;
  }

  return null;
}

/**
 * Describe the full resolution result for debug display.
 */
export type BoneResolution = {
  requestedTarget: string;
  resolvedBone: THREE.Bone | null;
  resolvedName: string;
  method: "direct" | "alias" | "fallback" | "hierarchy" | "root";
};

export function resolveBoneDetailed(
  boneMap: Map<string, THREE.Bone>,
  target: BindingTarget,
  fallbacks?: BindingTarget[]
): BoneResolution {
  // Direct
  const direct = boneMap.get(target) ?? boneMap.get(target.toLowerCase());
  if (direct) return { requestedTarget: target, resolvedBone: direct, resolvedName: direct.name, method: "direct" };

  // Alias
  const aliases = BONE_ALIASES[target] ?? [];
  for (const alias of aliases) {
    const bone = boneMap.get(alias) ?? boneMap.get(alias.toLowerCase());
    if (bone) return { requestedTarget: target, resolvedBone: bone, resolvedName: bone.name, method: "alias" };
  }

  // Substring/fuzzy
  const targetLC = target.toLowerCase();
  for (const [key, bone] of boneMap) {
    if (key.toLowerCase().includes(targetLC))
      return { requestedTarget: target, resolvedBone: bone, resolvedName: bone.name, method: "alias" };
  }

  // Explicit fallback
  if (fallbacks?.length) {
    for (const fb of fallbacks) {
      const bone = resolveBone(boneMap, fb);
      if (bone) return { requestedTarget: target, resolvedBone: bone, resolvedName: bone.name, method: "fallback" };
    }
  }

  // Hierarchy walk
  let parent = REGION_PARENT[target];
  let hops = 0;
  while (parent && hops < 8) {
    const bone = resolveBone(boneMap, parent);
    if (bone) return { requestedTarget: target, resolvedBone: bone, resolvedName: bone.name, method: "hierarchy" };
    parent = REGION_PARENT[parent];
    hops++;
  }

  return { requestedTarget: target, resolvedBone: null, resolvedName: "(root)", method: "root" };
}

import * as THREE from "three";
import type {
  AvatarFaceDeformConfig,
  ModelCapabilities,
  MorphTargetMapping,
  MorphWeightEntry,
} from "./types";
import { IDENTITY_DEFORM } from "./types";

/**
 * KİMLİK (şekil) morph eşleme kuralları — Faz B sözleşmesi.
 *
 * Yalnızca `id*` ile başlayan KİMLİK shape-key'leri eşlenir; ARKit İFADE
 * blendshape'leri (eyeBlink/jawOpen/mouthSmile/browDown...) BİLİNÇLİ olarak
 * kapsam dışıdır — onları kimlik deformasyonu için kullanmak avatarı slider
 * oynatınca gülümsetir/gözünü açar (uncanny). Eşleşme tam isimledir
 * (`^id…$`), gevşek `smile`/`wide` desenleri kaldırıldı.
 *
 * Bir morph adı kurala uyduğunda deform değeri 0–1 ağırlığa map'lenir:
 * (configValue - 1) * gain + 0.5, clamp[0,1].
 *
 * Şeyma'nın gövdeye eklemesi gereken 8 kimlik shape-key adı (sol sütun):
 */
const MORPH_RULES: Array<{
  re: RegExp;
  key: keyof AvatarFaceDeformConfig;
  gain: number;
}> = [
  { re: /^idJawWidth$/i,    key: "jawWidthScale",   gain: 3.0 },
  { re: /^idChinLength$/i,  key: "chinScaleY",      gain: 3.0 },
  { re: /^idEyeSpacing$/i,  key: "eyeSpacingScale", gain: 3.0 },
  { re: /^idEyeSize$/i,     key: "eyeScale",        gain: 3.0 },
  { re: /^idNoseWidth$/i,   key: "noseWidthScale",  gain: 3.0 },
  { re: /^idMouthWidth$/i,  key: "mouthWidthScale", gain: 3.0 },
  { re: /^idForehead$/i,    key: "foreheadScale",   gain: 2.5 },
  { re: /^idHeadWidth$/i,   key: "headWidthScale",  gain: 3.0 },
];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Build a mapping table between the model's morph targets
 * and our AvatarFaceDeformConfig fields.
 *
 * Returns an empty array if no matches found.
 */
export function buildMorphTargetMapping(
  caps: ModelCapabilities
): MorphTargetMapping {
  const mapping: MorphTargetMapping = [];

  for (const mt of caps.morphTargets) {
    for (const rule of MORPH_RULES) {
      if (rule.re.test(mt.targetName)) {
        const { key, gain } = rule;
        mapping.push({
          targetName: mt.targetName,
          meshName: mt.meshName,
          index: mt.index,
          computeWeight: (cfg: AvatarFaceDeformConfig) =>
            clamp01((cfg[key] - 1) * gain + 0.5),
        });
        break;
      }
    }
  }

  return mapping;
}

/**
 * Apply morph target weights to all matched meshes.
 *
 * @returns true if at least one morph target was applied.
 */
export function applyMorphTargetDeform(
  root: THREE.Object3D,
  mapping: MorphTargetMapping,
  cfg: AvatarFaceDeformConfig
): boolean {
  if (mapping.length === 0) return false;

  const isIdentity = Object.keys(IDENTITY_DEFORM).every(
    (k) =>
      Math.abs(
        cfg[k as keyof AvatarFaceDeformConfig] -
          IDENTITY_DEFORM[k as keyof AvatarFaceDeformConfig]
      ) < 0.001
  );

  let applied = false;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.morphTargetInfluences) return;

    for (const entry of mapping) {
      if (mesh.name !== entry.meshName && entry.meshName !== "(unnamed)") {
        continue;
      }
      if (entry.index >= mesh.morphTargetInfluences.length) continue;

      mesh.morphTargetInfluences[entry.index] = isIdentity
        ? 0
        : entry.computeWeight(cfg);
      applied = true;
    }
  });

  return applied;
}

/**
 * Reset all morph target influences to 0.
 */
export function resetMorphTargets(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const inf = (obj as THREE.Mesh).morphTargetInfluences;
    if (!inf) return;
    for (let i = 0; i < inf.length; i++) inf[i] = 0;
  });
}

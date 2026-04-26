import * as THREE from "three";
import type { AvatarFaceDeformConfig, ModelCapabilities, MorphTargetMapping } from "./types";
import { IDENTITY_DEFORM } from "./types";
import { applyMorphTargetDeform, resetMorphTargets } from "./morph-targets";

/* ═══════════════════════════════════════════
   Identity check
   ═══════════════════════════════════════════ */

function isIdentity(cfg: AvatarFaceDeformConfig): boolean {
  const keys = Object.keys(IDENTITY_DEFORM) as (keyof AvatarFaceDeformConfig)[];
  return keys.every((k) => Math.abs(cfg[k] - IDENTITY_DEFORM[k]) < 0.001);
}

/* ═══════════════════════════════════════════
   Strategy 2: Head bone scale (safe for rigged models)
   ═══════════════════════════════════════════ */

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function applyHeadBoneDeform(
  root: THREE.Object3D,
  headBoneName: string,
  cfg: AvatarFaceDeformConfig
): boolean {
  let applied = false;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Bone)) return;
    if (obj.name !== headBoneName) return;

    if (isIdentity(cfg)) {
      obj.scale.set(1, 1, 1);
    } else {
      const sx = clamp(cfg.headWidthScale, 0.90, 1.10);
      const sy = clamp(
        1 + (cfg.chinScaleY - 1) * 0.25 + (cfg.foreheadScale - 1) * 0.25,
        0.94,
        1.06
      );
      const sz = clamp(cfg.headWidthScale, 0.90, 1.10);
      obj.scale.set(sx, sy, sz);
    }
    applied = true;
  });

  return applied;
}

function resetHeadBone(root: THREE.Object3D, headBoneName: string): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Bone && obj.name === headBoneName) {
      obj.scale.set(1, 1, 1);
    }
  });
}

/* ═══════════════════════════════════════════
   Strategy 3: Vertex deform (ONLY for non-rigged models)
   ═══════════════════════════════════════════ */

const HEAD_FRAC = 0.17;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function vertexScale(
  nx: number,
  ny: number,
  cfg: AvatarFaceDeformConfig
): { sx: number; sy: number; sz: number } {
  let sx = 1;
  let sy = 1;
  let sz = 1;
  const absX = Math.abs(nx);

  if (ny < 0.22) {
    const w = smoothstep(0.22, 0.0, ny);
    sx += (cfg.jawWidthScale - 1) * w * 0.5;
    sy += (cfg.chinScaleY - 1) * w;
    sz += (cfg.jawWidthScale - 1) * w * 0.25;
  }
  if (ny >= 0.08 && ny < 0.40) {
    const w = Math.max(0, 1 - Math.abs(ny - 0.24) / 0.16);
    sx += (cfg.jawWidthScale - 1) * w;
    sz += (cfg.jawWidthScale - 1) * w * 0.3;
  }
  if (ny >= 0.18 && ny < 0.38 && absX < 0.38) {
    const wy = Math.max(0, 1 - Math.abs(ny - 0.28) / 0.10);
    const wx = Math.max(0, 1 - absX / 0.38);
    sx += (cfg.mouthWidthScale - 1) * wy * wx;
  }
  if (ny >= 0.33 && ny < 0.58 && absX < 0.28) {
    const wy = Math.max(0, 1 - Math.abs(ny - 0.45) / 0.12);
    const wx = Math.max(0, 1 - absX / 0.28);
    const w = wy * wx;
    sx += (cfg.noseWidthScale - 1) * w;
    sz += (cfg.noseWidthScale - 1) * w * 0.35;
  }
  if (ny >= 0.43 && ny < 0.68 && absX > 0.10) {
    const wy = Math.max(0, 1 - Math.abs(ny - 0.55) / 0.13);
    sy += (cfg.eyeScale - 1) * wy * 0.6;
    sx += (cfg.eyeSpacingScale - 1) * wy * 0.5;
  }
  if (ny > 0.72) {
    const w = smoothstep(0.72, 0.95, ny);
    sx += (cfg.foreheadScale - 1) * w;
    sy += (cfg.foreheadScale - 1) * w * 0.35;
  }

  sx *= cfg.headWidthScale;
  sz *= cfg.headWidthScale;

  return { sx, sy, sz };
}

function applyVertexDeform(
  root: THREE.Object3D,
  cfg: AvatarFaceDeformConfig
): void {
  const identity = isIdentity(cfg);

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;

    try {
      const geo = obj.geometry as THREE.BufferGeometry;
      if (!geo?.attributes?.position) return;

      const pos = geo.attributes.position as THREE.BufferAttribute;
      if (pos.count < 100) return;

      if (!geo.userData) geo.userData = {};

      if (geo.userData._faceDeformBase) {
        const stored = geo.userData._faceDeformBase as Float32Array;
        if (stored.length === pos.array.length) {
          (pos.array as Float32Array).set(stored);
          pos.needsUpdate = true;
        }
      }

      if (identity) {
        if (pos.needsUpdate) {
          geo.computeBoundingBox();
          geo.computeBoundingSphere();
          geo.computeVertexNormals();
        }
        return;
      }

      if (!geo.userData._faceDeformBase) {
        geo.userData._faceDeformBase = (pos.array as Float32Array).slice();
      }
      const base = geo.userData._faceDeformBase as Float32Array;

      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      if (!bb) return;

      const minY = bb.min.y;
      const maxY = bb.max.y;
      const totalH = maxY - minY;
      if (totalH < 0.1) return;

      const headThreshold = maxY - totalH * HEAD_FRAC;
      const headCenterX = (bb.min.x + bb.max.x) / 2;
      const headCenterZ = (bb.min.z + bb.max.z) / 2;
      const headHalfW = (bb.max.x - bb.min.x) / 2 || 0.1;
      const headH = totalH * HEAD_FRAC || 0.1;

      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const bz = base[i * 3 + 2];

        if (by < headThreshold) continue;

        const ny = (by - headThreshold) / headH;
        const nx = (bx - headCenterX) / headHalfW;

        const blend = smoothstep(0, 0.28, ny);
        const { sx, sy, sz } = vertexScale(nx, ny, cfg);

        const dsx = 1 + (sx - 1) * blend;
        const dsy = 1 + (sy - 1) * blend;
        const dsz = 1 + (sz - 1) * blend;

        (pos.array as Float32Array)[i * 3] =
          headCenterX + (bx - headCenterX) * dsx;
        (pos.array as Float32Array)[i * 3 + 1] =
          headThreshold + (by - headThreshold) * dsy;
        (pos.array as Float32Array)[i * 3 + 2] =
          headCenterZ + (bz - headCenterZ) * dsz;
      }

      pos.needsUpdate = true;
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      geo.computeVertexNormals();
    } catch {
      /* skip problematic meshes */
    }
  });
}

/* ═══════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════ */

/**
 * Clear face-deform base positions. Only needed for vertex-deform
 * strategy when body config changes (non-rigged models).
 */
export function clearFaceDeformBase(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const geo = obj.geometry as THREE.BufferGeometry | undefined;
    if (geo && geo.userData && geo.userData._faceDeformBase) {
      delete geo.userData._faceDeformBase;
    }
  });
}

/**
 * Apply face deform using the best available strategy.
 *
 * Strategy cascade:
 *   1. Morph targets (shape keys) — best quality, stable
 *   2. Head bone scale — safe for rigged/skinned models
 *   3. Vertex deform — only for static (non-rigged) models
 *
 * If no capabilities are provided, falls back to vertex deform.
 */
export function applyFaceDeform(
  root: THREE.Object3D,
  cfg: AvatarFaceDeformConfig,
  caps?: ModelCapabilities | null,
  morphMapping?: MorphTargetMapping | null
): void {
  const strategy = caps?.strategy ?? "vertex";

  switch (strategy) {
    case "morph-targets": {
      if (morphMapping && morphMapping.length > 0) {
        if (isIdentity(cfg)) {
          resetMorphTargets(root);
        } else {
          applyMorphTargetDeform(root, morphMapping, cfg);
        }
        return;
      }
      // Fall through if mapping empty
      if (caps?.headBoneName) {
        applyHeadBoneDeform(root, caps.headBoneName, cfg);
        return;
      }
      break;
    }

    case "head-bone": {
      if (caps?.headBoneName) {
        applyHeadBoneDeform(root, caps.headBoneName, cfg);
        return;
      }
      break;
    }

    case "none": {
      // Rigged model without a head bone — do nothing.
      // Vertex deform on rigged models causes the "bowl head" bug.
      return;
    }

    case "vertex":
    default: {
      applyVertexDeform(root, cfg);
      return;
    }
  }
}

import * as THREE from "three";
import type { ModelCapabilities, MorphTargetInfo } from "./types";

const HEAD_BONE_RE = [/^head$/i, /head/i, /skull/i, /cranium/i];

/**
 * IDENTITY (şekil) morph sözleşmesi — Faz B.
 *
 * Kimlik morph'ları (yüz oranlarını kalıcı değiştiren shape-key'ler) ARKit
 * İFADE blendshape'lerinden (eyeBlink, jawOpen, mouthSmile, browDown...) AYRI
 * tutulur. Aksi halde "göz aralığı" slider'ı `eyeWide` ifadesini, "ağız
 * genişliği" `mouthSmile` ifadesini sürükler → avatar slider oynatınca
 * gülümser / gözünü fal taşı gibi açar (uncanny).
 *
 * Sözleşme: kimlik shape-key'leri `id` + PascalCase ile başlar
 *   idJawWidth · idChinLength · idEyeSpacing · idEyeSize
 *   idNoseWidth · idMouthWidth · idForehead · idHeadWidth
 *
 * ARKit ifadeleri hep küçük harfle başladığından (`jawOpen`, `mouthSmileLeft`)
 * `^id[A-Z]` deseni onlarla ÇAKIŞMAZ. Gövdede gerçek `id*` shape-key yokken
 * `hasFaceMorphTargets=false` döner → motor head-bone fallback'ine düşer
 * (kaba ama doğal), ifade morph'larını kimlik için ASLA çalmaz. Şeyma `id*`
 * shape-key'lerini ekleyince strateji otomatik `morph-targets`'a geçer.
 */
const IDENTITY_MORPH_RE = [/^id[A-Z]/];

/**
 * Inspect a loaded GLB scene and report its capabilities:
 * bones, morph targets, mesh list, and the recommended deform strategy.
 *
 * Called ONCE after the model loads — result is cached for the component lifetime.
 */
export function inspectModel(root: THREE.Object3D): ModelCapabilities {
  const boneNames: string[] = [];
  let headBoneName: string | null = null;
  const meshes: ModelCapabilities["meshes"] = [];
  const morphTargets: MorphTargetInfo[] = [];

  root.traverse((obj) => {
    if (obj instanceof THREE.Bone) {
      boneNames.push(obj.name);
      if (!headBoneName) {
        for (const re of HEAD_BONE_RE) {
          if (re.test(obj.name)) {
            headBoneName = obj.name;
            break;
          }
        }
      }
    }

    if (obj instanceof THREE.Mesh) {
      const geo = obj.geometry as THREE.BufferGeometry;
      const vertexCount = geo?.attributes?.position?.count ?? 0;
      const morphPos = geo?.morphAttributes?.position;
      const hasMorphTargets = Array.isArray(morphPos) && morphPos.length > 0;

      meshes.push({
        name: obj.name || "(unnamed)",
        vertexCount,
        hasMorphTargets,
      });

      if (hasMorphTargets && obj.morphTargetDictionary) {
        for (const [name, index] of Object.entries(obj.morphTargetDictionary)) {
          morphTargets.push({
            meshName: obj.name || "(unnamed)",
            targetName: name,
            index: index as number,
          });
        }
      }
    }
  });

  const hasBones = boneNames.length > 0;
  // Yalnızca KİMLİK (id*) shape-key'leri morph-targets stratejisini açar;
  // ARKit ifade blendshape'leri kimlik deformasyonu için kullanılmaz.
  const hasFaceMorphTargets = morphTargets.some((mt) =>
    IDENTITY_MORPH_RE.some((re) => re.test(mt.targetName))
  );

  let strategy: ModelCapabilities["strategy"];
  if (hasFaceMorphTargets) {
    strategy = "morph-targets";
  } else if (hasBones && headBoneName) {
    strategy = "head-bone";
  } else if (hasBones) {
    strategy = "none";
  } else {
    strategy = "vertex";
  }

  const caps: ModelCapabilities = {
    hasBones,
    boneNames,
    headBoneName,
    meshes,
    morphTargets,
    hasFaceMorphTargets,
    strategy,
  };

  if (typeof window !== "undefined") {
    console.info(
      "[ModelInspector] strategy=%s  bones=%d  morphTargets=%d  headBone=%s",
      strategy,
      boneNames.length,
      morphTargets.length,
      headBoneName ?? "none"
    );
    if (morphTargets.length > 0) {
      console.table(morphTargets.map((m) => ({
        mesh: m.meshName,
        target: m.targetName,
        index: m.index,
      })));
    }
  }

  return caps;
}

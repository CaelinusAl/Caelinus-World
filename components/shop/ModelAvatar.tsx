"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AvatarConfig } from "@/types/avatar";
import { DEFAULT_AVATAR } from "@/types/avatar";
import type { AvatarFaceDeformConfig, ModelCapabilities, MorphTargetMapping } from "@/lib/face";
import { IDENTITY_DEFORM, applyFaceDeform, clearFaceDeformBase } from "@/lib/face";
import { inspectModel } from "@/lib/face/model-inspector";
import { buildMorphTargetMapping } from "@/lib/face/morph-targets";
import { AvatarFaceTexture } from "./AvatarFaceTexture";

type Props = {
  url?: string;
  auraColor?: string;
  skinTone?: string;
  avatarConfig?: AvatarConfig;
  faceTextureUrl?: string | null;
  faceDeform?: AvatarFaceDeformConfig | null;
  /** External animation GLB (e.g. catwalk.glb) — merged into the mixer */
  animationUrl?: string | null;
  /** Exposes model capabilities to parent for debug display */
  onCapabilities?: (caps: ModelCapabilities) => void;
  /** Exposes the avatar root Object3D for outfit binding */
  onSceneReady?: (scene: THREE.Object3D) => void;
};

const BASE_HEIGHT = 2.8;
const ROOT_Y = 0;

const BUST_SCALE: Record<string, number> = { s: 0.92, m: 1.0, l: 1.1, xl: 1.22 };

/**
 * Applies the user's BODY config (height/weight/bust/hip) to the GLB.
 *
 * Strategy resolution:
 *
 *   1. **skinned bones**  — preferred. We scale named bones (Hips,
 *      Spine, UpperLeg, etc.); the SkinnedMesh follows because its
 *      vertices are weighted to those bones. Slider hareketi gerçek
 *      anatomic deformation üretir.
 *
 *   2. **bones present but mesh isn't skinned** — common with AI-
 *      generated GLBs (Meshy, Hunyuan3D). Bones exist as scene-graph
 *      siblings but no vertex has weight on them. Bone scaling
 *      becomes a no-op visually. Bu durumda otomatik olarak vertex
 *      deform'a düşüyoruz.
 *
 *   3. **no bones at all** — pure static mesh. Vertex deform.
 *
 * Deformation magnitudes — Mayıs 2026 anatomic-sanity patch.
 *
 * Önceki "dramatize" sürümde slider'lar görünür sonuç versin diye
 * faktörler aşırı agresifti (kilo max 1.55x, bust XL 1.45x). Üç
 * neden bu yaklaşımı bozdu:
 *   • Bust bone, Chest bone'un child'ıdır — weight scale (1.55x)
 *     bust bone'a inherit oluyor, üstüne kendi 1.45x scale'i
 *     binince visual çarpan ~2.25x oluyordu (kullanıcı "dev
 *     göğüsler" raporladı, screenshot kanıtı var).
 *   • Bust bone X/Y/Z üç eksende scale'leniyordu → balon efekti.
 *   • Kilo 1.55x topuk-baş hattını da bozuyor.
 *
 * Yeni güvenli aralıklar:
 *   • Boy   150-200 → 0.92x to 1.10x (Y scale, ayak-baş hattı)
 *   • Kilo  30-100  → 0.88x to 1.18x (XZ scale)
 *   • Hip   0.6-1.4 → direct multiplier (zaten makul)
 *   • Bust  s/m/l/xl → 0.92 / 1.00 / 1.06 / 1.12 (was 0.85-1.45)
 *     ve **chest weight scale'i compansate ediliyor** → bust local
 *     scale = (bustFactor / weightFactor) → visual = bustFactor.
 *     Y ekseni 1.0 sabit; sadece X/Z ile genişletiliyor.
 *
 * @returns one of "bones-skinned", "bones-cosmetic", "vertex", "none"
 *   so the caller (and console diagnostic) knows which branch ran.
 */

const DRAMATIC_BUST_SCALE: Record<string, number> = {
  s: 0.92,
  m: 1.0,
  l: 1.06,
  xl: 1.12,
};

type BodyDeformResult = {
  strategy: "bones-skinned" | "bones-cosmetic" | "vertex" | "none";
  bonesScaled: number;
  meshesDeformed: number;
  factors: {
    height: number;
    weight: number;
    bust: number;
    hip: number;
  };
  matchedBoneNames: string[];
};

/**
 * Sadece görünür mesh'lerin (Mesh/SkinnedMesh) birleşik bounding box'ı.
 * armature/bone/helper node'ları yok sayar — `Box3.setFromObject(scene)`
 * iskelet uzantıları yüzünden yanlış yükseklik verip ölçek hesabını
 * bozmasın diye. (bkz. lib/3d/useFitToView.ts)
 */
function measureVisibleMeshBox(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  root.traverse((o) => {
    const obj = o as THREE.Object3D & { isMesh?: boolean };
    if (obj.isMesh && obj.visible !== false) {
      const meshBox = new THREE.Box3().setFromObject(o);
      if (!meshBox.isEmpty()) box.union(meshBox);
    }
  });
  return box;
}

function applyBodyDeformation(
  scene: THREE.Object3D,
  cfg: AvatarConfig,
): BodyDeformResult {
  // Anatomic-sanity faktörleri — slider hareketi hâlâ görünür ama
  // proporsiyonu bozmayan aralıkta.
  const heightFactor = 0.92 + ((cfg.height - 150) / 50) * 0.18; // 150→0.92, 200→1.10
  const weightFactor = 0.88 + ((cfg.weight - 30) / 70) * 0.30;  // 30→0.88, 100→1.18
  const bustFactor = DRAMATIC_BUST_SCALE[cfg.bustSize] ?? 1;
  const hipFactor = cfg.hipRatio;

  // Skinned mesh tespiti — bone'lar varsa ama mesh skinned değilse,
  // bone scaling visual hiçbir şey yapmaz. Bu durumda vertex
  // deform'a düşmek lazım.
  let hasBones = false;
  let hasSkinnedMesh = false;
  let bonesScaled = 0;
  let meshesDeformed = 0;
  const matchedBoneNames: string[] = [];

  scene.traverse((obj) => {
    if (obj instanceof THREE.Bone) hasBones = true;
    if (obj instanceof THREE.SkinnedMesh) hasSkinnedMesh = true;
  });

  // ── Strategy 1: skinned bones ──────────────────────────────
  if (hasBones && hasSkinnedMesh) {
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Bone)) return;
      const n = obj.name.toLowerCase();
      let matched = true;

      if (/hip|pelvis/i.test(n)) {
        obj.scale.set(hipFactor * weightFactor, 1, hipFactor * weightFactor);
      } else if (/spine|torso|chest/i.test(n)) {
        obj.scale.set(weightFactor, 1, weightFactor);
      } else if (/bust|breast/i.test(n)) {
        // ÖNEMLİ — compound compensation:
        // Bust bone, Chest bone'un child'ı; chest XZ scale'i (weightFactor)
        // bust'a inherit oluyor. İstediğimiz görsel scale = bustFactor.
        // Bu yüzden local scale'i (bustFactor / weightFactor) yapıyoruz.
        // Y ekseni 1.0 sabit — balon efektini önler, sadece XZ'de genişler.
        const localBust = bustFactor / Math.max(weightFactor, 0.1);
        obj.scale.set(localBust, 1, localBust);
      } else if (/thigh|upperleg|upleg/i.test(n)) {
        obj.scale.set(
          weightFactor * hipFactor * 0.95,
          1,
          weightFactor * hipFactor * 0.95,
        );
      } else if (/calf|lowerleg|leg|shin/i.test(n)) {
        obj.scale.set(weightFactor * 0.9, 1, weightFactor * 0.9);
      } else if (/upperarm|shoulder|arm/i.test(n) && !/forearm/i.test(n)) {
        obj.scale.set(weightFactor * 0.85, 1, weightFactor * 0.85);
      } else if (/forearm/i.test(n)) {
        obj.scale.set(weightFactor * 0.8, 1, weightFactor * 0.8);
      } else {
        matched = false;
      }

      if (matched) {
        bonesScaled++;
        if (matchedBoneNames.length < 12) matchedBoneNames.push(obj.name);
      }
    });

    return {
      strategy: "bones-skinned",
      bonesScaled,
      meshesDeformed: 0,
      factors: {
        height: heightFactor,
        weight: weightFactor,
        bust: bustFactor,
        hip: hipFactor,
      },
      matchedBoneNames,
    };
  }

  // ── Strategy 2/3: vertex deform ────────────────────────────
  // Bone'lar var ama mesh skinned değilse (cosmetic skeleton) ya da
  // hiç bone yoksa, mesh vertex'lerini doğrudan rebuild ediyoruz.
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const geo = obj.geometry;
    if (!geo || !geo.attributes.position) return;

    if (!geo.userData) geo.userData = {};
    if (!geo.userData._originalPos) {
      geo.userData._originalPos = geo.attributes.position.array.slice();
    }

    const orig = geo.userData._originalPos as Float32Array;
    const pos = geo.attributes.position.array as Float32Array;
    const count = pos.length / 3;

    const bBox = new THREE.Box3().setFromBufferAttribute(
      geo.attributes.position as THREE.BufferAttribute,
    );
    const minY = bBox.min.y;
    const maxY = bBox.max.y;
    const totalH = maxY - minY || 1;

    for (let i = 0; i < count; i++) {
      const ox = orig[i * 3];
      const oy = orig[i * 3 + 1];
      const oz = orig[i * 3 + 2];
      const t = (oy - minY) / totalH;

      let xzScale = weightFactor;
      // Vücut bölgesi → XZ scale ayarla
      if (t >= 0.55 && t <= 0.78) {
        // Göğüs bölgesi
        xzScale *= bustFactor;
      } else if (t >= 0.30 && t < 0.50) {
        // Kalça-bel
        xzScale *= hipFactor;
      } else if (t < 0.30) {
        // Bacaklar
        xzScale *= hipFactor * 0.95;
      } else if (t > 0.78 && t < 0.92) {
        // Omuz-üst gövde
        xzScale *= 0.92;
      }

      pos[i * 3] = ox * xzScale;
      pos[i * 3 + 1] = oy * heightFactor;
      pos[i * 3 + 2] = oz * xzScale;
    }

    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    if (geo.attributes.normal) {
      geo.computeVertexNormals();
    }
    meshesDeformed++;
  });

  return {
    strategy: hasBones ? "bones-cosmetic" : meshesDeformed > 0 ? "vertex" : "none",
    bonesScaled: 0,
    meshesDeformed,
    factors: {
      height: heightFactor,
      weight: weightFactor,
      bust: bustFactor,
      hip: hipFactor,
    },
    matchedBoneNames: [],
  };
}

export default function ModelAvatar({
  url = "/models/caelinus-body-base-fem.glb",
  auraColor = "#69d8ff",
  skinTone,
  avatarConfig,
  faceTextureUrl = null,
  faceDeform = null,
  animationUrl = null,
  onCapabilities,
  onSceneReady,
}: Props) {
  const cfg = avatarConfig ?? DEFAULT_AVATAR;
  const rootRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  // Dosya isimleri boşluk/parantez içerebilir ("selin (1).glb").
  // GLTFLoader ham URL'i fetch'e verince kırılgan; %20 encode şart.
  // Zaten encode edilmiş (%) URL'i iki kez encode etmemek için guard.
  const safeUrl = useMemo(
    () => (/%[0-9a-f]{2}/i.test(url) ? url : encodeURI(url)),
    [url],
  );
  const gltf = useGLTF(safeUrl);
  // SkeletonUtils.clone — Three.js'in SkinnedMesh-aware clone'u.
  // Standart Object3D.clone(true) bone'ları kopyalar AMA
  // SkinnedMesh hâlâ orijinal skeleton'a bind kalır, bu yüzden
  // bone scale değişimleri MESH'E yansımaz (sadece bone helper
  // gizli olarak hareket eder). SkeletonUtils.clone bone'ları
  // klonlar ve klonlanmış SkinnedMesh'leri yeni skeleton'a
  // doğru rebind eder. Bu olmadan slider hareketleri görünmez
  // — "ten rengi haricinde hiçbir şey çalışmıyor" semptomunun
  // kaynağı kelimenin tam anlamıyla budur.
  const scene = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene]);

  // ── Imperatively load external animation GLB + retarget tracks ──
  const [extClips, setExtClips] = useState<THREE.AnimationClip[]>([]);

  useEffect(() => {
    if (!animationUrl) { setExtClips([]); return; }
    let cancelled = false;
    const extLoader = new GLTFLoader();
    const safeAnimUrl = /%[0-9a-f]{2}/i.test(animationUrl)
      ? animationUrl
      : encodeURI(animationUrl);
    extLoader.load(
      safeAnimUrl,
      (gltfResult) => {
        if (cancelled) return;

        // Build a set of bone names the avatar actually has
        const avatarBones = new Set<string>();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Bone) avatarBones.add(obj.name);
        });

        // Also collect the external model's bone name mapping for retargeting
        const srcBones = new Set<string>();
        if (gltfResult.scene) {
          gltfResult.scene.traverse((obj) => {
            if (obj instanceof THREE.Bone) srcBones.add(obj.name);
          });
        }

        console.info(
          "[ModelAvatar] external anim loaded — clips=%d  srcBones=%d  avatarBones=%d",
          gltfResult.animations.length,
          srcBones.size,
          avatarBones.size
        );

        // Retarget clips: rename track paths so they bind to our avatar's skeleton
        const retargeted = gltfResult.animations.map((clip) => {
          const newTracks = clip.tracks.map((track) => {
            // Track name format: "boneName.property" (e.g. "mixamorigHips.position")
            const dotIdx = track.name.indexOf(".");
            if (dotIdx < 0) return track;

            const boneName = track.name.substring(0, dotIdx);
            const prop = track.name.substring(dotIdx);

            // If avatar already has this bone, keep as-is
            if (avatarBones.has(boneName)) return track;

            // Try to find a matching avatar bone (case-insensitive, stripped prefix).
            // Normalize the "mixamorig" prefix AND a trailing ":" or "_" — Blender's
            // FBX→GLB round-trip keeps Mixamo's colon ("mixamorig:Hips"), while the
            // catwalk clip may use the colon-less form ("mixamorigHips"). Strip both
            // so either convention retargets cleanly.
            const stripMixamo = (s: string) => s.replace(/^mixamorig[:_]?/i, "");
            const boneLC = boneName.toLowerCase();
            const stripped = stripMixamo(boneLC);
            let match: string | null = null;
            for (const ab of avatarBones) {
              const abLC = ab.toLowerCase();
              if (abLC === boneLC || abLC === stripped || stripMixamo(abLC) === stripped) {
                match = ab;
                break;
              }
            }
            if (match) {
              const newTrack = track.clone();
              newTrack.name = match + prop;
              return newTrack;
            }
            return track;
          })
          // Strip ROOT MOTION: drop the hips/root POSITION track so the avatar
          // animates IN PLACE on the stage instead of traveling off-camera.
          // Mixamo "walk/dance" clips bake forward locomotion into Hips.position;
          // without this the character walks straight out of the frame and the
          // mesh appears to "vanish". Rotation tracks are kept, so the full pose
          // still plays. (Hips.quaternion etc. are untouched.)
          // Keep rotation (the pose) + bone positions, but drop:
          //   • ALL scale tracks — a Mixamo FBX→GLB round-trip can bake a
          //     non-identity (100x) scale that would blow the avatar up.
          //   • the Hips/root POSITION track — removes forward locomotion so the
          //     avatar walks IN PLACE on the stage instead of off-camera.
          // This works ONLY when the catwalk skeleton shares the avatar's scale
          // space (transforms applied at export). Bone positions must match the
          // avatar's bind lengths or the mesh stretches into "tubes".
          .filter((track) => {
            if (/\.scale$/i.test(track.name)) return false;
            const isPosition = /\.position$/i.test(track.name);
            const isRoot = /hips$/i.test(track.name.split(".")[0]);
            return !(isPosition && isRoot);
          });

          return new THREE.AnimationClip(clip.name || "ext_anim", clip.duration, newTracks, clip.blendMode);
        });

        if (retargeted.length > 0) {
          console.info("[ModelAvatar] retargeted clip names:", retargeted.map((c) => c.name));
          console.info("[ModelAvatar] tracks sample:", retargeted[0].tracks.slice(0, 5).map((t) => t.name));
        }

        setExtClips(retargeted);
      },
      undefined,
      (err) => { console.warn("[ModelAvatar] external animation load error:", err); }
    );
    return () => { cancelled = true; };
  }, [animationUrl, scene]);

  const allClips = useMemo(() => {
    // When an external animation (catwalk) is requested, play ONLY the external
    // clips. The model's own embedded clips can otherwise collide by name (the
    // Mixamo→Blender export bakes a residual "Armature|mixamo.com|Layer0" action
    // into the avatar GLB with the SAME name as the catwalk clip) and the static
    // pose ends up winning — the avatar freezes in T-pose. Ignoring embedded
    // clips while an external one is active removes that ambiguity.
    if (animationUrl) return extClips;
    return [...gltf.animations];
  }, [animationUrl, gltf.animations, extClips]);

  const { actions, names } = useAnimations(allClips, rootRef);

  const resolvedSkin = skinTone ?? cfg.skinTone;

  // ── Inspect model ONCE ──
  const capsRef = useRef<ModelCapabilities | null>(null);
  const morphMapRef = useRef<MorphTargetMapping | null>(null);

  useEffect(() => {
    const caps = inspectModel(scene);
    capsRef.current = caps;
    morphMapRef.current = caps.hasFaceMorphTargets
      ? buildMorphTargetMapping(caps)
      : null;
    onCapabilities?.(caps);
    onSceneReady?.(scene);

    if (process.env.NODE_ENV === "development") {
      const bones: string[] = [];
      const skinnedMeshes: { name: string; boneCount: number; bound: boolean }[] = [];
      // İki geçiş: önce TÜM bone'ları topla, SONRA bind kontrolü yap.
      // glTF'de skinned-mesh node'u kendi bone node'larından ÖNCE gelebilir
      // (yaygın). Tek geçişte kontrol edilirse, mesh işlenirken bone'lar
      // henüz toplanmamış olur ve skeleton yanlışlıkla "orphan" görünür
      // (false-positive). İki geçiş bu sıra bağımlılığını ortadan kaldırır.
      scene.traverse((obj) => {
        if (obj instanceof THREE.Bone) bones.push(obj.name);
      });
      const sceneBones = new Set(bones);
      scene.traverse((obj) => {
        if (obj instanceof THREE.SkinnedMesh) {
          const skelBoneNames = obj.skeleton.bones.map((b) => b.name);
          const overlap = skelBoneNames.filter((n) => sceneBones.has(n)).length;
          skinnedMeshes.push({
            name: obj.name || "(unnamed)",
            boneCount: obj.skeleton.bones.length,
            bound: overlap === skelBoneNames.length,
          });
        }
      });
      console.info(
        "[ModelAvatar] inspection complete:\n" +
          `  scene bones    : ${bones.length}\n` +
          `  skinned meshes : ${skinnedMeshes.length}\n` +
          `  ${skinnedMeshes.map((s) => `→ "${s.name}" boneCount=${s.boneCount} bound=${s.bound}`).join("\n  ")}\n` +
          (bones.length ? `  bone names     : ${bones.join(", ")}` : ""),
      );

      const allBound = skinnedMeshes.every((s) => s.bound);
      if (skinnedMeshes.length > 0 && !allBound) {
        console.error(
          "[ModelAvatar] ❌ SkinnedMesh skeleton orphan'd — clone yanlış! " +
            "SkeletonUtils.clone çalışmamış olabilir. Bone scaling MESH'i etkilemez.",
        );
      } else if (skinnedMeshes.length > 0) {
        console.info(
          "[ModelAvatar] ✓ SkinnedMesh'ler doğru bind edilmiş — bone scaling çalışmalı.",
        );
      }
    }
  }, [scene, onCapabilities, onSceneReady]);

  // 1) Scale & center on ground
  //
  // Doğal yükseklik tek seferlik cache. SkinnedMesh + bone deform
  // sahnesinde `Box3.setFromObject` her run'da farklı sonuç verir
  // (bind pose vs deformed pose vs propagated bone scales). Önceki
  // "her cfg değişiminde reset + remeasure" yaklaşımı kompound
  // hatalar üretiyordu — kullanıcı ekrana yakın bir kütle olarak
  // gördüğü bug'ın kaynağı buydu. Çözüm: ilk yüklemede natural
  // height'ı bir kere ölç, userData'ya yaz, sonra her boy
  // değişiminde sadece o cache değerine göre absolute scale set et.
  useEffect(() => {
    try {
      let naturalH = scene.userData._naturalHeight as number | undefined;
      if (!naturalH || naturalH < 0.001) {
        scene.scale.setScalar(1);
        scene.position.set(0, 0, 0);
        scene.updateMatrixWorld(true);
        // SADECE görünür mesh'leri ölç — armature/bone/helper node'ları
        // dahil edersek (Box3.setFromObject(scene)) iskelet uzantıları
        // yanlış (çoğu zaman küçük) bir yükseklik verir; scale = targetH /
        // naturalH patlar ve model devasa/kırpık görünür. (bkz. useFitToView)
        const meshBox = measureVisibleMeshBox(scene);
        if (meshBox.isEmpty()) return; // GLB hâlâ yükleniyor — sonra yeniden ölç
        const size = new THREE.Vector3();
        meshBox.getSize(size);
        naturalH = size.y;
        if (!naturalH || naturalH < 0.001) return;
        scene.userData._naturalHeight = naturalH;
        if (process.env.NODE_ENV === "development") {
          console.info(
            `[ModelAvatar] natural height measured: ${naturalH.toFixed(3)}`,
          );
        }
      }

      const heightScale = 0.85 + ((cfg.height - 150) / 50) * 0.35;
      const targetH = BASE_HEIGHT * heightScale;
      const scale = naturalH > 0.001 ? targetH / naturalH : 1;
      scene.scale.setScalar(scale);

      scene.updateMatrixWorld(true);
      const scaled = measureVisibleMeshBox(scene);
      const sMin = scaled.min;
      const sCenter = new THREE.Vector3();
      scaled.getCenter(sCenter);

      scene.position.x -= sCenter.x;
      scene.position.z -= sCenter.z;
      scene.position.y -= sMin.y;

      if (process.env.NODE_ENV === "development") {
        console.info(
          `[ModelAvatar] height scale => ${heightScale.toFixed(3)} ` +
            `(cfg.height=${cfg.height}cm, scale=${scale.toFixed(4)})`,
        );
      }
    } catch {
      /* GLB might still be loading */
    }
  }, [scene, cfg.height]);

  // 2) Body deform + face deform (strategy-aware)
  useEffect(() => {
    try {
      const result = applyBodyDeformation(scene, cfg);

      // Comprehensive diagnostic — kullanıcı slider hareket ettirip
      // gerçekten mesh'in deform olup olmadığını anlamak için bunu
      // konsola yazıyoruz. Production'da gürültü olur ama Faz 4
      // pivot süresince açık kalsın.
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[ModelAvatar] body deform =>\n" +
            `  strategy        : ${result.strategy}\n` +
            `  bones scaled    : ${result.bonesScaled}` +
            (result.matchedBoneNames.length
              ? ` (${result.matchedBoneNames.join(", ")})`
              : "") +
            "\n" +
            `  meshes deformed : ${result.meshesDeformed}\n` +
            `  cfg             : height=${cfg.height} weight=${cfg.weight} bust=${cfg.bustSize} hip=${cfg.hipRatio}\n` +
            `  factors         : H=${result.factors.height.toFixed(3)}  W=${result.factors.weight.toFixed(3)}  Bust=${result.factors.bust.toFixed(3)}  Hip=${result.factors.hip.toFixed(3)}`,
        );

        if (result.strategy === "bones-cosmetic") {
          console.warn(
            "[ModelAvatar] ⚠ Bone'lar var ama SkinnedMesh yok — bone scaling görsel " +
              "etki yapmıyordu. Otomatik vertex deform'a düşüldü. Daha temiz bir " +
              "sonuç için Blender'da mesh'i armature'a 'with empty groups' / " +
              "automatic weights ile bind etmek gerekir.",
          );
        }
        if (result.strategy === "none") {
          console.error(
            "[ModelAvatar] ❌ Ne bone ne deform edilebilir mesh — GLB bozuk veya boş.",
          );
        }
      }

      const caps = capsRef.current;
      const strategy = caps?.strategy ?? "vertex";

      // Vertex deform yapıldıysa face decal base'i temizle (eski
      // geometry üzerine bind etmiş olabilir)
      if (strategy === "vertex" && result.strategy !== "bones-skinned") {
        clearFaceDeformBase(scene);
      }

      applyFaceDeform(
        scene,
        faceDeform ?? IDENTITY_DEFORM,
        caps,
        morphMapRef.current,
      );
    } catch (e) {
      console.warn("[ModelAvatar] deform pipeline error:", e);
    }
  }, [scene, cfg, faceDeform]);

  // 3) Materials
  //
  // İki avatar tipini ayrı ele alıyoruz:
  //
  // a) Caelinus default GLB — bald + tek mesh, aura'lı renkli skin
  //    material'ı bütün scene'i kaplıyor. Skin tone slider'ı bu
  //    yolu kullanır (eski davranış).
  //
  // b) Avaturn / 3rd-party fotoğraf-gerçek avatarları — her bir alt mesh
  //    (yüz / saç / iris / kıyafet) kendi PBR material'ına sahip,
  //    selfie texture'ı yüzü kaplıyor. Material override edersek bu
  //    foto-gerçek görüntü boyalı manken'e dönüşür. Bu yüzden
  //    "external avatar" tespit edersek material'ları olduğu gibi
  //    bırakıyor, sadece shadow flag'larını + body mesh'inde hafif
  //    kozmik emissive aura uyguluyoruz.
  //
  // Tespit heuristic'leri:
  //   • Avaturn: birden fazla SkinnedMesh içerir (body + head +
  //     outfit_top + outfit_bottom + footwear). Caelinus default
  //     mesh tek SkinnedMesh ya da Mesh.
  //   • Wolf3D_* / EyeLeft / EyeRight isimleri (RPM, MetaHuman vb.
  //     diğer foto-gerçek pipeline'larından da geliyor olabilir)
  useEffect(() => {
    let isExternalAvatar = false;
    let skinnedMeshCount = 0;

    scene.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        (obj.name.startsWith("Wolf3D_") ||
          obj.name.startsWith("EyeLeft") ||
          obj.name.startsWith("EyeRight") ||
          /^avaturn[_-]/i.test(obj.name) ||
          /^outfit[_-]/i.test(obj.name) ||
          /^head[_-]?mesh/i.test(obj.name))
      ) {
        isExternalAvatar = true;
      }
      if (obj instanceof THREE.SkinnedMesh) skinnedMeshCount++;
    });

    // Birden fazla SkinnedMesh + Mixamo bone'lar → external avatar
    // (Avaturn / Mixamo karakterleri / foto-gerçek pipelines)
    if (skinnedMeshCount >= 3) {
      isExternalAvatar = true;
    }

    if (isExternalAvatar) {
      const aura = new THREE.Color(auraColor);
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mat = obj.material as THREE.MeshStandardMaterial | undefined;
        if (
          mat &&
          mat instanceof THREE.MeshStandardMaterial &&
          /body|skin/i.test(obj.name)
        ) {
          mat.emissive = aura;
          mat.emissiveIntensity = 0.08;
          mat.needsUpdate = true;
        }
      });
      if (process.env.NODE_ENV === "development") {
        console.info(
          `[ModelAvatar] external avatar detected (skinnedMeshes=${skinnedMeshCount}) — preserving original materials`,
        );
      }
      return;
    }

    // Default Caelinus mesh yolu — eski davranış (full override)
    const aura = new THREE.Color(auraColor);
    const base = new THREE.Color(resolvedSkin);

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      // Preserve hair (and other explicitly non-skin parts) — overriding it with
      // the skin-tone material would paint the hair flesh-colored. Hair meshes
      // ship their own PBR material from Blender, so we leave them untouched.
      if (/hair|sac|saç|brow|lash|eye/i.test(obj.name)) return;
      obj.material = new THREE.MeshPhysicalMaterial({
        color: base,
        emissive: aura,
        emissiveIntensity: 0.12,
        roughness: 0.42,
        metalness: 0.08,
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
      });
    });
  }, [scene, auraColor, resolvedSkin]);

  // 3b) Disable frustum culling on all meshes.
  //
  // A SkinnedMesh computes its bounding sphere from the BIND pose. Once the
  // catwalk clip plays, vertices move outside that stale sphere, so Three.js'
  // frustum test decides the mesh is off-screen and culls it — the avatar
  // "appears then vanishes". Turning culling off for these few meshes is the
  // standard, cheap fix.
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.frustumCulled = false;
    });
  }, [scene]);

  // 4) Animations — prefer external clip, then idle, then first available
  const activeClipRef = useRef<string | null>(null);
  const extClipNamesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    extClipNamesRef.current = new Set(extClips.map((c) => c.name));
  }, [extClips]);

  useEffect(() => {
    if (!names.length) return;
    console.info("[ModelAvatar] available clips:", names, "animationUrl:", animationUrl);

    let preferred: string | undefined;

    if (animationUrl && extClips.length > 0) {
      // A single Mixamo/Cinema4D GLB often ships SEVERAL clips: a real
      // skeletal clip, a root-motion-only clip ("Girl Dancer" → 1 node),
      // and sometimes a clip authored for a totally different rig
      // ("CINEMA_4D_Main" → DAZ Genesis names). Picking "the first external
      // clip" is unreliable. Instead, score each retargeted clip by how many
      // of its tracks actually resolve to THIS avatar's bones, and play the
      // best-matching one. Falls back gracefully when nothing matches.
      const avatarBoneSet = new Set<string>();
      scene.traverse((o) => {
        if (o instanceof THREE.Bone) avatarBoneSet.add(o.name);
      });

      const scoreClip = (clip: THREE.AnimationClip) =>
        clip.tracks.reduce((acc, t) => {
          const boneName = t.name.split(".")[0];
          return acc + (avatarBoneSet.has(boneName) ? 1 : 0);
        }, 0);

      const ranked = extClips
        .filter((c) => names.includes(c.name))
        .map((c) => ({ name: c.name, score: scoreClip(c), tracks: c.tracks.length }))
        .sort((a, b) => b.score - a.score);

      console.info(
        "[ModelAvatar] external clip ranking (by matched bones):",
        ranked.map((r) => `${r.name}: ${r.score}/${r.tracks}`),
      );

      preferred = ranked.find((r) => r.score > 0)?.name ?? ranked[0]?.name;
    }

    if (!preferred) {
      preferred =
        names.find((n) => /idle|breath|stand/i.test(n)) ??
        names[0];
    }

    if (!preferred) return;

    if (activeClipRef.current === preferred) return;

    // Fade out previous
    if (activeClipRef.current && actions[activeClipRef.current]) {
      actions[activeClipRef.current]!.fadeOut(0.4);
    }

    const action = actions[preferred];
    if (action) {
      action.reset().fadeIn(0.6).play();
      console.info("[ModelAvatar] playing clip:", preferred);
    }
    activeClipRef.current = preferred;

    return () => {
      if (action) action.fadeOut(0.4);
      activeClipRef.current = null;
    };
  }, [actions, names, animationUrl, extClips, scene]);

  // Breathing + gentle rotation
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (rootRef.current) {
      rootRef.current.position.y = ROOT_Y + Math.sin(t * 1.35) * 0.03;
      rootRef.current.rotation.y = Math.sin(t * 0.45) * 0.08;
    }
    if (auraRef.current) {
      const s = 1.0 + Math.sin(t * 1.2) * 0.035;
      auraRef.current.scale.set(s, s, s);
      (auraRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.05 + Math.sin(t * 0.8) * 0.025;
    }
  });

  return (
    <group ref={rootRef} position={[0, ROOT_Y, 0]}>
      <mesh ref={auraRef} position={[0, 1.15, 0]}>
        <capsuleGeometry args={[0.65, 2.0, 12, 24]} />
        <meshBasicMaterial color={auraColor} transparent opacity={0.07} />
      </mesh>
      <primitive object={scene} />
      <AvatarFaceTexture textureUrl={faceTextureUrl} />

      <pointLight position={[0, 2.2, 1.2]} intensity={1.8} color={auraColor} />
      <pointLight position={[0, 1.2, -1.2]} intensity={0.9} color="#a783ff" />

      {faceTextureUrl && (
        <>
          <spotLight
            position={[0, 2.8, 2.0]}
            angle={0.35}
            penumbra={0.8}
            intensity={2.4}
            color="#ffe8d6"
            castShadow={false}
          />
          <pointLight position={[0.4, 2.6, -0.5]} intensity={0.7} color="#c4b5fd" />
          <pointLight position={[-0.4, 2.6, -0.5]} intensity={0.7} color="#c4b5fd" />
        </>
      )}
    </group>
  );
}

useGLTF.preload("/models/caelinus-body-base-fem.glb");

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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

/** @returns true if the model uses bones (skeletal), false if vertex-only */
function applyBodyDeformation(scene: THREE.Object3D, cfg: AvatarConfig): boolean {
  const heightFactor = cfg.height / 170;
  const weightFactor = 0.7 + (cfg.weight / 100) * 0.6;
  const bustFactor = BUST_SCALE[cfg.bustSize] ?? 1;
  const hipFactor = cfg.hipRatio;

  let hasBones = false;

  scene.traverse((obj) => {
    if (obj instanceof THREE.Bone) {
      hasBones = true;
      const n = obj.name.toLowerCase();

      if (/hip|pelvis/i.test(n)) {
        obj.scale.set(hipFactor * weightFactor, 1, hipFactor * weightFactor);
      } else if (/spine|torso|chest/i.test(n)) {
        obj.scale.set(weightFactor, 1, weightFactor);
      } else if (/bust|breast/i.test(n)) {
        obj.scale.set(bustFactor, bustFactor, bustFactor);
      } else if (/thigh|upperleg/i.test(n)) {
        obj.scale.set(weightFactor * hipFactor * 0.95, heightFactor, weightFactor * hipFactor * 0.95);
      } else if (/calf|lowerleg|shin/i.test(n)) {
        obj.scale.set(weightFactor * 0.9, heightFactor, weightFactor * 0.9);
      } else if (/upperarm|shoulder/i.test(n)) {
        obj.scale.set(weightFactor * 0.85, 1, weightFactor * 0.85);
      }
    }
  });

  if (!hasBones) {
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
        geo.attributes.position as THREE.BufferAttribute
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
        if (t > 0.55 && t < 0.75) xzScale *= bustFactor;
        if (t > 0.3 && t < 0.5) xzScale *= hipFactor;
        if (t < 0.3) xzScale *= hipFactor * 0.95;

        pos[i * 3] = ox * xzScale;
        pos[i * 3 + 1] = oy * heightFactor;
        pos[i * 3 + 2] = oz * xzScale;
      }

      geo.attributes.position.needsUpdate = true;
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    });
  }

  return hasBones;
}

export default function ModelAvatar({
  url = "/models/caelinus-avatar.glb",
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

  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // ── Imperatively load external animation GLB + retarget tracks ──
  const [extClips, setExtClips] = useState<THREE.AnimationClip[]>([]);

  useEffect(() => {
    if (!animationUrl) { setExtClips([]); return; }
    let cancelled = false;
    const extLoader = new GLTFLoader();
    extLoader.load(
      animationUrl,
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

            // Try to find a matching avatar bone (case-insensitive, stripped prefix)
            const boneLC = boneName.toLowerCase();
            const stripped = boneLC.replace(/^mixamorig/i, "");
            let match: string | null = null;
            for (const ab of avatarBones) {
              const abLC = ab.toLowerCase();
              if (abLC === boneLC || abLC === stripped || abLC.replace(/^mixamorig/i, "") === stripped) {
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

  const allClips = useMemo(
    () => [...gltf.animations, ...extClips],
    [gltf.animations, extClips]
  );

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
      scene.traverse((obj) => {
        if (obj instanceof THREE.Bone) bones.push(obj.name);
      });
      if (bones.length) {
        console.info("[ModelAvatar] skeleton bones:", bones.join(", "));
      }
    }
  }, [scene, onCapabilities, onSceneReady]);

  // 1) Scale & center on ground
  useEffect(() => {
    try {
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);

      const targetH = BASE_HEIGHT * (cfg.height / 170);
      const scale = targetH / (size.y || 1);
      scene.scale.setScalar(scale);

      const scaled = new THREE.Box3().setFromObject(scene);
      const sMin = scaled.min;
      const sCenter = new THREE.Vector3();
      scaled.getCenter(sCenter);

      scene.position.x -= sCenter.x;
      scene.position.z -= sCenter.z;
      scene.position.y -= sMin.y;
    } catch {
      /* GLB might still be loading */
    }
  }, [scene, cfg.height]);

  // 2) Body deform + face deform (strategy-aware)
  useEffect(() => {
    try {
      const usedBones = applyBodyDeformation(scene, cfg);
      const caps = capsRef.current;
      const strategy = caps?.strategy ?? "vertex";

      if (strategy === "vertex" && !usedBones) {
        clearFaceDeformBase(scene);
      }

      applyFaceDeform(
        scene,
        faceDeform ?? IDENTITY_DEFORM,
        caps,
        morphMapRef.current
      );
    } catch (e) {
      console.warn("[ModelAvatar] deform pipeline error:", e);
    }
  }, [scene, cfg, faceDeform]);

  // 3) Materials
  useEffect(() => {
    const aura = new THREE.Color(auraColor);
    const base = new THREE.Color(resolvedSkin);

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
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

    if (animationUrl && extClipNamesRef.current.size > 0) {
      // Prefer matching name, else take any external clip
      preferred =
        names.find((n) => extClipNamesRef.current.has(n) && /catwalk|walk|runway/i.test(n)) ??
        names.find((n) => extClipNamesRef.current.has(n)) ??
        undefined;
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
  }, [actions, names, animationUrl]);

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

useGLTF.preload("/models/caelinus-avatar.glb");

"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OutfitBindingConfig } from "@/types/play";
import {
  buildBoneMap,
  resolveBoneDetailed,
  type BoneResolution,
} from "@/lib/config/outfit-binding-config";

/* ═══════════════════════════════════════════
   Public types
   ═══════════════════════════════════════════ */

export type OutfitBindingStatus =
  | { state: "idle" }
  | { state: "loading"; glbUrl: string }
  | { state: "ready"; glbUrl: string; resolvedBone: string; method: string }
  | { state: "error"; glbUrl: string; message: string };

type Props = {
  config: OutfitBindingConfig;
  avatarRoot: THREE.Object3D | null;
  visible?: boolean;
  debug?: boolean;
  onStatus?: (status: OutfitBindingStatus) => void;
};

/* ═══════════════════════════════════════════
   Shared loader instance (avoid re-creation)
   ═══════════════════════════════════════════ */

const loader = new GLTFLoader();

/* ═══════════════════════════════════════════
   Native bounding-box snapshot taken right
   after GLB clone, before any transform.
   ═══════════════════════════════════════════ */

type NativeBBox = {
  size: THREE.Vector3;
  center: THREE.Vector3;
  max: number;
};

function measureNative(obj: THREE.Object3D): NativeBBox {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  return { size, center, max: Math.max(size.x, size.y, size.z) };
}

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */

export default function OutfitBindingLayer({
  config,
  avatarRoot,
  visible = true,
  debug = false,
  onStatus,
}: Props) {
  /* ── state ── */
  const [outfitScene, setOutfitScene] = useState<THREE.Object3D | null>(null);
  const [nativeBBox, setNativeBBox] = useState<NativeBBox | null>(null);
  const [clips, setClips] = useState<THREE.AnimationClip[]>([]);
  const [status, setStatus] = useState<OutfitBindingStatus>({ state: "idle" });
  const [resolution, setResolution] = useState<BoneResolution | null>(null);

  /* ── refs ── */
  const containerRef = useRef<THREE.Group>(null!);
  if (!containerRef.current) containerRef.current = new THREE.Group();

  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const reportStatus = useCallback(
    (s: OutfitBindingStatus) => {
      setStatus(s);
      onStatus?.(s);
    },
    [onStatus],
  );

  /* ═══════════════════════════════════════════
     1. GLB LOAD — only when glbUrl changes
     ═══════════════════════════════════════════ */
  useEffect(() => {
    if (!config.glbUrl) {
      reportStatus({ state: "idle" });
      return;
    }

    let cancelled = false;
    reportStatus({ state: "loading", glbUrl: config.glbUrl });

    loader.load(
      config.glbUrl,
      (gltf) => {
        if (cancelled) return;
        const clone = gltf.scene.clone(true);

        clone.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });

        const nb = measureNative(clone);
        console.info(
          `[OutfitBinding] ✅ loaded ${config.glbUrl.split("/").pop()}\n` +
            `  native size  : ${nb.size.x.toFixed(3)} × ${nb.size.y.toFixed(3)} × ${nb.size.z.toFixed(3)}\n` +
            `  native center: (${nb.center.x.toFixed(3)}, ${nb.center.y.toFixed(3)}, ${nb.center.z.toFixed(3)})\n` +
            `  native max   : ${nb.max.toFixed(3)}`,
        );

        setNativeBBox(nb);
        setOutfitScene(clone);
        setClips(gltf.animations);
      },
      undefined,
      (err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[OutfitBinding] ❌ FAILED ${config.glbUrl}:`, msg);
        reportStatus({ state: "error", glbUrl: config.glbUrl, message: msg });
      },
    );

    return () => {
      cancelled = true;
      setOutfitScene(null);
      setNativeBBox(null);
      setClips([]);
      setResolution(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.glbUrl]);

  /* ═══════════════════════════════════════════
     2. ATTACH + FIT + TRANSFORM  (single pass)
     ─────────────────────────────────────────
     All positioning logic lives here.
     No other effect touches position/scale.
     ═══════════════════════════════════════════ */
  useEffect(() => {
    if (!outfitScene || !avatarRoot || !nativeBBox) return;

    const container = containerRef.current;

    // ── clean slate ──
    if (container.parent) container.parent.remove(container);
    while (container.children.length) container.remove(container.children[0]);
    if (boxHelperRef.current) {
      boxHelperRef.current.removeFromParent();
      boxHelperRef.current.dispose();
      boxHelperRef.current = null;
    }
    if (axesRef.current) {
      axesRef.current.removeFromParent();
      axesRef.current.dispose();
      axesRef.current = null;
    }

    outfitScene.scale.set(1, 1, 1);
    outfitScene.position.set(0, 0, 0);
    outfitScene.rotation.set(0, 0, 0);

    // ── resolve target bone ──
    const boneMap = buildBoneMap(avatarRoot);
    const res = resolveBoneDetailed(
      boneMap,
      config.bindingTarget,
      config.fallbackTargets,
    );
    setResolution(res);

    // ÖNEMLİ — bind hatası kontrolü:
    // Bone resolve ettikten sonra resolvedBone null ise (avatar
    // beklenen bone'a sahip değil), eski sürümde avatarRoot'a
    // fallback ediyorduk. Sonuç: garment "kayıt anchor" olmadığı
    // için config.position değerleriyle sahnenin etrafında yüzüyor,
    // bazen ekrana göre dev boyutta görünüyordu (kullanıcı
    // screenshot kanıtı verdi).
    //
    // Şimdi bone resolve fail olunca outfit'i gizle + status error
    // bildir; sahneye saçılmasın.
    if (!res.resolvedBone) {
      console.warn(
        `[OutfitBinding] ⚠ bone not found for "${config.bindingTarget}" ` +
          `(fallbacks: ${(config.fallbackTargets ?? []).join(", ") || "—"}), ` +
          `hiding outfit ${config.glbUrl}`,
      );
      container.visible = false;
      reportStatus({
        state: "error",
        glbUrl: config.glbUrl,
        message: `bone "${config.bindingTarget}" bulunamadı`,
      });
      return;
    }

    const anchorBone = res.resolvedBone;

    // Log all bone names for debugging (first time only)
    if (process.env.NODE_ENV === "development") {
      const names: string[] = [];
      avatarRoot.traverse((o) => {
        if (o instanceof THREE.Bone) names.push(o.name);
      });
      console.info(
        `[OutfitBinding] bone resolved: "${res.resolvedName}" via ${res.method}\n` +
          `  avatar bones : [${names.join(", ")}]`,
      );
    }

    // ── parent container to bone ──
    container.add(outfitScene);
    anchorBone.add(container);

    // ── compute avatar world height ──
    avatarRoot.updateWorldMatrix(true, true);
    const avatarBox = new THREE.Box3().setFromObject(avatarRoot);
    const avatarH = avatarBox.max.y - avatarBox.min.y;

    // ── compute outfit world size (at scale 1, inside bone chain) ──
    container.updateWorldMatrix(true, true);
    const worldBox = new THREE.Box3().setFromObject(outfitScene);
    const worldSize = new THREE.Vector3();
    worldBox.getSize(worldSize);
    const worldMax = Math.max(worldSize.x, worldSize.y, worldSize.z);

    // ── auto-scale ──
    // Önceki sürüm yalnızca `ratio > 1.5 || ratio < 0.05` durumunda
    // auto-scale uyguluyordu. Bikini GLB'lerinin native worldMax'ı
    // avatar boyuna yakındı (ratio ~1.2) → guard tetiklenmiyor →
    // garment 1:1 native scale'inde kalıp avatardan büyük görünüyordu
    // (kullanıcı "bikini etrafımda sarkıyor" raporladı).
    //
    // Şimdi auto-scale **her zaman** uygulanıyor ve hedef oran
    // kategoriye göre (`config.targetFraction`) seçiliyor:
    //   • bikini one-piece → 0.42
    //   • pareo            → 0.55
    //   • bag              → 0.18
    //   • heels            → 0.10
    //   • necklace         → 0.12
    //   • earring/bracelet → 0.05–0.06
    const TARGET_FRAC = config.targetFraction ?? 0.40;
    const ratio = worldMax > 0.001 && avatarH > 0.001 ? worldMax / avatarH : 1;
    let sf = (avatarH * TARGET_FRAC) / Math.max(worldMax, 0.001);

    // Defansif: avatar/garment ölçümü dejenere ise (NaN/Infinity)
    // gizle — sahneye dev boyutta yüzmesin.
    if (!Number.isFinite(sf) || sf <= 0 || worldMax <= 0 || avatarH <= 0) {
      console.warn(
        `[OutfitBinding] ⚠ degenerate measurement for ${config.glbUrl}: ` +
          `sf=${sf}, worldMax=${worldMax}, avatarH=${avatarH} — hiding`,
      );
      container.visible = false;
      reportStatus({
        state: "error",
        glbUrl: config.glbUrl,
        message: "ölçüm anomalisi (auto-scale)",
      });
      return;
    }

    outfitScene.scale.setScalar(sf);

    // ── center correction ──
    // Three.js transform order:  T × R × S × vertex
    // Center in container-local = position + sf × nativeCenter
    // To land center at container origin:  position = −sf × nativeCenter
    const nc = nativeBBox.center;
    outfitScene.position.set(-nc.x * sf, -nc.y * sf, -nc.z * sf);

    // ── apply config overrides to CONTAINER ──
    container.position.set(...config.position);
    container.rotation.set(...config.rotation);
    if (typeof config.scale === "number") {
      container.scale.setScalar(config.scale);
    } else {
      container.scale.set(...config.scale);
    }
    container.visible = visible;

    // ── debug helpers (gated by `debug` prop / wardrobe-store) ──
    // Önceden "always-on for now" idi → kırmızı bbox ve eksenler
    // sahnede sürekli görünüp ürünü kesiyordu. Artık yalnızca
    // StageControls'taki "Debug ON" butonu açıkken çiziliyor.
    if (debug) {
      const bh = new THREE.BoxHelper(outfitScene, 0xff0000);
      bh.update();
      container.add(bh);
      boxHelperRef.current = bh;

      const ax = new THREE.AxesHelper(0.3);
      container.add(ax);
      axesRef.current = ax;
    }

    // ── z-offset for materials ──
    const zo = config.zOffset;
    outfitScene.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || !(o.material instanceof THREE.Material))
        return;
      o.material.depthWrite = true;
      if (zo > 0) {
        o.material.polygonOffset = true;
        o.material.polygonOffsetFactor = -1;
        o.material.polygonOffsetUnits = -(zo * 1000);
      }
      o.material.needsUpdate = true;
    });

    // ── console report ──
    console.info(
      `[OutfitBinding] 📍 ATTACH REPORT\n` +
        `  bone         : "${res.resolvedName}" (${res.method})\n` +
        `  avatarH      : ${avatarH.toFixed(3)}\n` +
        `  worldMax@1   : ${worldMax.toFixed(3)}  (ratio ${ratio.toFixed(3)})\n` +
        `  auto-scale   : ${sf.toFixed(6)}\n` +
        `  nativeCenter : (${nc.x.toFixed(3)}, ${nc.y.toFixed(3)}, ${nc.z.toFixed(3)})\n` +
        `  final pos    : (${outfitScene.position.x.toFixed(4)}, ${outfitScene.position.y.toFixed(4)}, ${outfitScene.position.z.toFixed(4)})\n` +
        `  final scale  : ${sf.toFixed(6)}\n` +
        `  config.pos   : [${config.position}]\n` +
        `  config.scale : ${config.scale}`,
    );

    reportStatus({
      state: "ready",
      glbUrl: config.glbUrl,
      resolvedBone: res.resolvedName,
      method: res.method,
    });

    return () => {
      // cleanup imperatively-attached objects
      if (boxHelperRef.current) {
        boxHelperRef.current.removeFromParent();
        boxHelperRef.current.dispose();
        boxHelperRef.current = null;
      }
      if (axesRef.current) {
        axesRef.current.removeFromParent();
        axesRef.current.dispose();
        axesRef.current = null;
      }
      if (container.parent) container.parent.remove(container);
      while (container.children.length) container.remove(container.children[0]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitScene, avatarRoot, nativeBBox, config.glbUrl, config.bindingTarget]);

  /* ═══════════════════════════════════════════
     3. BODY MASKING
     ═══════════════════════════════════════════ */
  useEffect(() => {
    if (!avatarRoot || !config.hiddenMeshParts?.length) return;
    const patterns = config.hiddenMeshParts.map((p) => p.toLowerCase());
    const hidden: THREE.Object3D[] = [];

    avatarRoot.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (patterns.some((p) => o.name.toLowerCase().includes(p))) {
        o.visible = false;
        hidden.push(o);
      }
    });

    return () => hidden.forEach((o) => { o.visible = true; });
  }, [avatarRoot, config.hiddenMeshParts]);

  /* ═══════════════════════════════════════════
     4. ANIMATION MIXER  (outfit's own clips)
     ═══════════════════════════════════════════ */
  useEffect(() => {
    if (!outfitScene || !clips.length) return;
    const mixer = new THREE.AnimationMixer(outfitScene);
    const action = mixer.clipAction(clips[0]);
    action.reset().fadeIn(0.4).play();
    mixerRef.current = mixer;
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [outfitScene, clips]);

  /* ═══════════════════════════════════════════
     5. PER-FRAME — mixer tick + BoxHelper update
     ═══════════════════════════════════════════ */
  const _tmpW = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
    boxHelperRef.current?.update();
  });

  /* ═══════════════════════════════════════════
     RENDER — loading ring + debug HUD
     ═══════════════════════════════════════════ */

  if (status.state === "loading") {
    return (
      <group position={[0, 1.3, 0]}>
        <mesh>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#7ce8ff" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  if (status.state === "error" && debug) {
    return (
      <group position={[0, 1.3, 0]}>
        <mesh>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.7} />
        </mesh>
      </group>
    );
  }

  return null;
}

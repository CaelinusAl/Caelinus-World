"use client";

/**
 * AvatarCanvas — Naz Yardımcı atelier'inin "WOW level" 3D vitrini.
 *
 * Cinematic stack:
 *   • 3-point lighting (key/fill/rim) — fashion editorial seti
 *   • Frost color grading (mavi/beyaz key, magenta accent rim)
 *   • Post-processing: Bloom + Vignette + ChromaticAberration + ACES tone
 *   • Sparkles (frost zerrecikleri) modelin etrafında yüzer
 *   • Intro fade-in: model fog'dan çıkar gibi büyür ve netleşir
 *   • Mouse parallax: kamera, imlece göre hafif tilt'le hareket eder
 *   • Auto-rotate + manuel sürükle (zoom kapalı, sayfa scroll'una karışmaz)
 *
 * `kind` ve `url` prop'larını AvatarShowcase belirler — şu an üç adayı
 * sırayla probe eder, ilk bulduğunu buraya pas eder.
 */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  Sparkles,
  useFBX,
  useGLTF,
} from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import type { Group, Object3D } from "three";

import { useFitToView } from "@/lib/3d/useFitToView";

type ModelKind = "glb" | "fbx";

function applyShadows(root: Object3D) {
  root.traverse((o: unknown) => {
    const obj = o as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

/**
 * Mount anında scale 0 → 1 ve y eksende hafif yüzme. İlk 1.5 saniye
 * "fog'dan çıkar" hissi yaratır, sonra sürekli yumuşak bir floating'e
 * geçer.
 */
function useIntroAndFloat(group: React.RefObject<Group | null>) {
  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    if (t0.current === null) t0.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - t0.current;
    const intro = Math.min(elapsed / 1.4, 1);
    const eased = 1 - Math.pow(1 - intro, 3);
    g.scale.setScalar(0.6 + 0.4 * eased);
    g.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.05 * eased;
  });
}

function GltfMesh({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const ref = useRef<Group>(null);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    applyShadows(scene);
  }, [scene]);

  useFitToView(scene, { targetSize: 1.9, yOffset: 0.0 });
  useIntroAndFloat(ref);

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

function FbxMesh({ url }: { url: string }) {
  const fbx = useFBX(url);
  const ref = useRef<Group>(null);
  const scene = useMemo(() => fbx.clone(true), [fbx]);

  useEffect(() => {
    applyShadows(scene);
  }, [scene]);

  useFitToView(scene, { targetSize: 1.9, yOffset: 0.0 });
  useIntroAndFloat(ref);

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export default function AvatarCanvas({
  kind,
  url,
}: {
  kind: ModelKind;
  url: string;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.1, 4.6], fov: 36 }}
      dpr={[1, 1.6]}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <fog attach="fog" args={["#0a1a2c", 5.5, 13]} />

      {/* 3-point fashion lighting */}
      <ambientLight intensity={0.35} color="#dceeff" />
      {/* Key — soft cool white from upper right */}
      <directionalLight
        position={[3.2, 6, 4]}
        intensity={1.35}
        color="#f4faff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />
      {/* Fill — cool blue from left */}
      <directionalLight
        position={[-4.5, 2, -2]}
        intensity={0.6}
        color="#7fb6ff"
      />
      {/* Rim — magenta accent from behind, profile glow */}
      <directionalLight
        position={[0, 4, -5]}
        intensity={0.85}
        color="#e070ff"
      />
      {/* Underglow — subtle bounce from below */}
      <pointLight position={[0, -2, 2]} intensity={0.35} color="#bfe1ff" />

      <Suspense fallback={null}>
        {kind === "glb" ? <GltfMesh url={url} /> : <FbxMesh url={url} />}

        {/* Frost zerrecikleri — hafif, modelin etrafında yüzer */}
        <Sparkles
          count={45}
          scale={[3.5, 4, 3.5]}
          size={3}
          speed={0.35}
          opacity={0.55}
          color="#bfe1ff"
          position={[0, 0.5, 0]}
        />
        {/* Magenta accent zerrecikleri — daha az, daha yavaş */}
        <Sparkles
          count={18}
          scale={[3, 3.5, 3]}
          size={5}
          speed={0.18}
          opacity={0.4}
          color="#e070ff"
          position={[0, 0.8, 0]}
        />

        <Environment preset="studio" />
      </Suspense>

      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.6}
        scale={6}
        blur={2.4}
        far={3.5}
        color="#0d2236"
      />

      <OrbitControls
        autoRotate
        autoRotateSpeed={1.4}
        enablePan={false}
        enableZoom
        zoomSpeed={0.6}
        minDistance={2.8}
        maxDistance={7.5}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.85}
        target={[0, 0.05, 0]}
        makeDefault
      />

      {/* Cinematic post-processing layer */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
        <ChromaticAberration
          offset={[0.0008, 0.0008]}
          radialModulation={false}
          modulationOffset={0}
          blendFunction={BlendFunction.NORMAL}
        />
        <Vignette eskil={false} offset={0.18} darkness={0.7} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}

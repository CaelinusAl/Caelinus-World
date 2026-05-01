"use client";

/**
 * ModelPreview — Naz manken adaylarını karşılaştırmak için kullanılan
 * minimal R3F sahnesi. AvatarCanvas'in lite versiyonu: dpr ve ışık
 * yükü daha düşük, bir sayfada 5 tanesi yan yana çalışsın diye.
 */

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useFBX,
  useGLTF,
} from "@react-three/drei";

import { useFitToView } from "@/lib/3d/useFitToView";

function MeshGlb({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  useFitToView(scene, { targetSize: 2.4, yOffset: -0.05 });
  return <primitive object={scene} />;
}

function MeshFbx({ url }: { url: string }) {
  const fbx = useFBX(url);
  const scene = useMemo(() => fbx.clone(true), [fbx]);
  useFitToView(scene, { targetSize: 2.4, yOffset: -0.05 });
  return <primitive object={scene} />;
}

export default function ModelPreview({
  url,
  kind,
}: {
  url: string;
  kind: "glb" | "fbx";
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.4, 3.4], fov: 32 }}
      dpr={[1, 1.2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={0.55} color="#dceeff" />
      <directionalLight position={[3, 6, 4]} intensity={1.1} color="#eaf6ff" />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={0.5}
        color="#7fb6ff"
      />

      <Suspense fallback={null}>
        {kind === "glb" ? <MeshGlb url={url} /> : <MeshFbx url={url} />}
        <Environment preset="studio" />
      </Suspense>

      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.45}
        scale={6}
        blur={2.6}
        far={3.5}
        color="#0d2236"
      />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.7}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}

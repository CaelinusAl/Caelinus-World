"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";

import MemoryStone, { type StoneData } from "./MemoryStone";

const STONES: StoneData[] = [
  { id: "hatirlama", name: "Hatırlama Taşı", fragment: "Hiçbir şey öğrenmedin. Sadece hatırladın.", position: [-5.2, 0, -4], rotation: 0.5 },
  { id: "nehir", name: "Nehir Taşı", fragment: "Işık hep aktı — sen durduğunda bile.", position: [-1.9, 0, -7], rotation: 0.16 },
  { id: "gecit", name: "Geçit Taşı", fragment: "Bir kapıdan geçtin. Kapı sendin.", position: [1.9, 0, -7], rotation: -0.16 },
  { id: "sessizlik", name: "Sessizlik Taşı", fragment: "En derin frekans, sessizliktir.", position: [5.2, 0, -4], rotation: -0.5 },
];

const _cam = new THREE.Vector3();
const _look = new THREE.Vector3();
const _pp = new THREE.Vector3();

function Rig({ camTo, lookTo }: { camTo: [number, number, number]; lookTo: [number, number, number] }) {
  const cur = useRef(new THREE.Vector3(0, 1, -4));
  useFrame((state, dt) => {
    const k = 1 - Math.pow(0.0016, dt);
    _cam.set(camTo[0], camTo[1], camTo[2]).add(_pp.set(state.pointer.x * 0.6, state.pointer.y * 0.3, 0));
    state.camera.position.lerp(_cam, k);
    cur.current.lerp(_look.set(lookTo[0], lookTo[1], lookTo[2]), k);
    state.camera.lookAt(cur.current);
  });
  return null;
}

function Backdrop() {
  const tex = useTexture("/universe/gaia-heart.jpg");
  return (
    <mesh position={[0, 12, -42]} scale={[1, 1, 1]}>
      <planeGeometry args={[150, 84]} />
      <meshBasicMaterial map={tex} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function Scene({ onActive }: { onActive: (s: StoneData | null) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    onActive(STONES.find((s) => s.id === activeId) ?? null);
  }, [activeId, onActive]);

  const overviewCam: [number, number, number] = [0, 1.8, 9.5];
  const overviewLook: [number, number, number] = [0, 1.1, -5];
  let camTo = overviewCam;
  let lookTo = overviewLook;
  const s = STONES.find((x) => x.id === activeId);
  if (s) {
    camTo = [s.position[0] * 0.62, 1.55, s.position[2] + 3.4];
    lookTo = [s.position[0], 1.05, s.position[2]];
  }

  return (
    <>
      <color attach="background" args={["#070b11"]} />
      <fog attach="fog" args={["#0a121c", 9, 46]} />

      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#9fb8d8", "#0a0f16", 0.5]} />
      <directionalLight position={[-8, 12, 4]} intensity={0.8} color="#bcd2ec" />

      <Suspense fallback={null}>
        <Backdrop />
      </Suspense>

      {/* zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <circleGeometry args={[70, 64]} />
        <meshStandardMaterial color="#0c1219" roughness={1} metalness={0} />
      </mesh>

      {STONES.map((stone) => (
        <MemoryStone key={stone.id} data={stone} active={activeId === stone.id} onSelect={setActiveId} />
      ))}

      {/* geri-dönüş: boş zemine dokun */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, -6]}
        onClick={() => setActiveId(null)}
      >
        <circleGeometry args={[70, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Sparkles count={120} scale={[40, 10, 30]} position={[0, 4, -8]} size={2} speed={0.12} color="#ffe6c0" opacity={0.6} />
      <Sparkles count={60} scale={[30, 6, 20]} position={[0, 1.5, -5]} size={3.5} speed={0.3} color="#bfeede" opacity={0.7} />

      <Rig camTo={camTo} lookTo={lookTo} />
    </>
  );
}

export default function World({ onActive }: { onActive: (s: StoneData | null) => void }) {
  return (
    <Canvas
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      camera={{ position: [0, 1.8, 9.5], fov: 55 }}
    >
      <Scene onActive={onActive} />
    </Canvas>
  );
}

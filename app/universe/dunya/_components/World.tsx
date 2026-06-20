"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
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
    const k = 1 - Math.pow(0.0016, Math.min(dt, 0.05));
    _cam.set(camTo[0], camTo[1], camTo[2]).add(_pp.set(state.pointer.x * 0.6, state.pointer.y * 0.3, 0));
    state.camera.position.lerp(_cam, k);
    cur.current.lerp(_look.set(lookTo[0], lookTo[1], lookTo[2]), k);
    state.camera.lookAt(cur.current);
  });
  return null;
}

function Backdrop() {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load("/universe/gaia-heart.jpg", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      if (alive) setTex(t);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!tex) return null;
  return (
    <mesh position={[0, 11, -42]}>
      <planeGeometry args={[150, 84]} />
      <meshBasicMaterial map={tex} toneMapped={false} depthWrite={false} fog={false} />
    </mesh>
  );
}

function Scene({ onActive }: { onActive: (s: StoneData | null) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    onActive(STONES.find((s) => s.id === activeId) ?? null);
  }, [activeId, onActive]);

  let camTo: [number, number, number] = [0, 1.8, 9.5];
  let lookTo: [number, number, number] = [0, 1.1, -5];
  const s = STONES.find((x) => x.id === activeId);
  if (s) {
    camTo = [s.position[0] * 0.62, 1.55, s.position[2] + 3.4];
    lookTo = [s.position[0], 1.05, s.position[2]];
  }

  return (
    <>
      <color attach="background" args={["#070b11"]} />
      <fog attach="fog" args={["#0a121c", 12, 50]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#9fb8d8", "#0a0f16", 0.6]} />
      <directionalLight position={[-8, 12, 4]} intensity={0.9} color="#bcd2ec" />

      <Backdrop />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <circleGeometry args={[70, 64]} />
        <meshStandardMaterial color="#121a24" roughness={1} metalness={0} />
      </mesh>

      {STONES.map((stone) => (
        <MemoryStone key={stone.id} data={stone} active={activeId === stone.id} onSelect={setActiveId} />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -6]} onClick={() => setActiveId(null)}>
        <circleGeometry args={[70, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Sparkles count={140} scale={[44, 12, 30]} position={[0, 5, -10]} size={2} speed={0.12} color="#ffe6c0" opacity={0.7} />
      <Sparkles count={70} scale={[30, 6, 18]} position={[0, 1.6, -5]} size={3.5} speed={0.3} color="#bfeede" opacity={0.8} />

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

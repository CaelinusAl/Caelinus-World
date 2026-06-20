"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type StoneData = {
  id: string;
  name: string;
  fragment: string;
  position: [number, number, number];
  rotation?: number;
};

export default function MemoryStone({
  data,
  active,
  onSelect,
}: {
  data: StoneData;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const lineMat = useRef<THREE.MeshStandardMaterial>(null);
  const pointMat = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef(0.3);

  useFrame((_, dt) => {
    const target = active ? 2.3 : hovered ? 1.1 : 0.35;
    glow.current = THREE.MathUtils.damp(glow.current, target, 3.2, dt);
    if (ringMat.current) ringMat.current.emissiveIntensity = glow.current;
    if (lineMat.current) lineMat.current.emissiveIntensity = glow.current;
    if (pointMat.current) pointMat.current.emissiveIntensity = glow.current * 1.9;
  });

  return (
    <group
      position={data.position}
      rotation={[0, data.rotation ?? 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(data.id);
      }}
    >
      {/* taş gövde */}
      <mesh position={[0, 0.95, 0]}>
        <dodecahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial color="#10141b" roughness={0.96} metalness={0.04} flatShading />
      </mesh>

      {/* Master Seal: çember(evren) + dikey hat(frekans) + altın nokta(hatırlayan öz) */}
      <group position={[0, 1.05, 1.0]}>
        <mesh>
          <torusGeometry args={[0.42, 0.035, 16, 56]} />
          <meshStandardMaterial ref={ringMat} color="#0b0f17" emissive="#b3c4d4" emissiveIntensity={0.35} roughness={0.55} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.05, 1.28, 0.045]} />
          <meshStandardMaterial ref={lineMat} color="#0b0f17" emissive="#b3c4d4" emissiveIntensity={0.35} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <sphereGeometry args={[0.088, 24, 24]} />
          <meshStandardMaterial ref={pointMat} color="#2c2008" emissive="#e8b25a" emissiveIntensity={0.6} roughness={0.4} />
        </mesh>
        <pointLight position={[0, 0, 0.6]} distance={4} intensity={hovered || active ? 2.2 : 0.6} color="#e8c98a" />
      </group>
    </group>
  );
}

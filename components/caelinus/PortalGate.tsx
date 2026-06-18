"use client";

/**
 * PortalGate — merkez kaynak portalı: zeminde yavaşça dönen iç içe altın
 * halkalar + soft ışık diski. Source Tree'yi çevreleyen "kutsal daire".
 *
 * District kapılarından farklı: bu, meydanın merkez enerji eşiği (dekoratif,
 * tıklanmaz). Blender GLB portal sonra bunun yerine geçebilir.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function PortalGate() {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (outer.current) outer.current.rotation.z += delta * 0.05;
    if (inner.current) inner.current.rotation.z -= delta * 0.03;
  });

  return (
    <group>
      {/* Dış altın halka */}
      <mesh ref={outer} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6.2, 0.02, 16, 240]} />
        <meshBasicMaterial color="#c9a45c" />
      </mesh>

      {/* İç ivory halka */}
      <mesh ref={inner} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.8, 0.015, 16, 240]} />
        <meshBasicMaterial color="#ead8a0" transparent opacity={0.65} />
      </mesh>

      {/* Soft mor ışık diski — additive, suya vurur */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.2, 64]} />
        <meshBasicMaterial
          color="#1a1040"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

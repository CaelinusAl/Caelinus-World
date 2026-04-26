"use client";

import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const FEET_Y = -0.03;

/* Platform: rotating energy rings under the avatar */
function EnergyPlatformInner({ color }: { color: string }) {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1.current) ring1.current.rotation.z = t * 0.24;
    if (ring2.current) ring2.current.rotation.z = -t * 0.18;
    if (ring3.current) ring3.current.rotation.z = t * 0.12;
  });

  return (
    <group position={[0, FEET_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.22, 1.32, 96]} />
        <meshBasicMaterial color="#7ce8ff" transparent opacity={0.7} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.98, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
      <mesh ref={ring3} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.44, 1.46, 96]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`g-${i}`} rotation={[-Math.PI / 2, 0, (i * Math.PI) / 3]}>
          <planeGeometry args={[2.9, 0.001]} />
          <meshBasicMaterial color={color} transparent opacity={0.04} />
        </mesh>
      ))}
      <pointLight position={[0, 0.3, 0]} intensity={2.0} color={color} />
    </group>
  );
}

export const EnergyPlatform = memo(EnergyPlatformInner);

/* Particles: floating ambient dots */
const PARTICLE_COUNT = 80;

function EnergyParticlesInner({ color }: { color: string }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 3.0;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.random() * 4 - 2;
      arr[i * 3 + 2] = Math.sin(angle) * radius - 0.5;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.02;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3 + 1] += Math.sin(t * 0.3 + i * 0.5) * 0.0005;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.025} color={color} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

export const EnergyParticles = memo(EnergyParticlesInner);

/* Portal: rotating torus rings behind the avatar */
function PortalInner({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.z = t * 0.06;
      const s = 1 + Math.sin(t * 0.3) * 0.02;
      ref.current.scale.set(s, s, 1);
    }
  });

  return (
    <group ref={ref} position={[0, 1.3, -4]}>
      <mesh>
        <torusGeometry args={[2.0, 0.014, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.3, 0.007, 16, 100]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.07} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.7, 0.009, 16, 100]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.09} />
      </mesh>
      <mesh>
        <circleGeometry args={[1.95, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.02} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export const Portal = memo(PortalInner);

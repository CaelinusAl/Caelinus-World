"use client";

/**
 * HeroField — immersive ana sayfa için hafif, mouse-reaktif partikül alanı.
 *
 * Ağır 3D değil: tek bir additive Points bulutu + birkaç Sparkle + fareyi
 * izleyen altın ışık. Fare hareket ettikçe alan hafifçe o yöne döner
 * (parallax) ve ışık tepki verir → "yaşayan evren" hissi, mobilde bile akıcı.
 * Arka plan CSS gradyanı görünsün diye canvas saydamdır (alpha).
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Field({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const light = useRef<THREE.PointLight>(null);

  const positions = useMemo(() => {
    const count = 820;
    const r = mulberry32(11);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() * 2 - 1) * 6.6;
      arr[i * 3 + 1] = (r() * 2 - 1) * 3.7;
      arr[i * 3 + 2] = (r() * 2 - 1) * 3 - 1;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const g = ref.current;
    if (g) {
      const tx = state.pointer.x * 0.34;
      const ty = -state.pointer.y * 0.2;
      g.rotation.y += (tx - g.rotation.y) * 0.04 + (reduced ? 0 : 0.0006);
      g.rotation.x += (ty - g.rotation.x) * 0.04;
    }
    if (light.current) {
      light.current.position.set(
        state.pointer.x * 5,
        state.pointer.y * 3,
        2.6,
      );
    }
  });

  return (
    <>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#f3d488"
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <pointLight
        ref={light}
        color="#ffd98a"
        intensity={6}
        distance={13}
        decay={2}
      />

      {!reduced && (
        <Sparkles
          count={56}
          scale={[13, 7, 5]}
          size={2.4}
          speed={0.22}
          color="#ffe6ad"
          opacity={0.7}
        />
      )}
    </>
  );
}

export default function HeroField() {
  const reduced = prefersReducedMotion();
  return (
    <Canvas
      className="xp-hero-canvas"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 6], fov: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.4} />
      <Field reduced={reduced} />
    </Canvas>
  );
}

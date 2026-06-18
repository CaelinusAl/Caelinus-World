"use client";

/**
 * SourceCore — CAELINUS SOURCE: meydanın merkezindeki soyut enerji çekirdeği.
 *
 * KARAR (v2): Primitive obje YOK. Yalnız soyut, sinematik enerji:
 *   • Parlayan çekirdek küre (katmanlı additive glow, kalp atışı nabzı)
 *   • Etrafında dönen partikül spirali (galaksi/vortex — altın→mor)
 *   • Kutsal halkalar (farklı eksenlerde ince torus)
 *   • Nabız ışıkları
 *
 * Yazı sahnede değil; CAELINUS SOURCE etiketi drei <Html> overlay.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { radialTexture } from "./glow";

const CORE_Y = 2.4;
const SPIRAL_COUNT = 1100;

// Çift vuruşlu kalp atışı eğrisi (0..~1.6)
function heartbeat(t: number) {
  const p = (t * 0.6) % 1;
  return (
    Math.exp(-Math.pow((p - 0.12) * 9, 2)) +
    0.6 * Math.exp(-Math.pow((p - 0.28) * 9, 2))
  );
}

export default function SourceCore() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const shell = useRef<THREE.Mesh>(null);
  const spiral = useRef<THREE.Points>(null);
  const pulseLight = useRef<THREE.PointLight>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);

  const sprite = useMemo(
    () =>
      radialTexture([
        [0.0, "rgba(255,255,255,1)"],
        [0.35, "rgba(255,232,190,0.8)"],
        [1.0, "rgba(255,210,140,0)"],
      ]),
    [],
  );

  // Partikül spirali — iki kollu vortex, altın→mor
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(SPIRAL_COUNT * 3);
    const col = new Float32Array(SPIRAL_COUNT * 3);
    const gold = new THREE.Color("#ffd98f");
    const violet = new THREE.Color("#b48bff");
    const tmp = new THREE.Color();
    for (let i = 0; i < SPIRAL_COUNT; i++) {
      const arm = i % 2;
      const tt = Math.pow(Math.random(), 0.6);
      const angle = tt * Math.PI * 5 + arm * Math.PI + (Math.random() - 0.5) * 0.7;
      const radius = 0.55 + tt * 2.7;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = CORE_Y + (Math.random() - 0.5) * (0.25 + tt * 0.9);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      tmp.copy(gold).lerp(violet, THREE.MathUtils.clamp(tt + (Math.random() - 0.5) * 0.4, 0, 1));
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const hb = heartbeat(t);

    if (group.current) group.current.rotation.y = Math.sin(t * 0.1) * 0.05;

    if (core.current) core.current.scale.setScalar(1 + hb * 0.13);
    if (coreMat.current) coreMat.current.opacity = 0.5 + hb * 0.3;
    if (shell.current) shell.current.scale.setScalar(1.3 + hb * 0.07);
    if (pulseLight.current) pulseLight.current.intensity = 5 + hb * 9;

    if (spiral.current) {
      spiral.current.rotation.y += delta * 0.18;
      spiral.current.position.y = Math.sin(t * 0.5) * 0.06;
    }

    if (ringA.current) ringA.current.rotation.z += delta * 0.22;
    if (ringB.current) {
      ringB.current.rotation.x += delta * 0.16;
      ringB.current.rotation.y -= delta * 0.1;
    }
    if (ringC.current) ringC.current.rotation.y += delta * 0.28;
  });

  return (
    <group ref={group}>
      {/* Nabız ışıkları */}
      <pointLight ref={pulseLight} position={[0, CORE_Y, 0]} color="#c9a45c" intensity={5} distance={18} />
      <pointLight position={[0, CORE_Y, 0]} color="#8f6cff" intensity={3} distance={15} />

      {/* Parlak dış glow çekirdeği (additive) */}
      <mesh ref={core} position={[0, CORE_Y, 0]}>
        <icosahedronGeometry args={[0.7, 3]} />
        <meshBasicMaterial
          ref={coreMat}
          color="#fff0c8"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* İç mor enerji çekirdeği */}
      <mesh position={[0, CORE_Y, 0]}>
        <icosahedronGeometry args={[0.5, 3]} />
        <meshStandardMaterial color="#8f6cff" emissive="#b48bff" emissiveIntensity={3.4} roughness={0.2} toneMapped={false} />
      </mesh>

      {/* Yarı saydam dış kabuk (fresnel hissi) */}
      <mesh ref={shell} position={[0, CORE_Y, 0]}>
        <icosahedronGeometry args={[0.72, 4]} />
        <meshBasicMaterial
          color="#b48bff"
          transparent
          opacity={0.13}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* Partikül spirali — galaksi/vortex */}
      <points ref={spiral} position={[0, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          map={sprite}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      {/* Kutsal halkalar */}
      <mesh ref={ringA} position={[0, CORE_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.02, 16, 200]} />
        <meshStandardMaterial color="#c9a45c" emissive="#ffcf6b" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh ref={ringB} position={[0, CORE_Y, 0]} rotation={[0.6, 0, 0.4]}>
        <torusGeometry args={[1.7, 0.015, 16, 200]} />
        <meshStandardMaterial color="#8f6cff" emissive="#b48bff" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh ref={ringC} position={[0, CORE_Y, 0]} rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[2.15, 0.012, 16, 200]} />
        <meshStandardMaterial color="#ead8a0" emissive="#ead8a0" emissiveIntensity={1.6} transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* CAELINUS SOURCE — sahne içi değil, HTML overlay */}
      <Html position={[0, 4.7, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div
          style={{
            fontFamily: "var(--cae-font-serif, Georgia, serif)",
            fontSize: "16px",
            letterSpacing: "0.4em",
            textIndent: "0.4em",
            color: "#f3ecdd",
            textShadow: "0 0 16px rgba(143,108,255,0.6), 0 0 6px rgba(0,0,0,0.7)",
            whiteSpace: "nowrap",
          }}
        >
          CAELINUS SOURCE
        </div>
      </Html>
    </group>
  );
}

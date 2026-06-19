"use client";

/**
 * GaiaScene — Universe 2.0'ın ilk gezilebilir district sahnesi (HİBRİT).
 *
 * Mevcut render (/universe/gaia-garden.png) arka plan (horizon) olarak durur;
 * üstüne yürünebilir/keşfedilebilir temel 3B objeler eklenir:
 *   • Kalp Ağacı (Heart Tree) — nefes alan ışıklı kalp kanopisi
 *   • Portal (Kapı) — Gaia'nın bahçe hub'ına iner
 *   • Çiçekler — instanced, hafifçe sallanan ışıklı çiçek alanı
 *   • Su Halkaları — genişleyip sönen dalga halkaları
 *   • Sparkles (polen/ışık zerreleri) — sahneyi "canlı" hissettirir
 *
 * Kamera OrbitControls ile sınırlı yatay açıda gezinir → render hep arkada,
 * 3B objeler hep önde. Çökme güvenliği: texture <Suspense> ile yüklenir.
 */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";

const GAIA_GREEN = "#79e6a0";
const GAIA_GOLD = "#f5d486";
const PORTAL_VIOLET = "#b69cff";

/* ── Arka plan: mevcut render bir horizon düzlemi olarak ── */
function Backdrop() {
  const tex = useTexture("/universe/gaia-garden.png");
  return (
    <mesh position={[0, 8, -26]} scale={[78, 44, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* ── Zemin: cennet toprağı diski ── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[26, 64]} />
      <meshStandardMaterial color="#10241a" roughness={1} metalness={0} />
    </mesh>
  );
}

/* ── Kalp Ağacı — nefes alan ışıklı kalp kanopisi ── */
function heartShape() {
  const s = new THREE.Shape();
  const x = 0,
    y = 0;
  s.moveTo(x + 0.25, y + 0.25);
  s.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  s.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
  s.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
  s.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
  s.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
  s.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
  return s;
}

function HeartTree() {
  const canopy = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(heartShape(), {
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.12,
      bevelSegments: 4,
      curveSegments: 24,
    });
    g.center();
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathe = 1 + Math.sin(t * 1.1) * 0.045; // nefes
    if (canopy.current) {
      canopy.current.scale.setScalar(2.1 * breathe);
      canopy.current.rotation.y = Math.sin(t * 0.25) * 0.08;
    }
    if (glow.current) glow.current.intensity = 5 + Math.sin(t * 1.1) * 2;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* gövde */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.34, 2.4, 12]} />
        <meshStandardMaterial color="#6b4a2b" roughness={0.9} />
      </mesh>
      {/* kalp kanopi (z=PI ile ucu aşağı bakar) */}
      <group ref={canopy} position={[0, 3.4, 0]} rotation={[0, 0, Math.PI]}>
        <mesh geometry={geo}>
          <meshStandardMaterial
            color={GAIA_GREEN}
            emissive={GAIA_GREEN}
            emissiveIntensity={0.9}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      </group>
      {/* kalpten yayılan yeşil ışık + altın çekirdek */}
      <pointLight ref={glow} position={[0, 3.6, 0.4]} color={GAIA_GREEN} distance={16} intensity={6} />
      <pointLight position={[0, 3.6, 0]} color={GAIA_GOLD} distance={4} intensity={2} />
    </group>
  );
}

/* ── Portal (Kapı) — bahçe hub'ına iner ── */
function Portal({ onEnter }: { onEnter: () => void }) {
  const ring = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current) ring.current.rotation.z = t * 0.3;
    if (inner.current) {
      const m = inner.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.28 + Math.sin(t * 1.6) * 0.14;
    }
  });
  return (
    <group
      position={[-5, 1.9, -1.5]}
      onClick={(e) => {
        e.stopPropagation();
        onEnter();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "default")}
    >
      <mesh ref={ring}>
        <torusGeometry args={[1.7, 0.16, 16, 64]} />
        <meshStandardMaterial
          color={PORTAL_VIOLET}
          emissive={PORTAL_VIOLET}
          emissiveIntensity={1.4}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={inner}>
        <circleGeometry args={[1.62, 48]} />
        <meshBasicMaterial color={PORTAL_VIOLET} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color={PORTAL_VIOLET} distance={10} intensity={4} />
    </group>
  );
}

/* ── Çiçekler — instanced, hafif salınan ışıklı alan ── */
function Flowers({ count = 54 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const palette = useMemo(
    () => [new THREE.Color("#ff9ec4"), new THREE.Color(GAIA_GOLD), new THREE.Color("#b69cff"), new THREE.Color(GAIA_GREEN)],
    [],
  );
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = 4 + Math.random() * 18;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          base: 0.18 + Math.random() * 0.18,
          phase: Math.random() * Math.PI * 2,
          color: palette[Math.floor(Math.random() * palette.length)],
        };
      }),
    [count, palette],
  );

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();
    seeds.forEach((s, i) => {
      const bob = Math.sin(t * 1.4 + s.phase) * 0.12;
      dummy.position.set(s.x, s.base + 0.35 + bob, s.z);
      dummy.scale.setScalar(s.base);
      dummy.rotation.y = t * 0.3 + s.phase;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (t < 0.1) m.setColorAt(i, s.color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial vertexColors emissive={GAIA_GREEN} emissiveIntensity={0.25} roughness={0.5} />
    </instancedMesh>
  );
}

/* ── Su Halkaları — genişleyip sönen dalga halkaları ── */
function WaterRings() {
  const rings = useRef<THREE.Mesh[]>([]);
  const RING_N = 4;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const p = ((t * 0.4 + i / RING_N) % 1); // 0..1 döngü
      const scale = 0.4 + p * 4.2;
      r.scale.set(scale, scale, scale);
      const m = r.material as THREE.MeshBasicMaterial;
      m.opacity = (1 - p) * 0.5;
    });
  });
  return (
    <group position={[7, 0.04, -1]}>
      {/* su diski */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5, 48]} />
        <meshStandardMaterial color="#16384a" transparent opacity={0.78} roughness={0.08} metalness={0.5} />
      </mesh>
      {Array.from({ length: RING_N }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) rings.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
        >
          <ringGeometry args={[0.86, 1, 48]} />
          <meshBasicMaterial color="#9fe9ff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <pointLight position={[0, 1.4, 0]} color="#9fe9ff" distance={9} intensity={2.4} />
    </group>
  );
}

function SceneContents({ onEnter }: { onEnter: () => void }) {
  return (
    <>
      <color attach="background" args={["#06140d"]} />
      <fog attach="fog" args={["#06140d", 18, 52]} />

      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#bfe8c8", "#0a1d12", 0.6]} />
      <directionalLight position={[6, 14, 8]} intensity={1.1} color="#fff3d6" castShadow />

      <Suspense fallback={null}>
        <Backdrop />
      </Suspense>

      <Ground />
      <HeartTree />
      <Portal onEnter={onEnter} />
      <Flowers />
      <WaterRings />

      <Sparkles count={120} scale={[34, 12, 34]} position={[0, 5, 0]} size={3} speed={0.3} color={GAIA_GOLD} opacity={0.7} />

      <OrbitControls
        target={[0, 2.2, 0]}
        enablePan={false}
        minDistance={6}
        maxDistance={20}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.5}
        minAzimuthAngle={-Math.PI / 2.4}
        maxAzimuthAngle={Math.PI / 2.4}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function GaiaScene({ onEnter }: { onEnter: () => void }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 3.4, 12], fov: 52 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <SceneContents onEnter={onEnter} />
    </Canvas>
  );
}

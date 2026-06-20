"use client";

/**
 * GaiaScene — Universe 2.0'ın ilk gezilebilir district sahnesi (HİBRİT, v2).
 *
 * Hedef: sembol seti değil, YAŞAYAN MEKÂN hissi.
 *   • Büyük, nefes alan Kalp Ağacı (ışıklı kalp kanopisi)
 *   • Geniş çiçek alanı (saplı, instanced, salınan)
 *   • Yoğun parçacık: yüksek Sparkles + zemin fireflies
 *   • Sis + ışık huzmeleri (faux god rays, additive)
 *   • Bloom + Vignette post-processing (emissive parlaması)
 *   • Portal — yaklaşınca/hover'da parlar, dokununca geçiş (page'de veil)
 *
 * Mevcut render (/universe/gaia-garden.png) horizon arka planı. Kamera
 * sınırlı azimuth ile gezinir → render hep arkada, 3B objeler önde.
 */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const GAIA_GREEN = "#79e6a0";
const GAIA_GOLD = "#f5d486";
const PORTAL_VIOLET = "#b69cff";

/* ── Arka plan: mevcut render bir horizon düzlemi olarak ── */
function Backdrop() {
  const tex = useTexture("/universe/gaia-garden.png");
  return (
    <mesh position={[0, 9, -28]} scale={[88, 50, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* ── Zemin: cennet toprağı diski ── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[34, 64]} />
      <meshStandardMaterial color="#0e2218" roughness={1} metalness={0} />
    </mesh>
  );
}

/* ── Kalp Ağacı — büyük, nefes alan ışıklı kalp kanopisi ── */
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
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.18,
      bevelSegments: 5,
      curveSegments: 28,
    });
    g.center();
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // KÜÇÜK + uzak: sahnenin parçası, ana obje değil — "keşfedilen sır"
    const grow = THREE.MathUtils.lerp(1.05, 1.4, Math.min(1, t / 6));
    const breathe = 1 + Math.sin(t * 0.95) * 0.06;
    if (canopy.current) {
      canopy.current.scale.setScalar(grow * breathe);
      canopy.current.rotation.y = Math.sin(t * 0.22) * 0.1;
      canopy.current.position.y = 4.6 + Math.sin(t * 0.95) * 0.12;
    }
    if (glow.current) glow.current.intensity = 3.5 + Math.sin(t * 0.95) * 1.5;
  });

  return (
    <group position={[3, 0, -16]}>{/* DERİNE gömülü, uzakta parlayan */}
      {/* gövde */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.46, 3.2, 14]} />
        <meshStandardMaterial color="#6b4a2b" roughness={0.9} />
      </mesh>
      {/* kalp kanopi (z=PI ile ucu aşağı bakar) */}
      <group ref={canopy} position={[0, 4.6, 0]} rotation={[0, 0, Math.PI]}>
        <mesh geometry={geo}>
          <meshStandardMaterial
            color={GAIA_GREEN}
            emissive={GAIA_GREEN}
            emissiveIntensity={0.65}
            roughness={0.45}
            metalness={0.1}
          />
        </mesh>
      </group>
      <pointLight ref={glow} position={[0, 4.8, 0.5]} color={GAIA_GREEN} distance={15} intensity={3.5} />
      <pointLight position={[0, 4.8, 0]} color={GAIA_GOLD} distance={5} intensity={2} />
    </group>
  );
}

/* ── Portal (Kapı) — hover'da parlar, dokununca geçiş ── */
function Portal({ onEnter }: { onEnter: () => void }) {
  const ring = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const hovered = useRef(false);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.z = t * 0.3;
      const pulse = 1 + Math.sin(t * 1.4) * 0.03 + (hovered.current ? 0.08 : 0);
      ring.current.scale.setScalar(pulse);
    }
    if (mat.current) {
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(
        mat.current.emissiveIntensity,
        hovered.current ? 2.6 : 1.5,
        0.1,
      );
    }
    if (inner.current) {
      const m = inner.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.3 + Math.sin(t * 1.7) * 0.16 + (hovered.current ? 0.12 : 0);
    }
  });
  return (
    <group
      position={[-5, 2, -1.5]}
      onClick={(e) => {
        e.stopPropagation();
        onEnter();
      }}
      onPointerOver={() => {
        hovered.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "default";
      }}
    >
      <mesh ref={ring}>
        <torusGeometry args={[1.8, 0.18, 18, 72]} />
        <meshStandardMaterial ref={mat} color={PORTAL_VIOLET} emissive={PORTAL_VIOLET} emissiveIntensity={1.5} roughness={0.3} />
      </mesh>
      <mesh ref={inner}>
        <circleGeometry args={[1.7, 56]} />
        <meshBasicMaterial color={PORTAL_VIOLET} transparent opacity={0.32} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Sparkles count={40} scale={[3, 3, 0.6]} size={2.4} speed={0.6} color={PORTAL_VIOLET} />
      <pointLight color={PORTAL_VIOLET} distance={12} intensity={5} />
    </group>
  );
}

/* ── Çiçekler — geniş alan, saplı, salınan (instanced) ── */
function Flowers({ count = 130 }: { count?: number }) {
  const heads = useRef<THREE.InstancedMesh>(null);
  const stems = useRef<THREE.InstancedMesh>(null);
  const palette = useMemo(
    () => [new THREE.Color("#ff9ec4"), new THREE.Color(GAIA_GOLD), new THREE.Color("#b69cff"), new THREE.Color(GAIA_GREEN), new THREE.Color("#ffffff")],
    [],
  );
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = 3.5 + Math.random() * 26; // geniş alan
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          head: 0.16 + Math.random() * 0.2,
          stem: 0.5 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          color: palette[Math.floor(Math.random() * palette.length)],
        };
      }),
    [count, palette],
  );

  useFrame((state) => {
    const h = heads.current;
    const s = stems.current;
    if (!h || !s) return;
    const t = state.clock.elapsedTime;
    const d = new THREE.Object3D();
    seeds.forEach((f, i) => {
      const sway = Math.sin(t * 1.2 + f.phase) * 0.14;
      // sap
      d.position.set(f.x, f.stem / 2, f.z);
      d.rotation.set(sway * 0.4, 0, sway * 0.4);
      d.scale.set(0.04, f.stem, 0.04);
      d.updateMatrix();
      s.setMatrixAt(i, d.matrix);
      // çiçek başı
      d.position.set(f.x + sway * 0.25, f.stem + 0.1, f.z + sway * 0.25);
      d.rotation.set(0, t * 0.3 + f.phase, 0);
      d.scale.setScalar(f.head);
      d.updateMatrix();
      h.setMatrixAt(i, d.matrix);
      if (t < 0.1) h.setColorAt(i, f.color);
    });
    h.instanceMatrix.needsUpdate = true;
    s.instanceMatrix.needsUpdate = true;
    if (h.instanceColor) h.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color="#3c7a4f" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, count]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial vertexColors emissive={GAIA_GREEN} emissiveIntensity={0.35} roughness={0.45} />
      </instancedMesh>
    </group>
  );
}

/* ── Su Halkaları — genişleyip sönen dalga halkaları ── */
function WaterRings() {
  const rings = useRef<THREE.Mesh[]>([]);
  const RING_N = 5;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const p = (t * 0.36 + i / RING_N) % 1;
      const scale = 0.4 + p * 4.6;
      r.scale.set(scale, scale, scale);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.5;
    });
  });
  return (
    <group position={[8, 0.04, -1]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 56]} />
        <meshStandardMaterial color="#16384a" transparent opacity={0.8} roughness={0.06} metalness={0.55} />
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
          <ringGeometry args={[0.86, 1, 56]} />
          <meshBasicMaterial color="#9fe9ff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <pointLight position={[0, 1.6, 0]} color="#9fe9ff" distance={11} intensity={3} />
    </group>
  );
}

/* ── Işık huzmeleri — faux god rays (additive, Bloom ile parlar) ── */
function LightShafts() {
  const grp = useRef<THREE.Group>(null);
  const shafts = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: -14 + i * 4.6 + Math.random() * 2,
        z: -8 + Math.random() * 10,
        tilt: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        w: 0.7 + Math.random() * 0.8,
      })),
    [],
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    grp.current?.children.forEach((c, i) => {
      const mesh = c as THREE.Mesh;
      const m = mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.05 + (Math.sin(t * 0.4 + shafts[i].phase) + 1) * 0.035;
    });
  });
  return (
    <group ref={grp}>
      {shafts.map((s, i) => (
        <mesh key={i} position={[s.x, 9, s.z]} rotation={[0, 0, s.tilt]}>
          <cylinderGeometry args={[s.w * 0.25, s.w, 20, 12, 1, true]} />
          <meshBasicMaterial
            color={GAIA_GOLD}
            transparent
            opacity={0.07}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneContents({ onEnter }: { onEnter: () => void }) {
  return (
    <>
      <color attach="background" args={["#06140d"]} />
      <fog attach="fog" args={["#08180f", 14, 56]} />

      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#bfe8c8", "#0a1d12", 0.7]} />
      <directionalLight position={[6, 16, 8]} intensity={1.15} color="#fff3d6" castShadow />

      <Suspense fallback={null}>
        <Backdrop />
      </Suspense>

      <Ground />
      <LightShafts />
      <HeartTree />
      <Portal onEnter={onEnter} />
      <Flowers />
      <WaterRings />

      {/* yüksek atmosfer parçacıkları + zemin fireflies */}
      <Sparkles count={300} scale={[44, 16, 44]} position={[0, 7, 0]} size={3} speed={0.3} color={GAIA_GOLD} opacity={0.7} />
      <Sparkles count={120} scale={[40, 2.2, 40]} position={[0, 1, 0]} size={4} speed={0.5} color={GAIA_GREEN} opacity={0.9} />

      <OrbitControls
        target={[0, 3, 0]}
        enablePan={false}
        minDistance={6}
        maxDistance={22}
        minPolarAngle={Math.PI * 0.16}
        maxPolarAngle={Math.PI * 0.5}
        minAzimuthAngle={-Math.PI / 2.4}
        maxAzimuthAngle={Math.PI / 2.4}
        enableDamping
        dampingFactor={0.08}
      />

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.28} luminanceSmoothing={0.55} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

export default function GaiaScene({ onEnter }: { onEnter: () => void }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 4, 13.5], fov: 52 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <SceneContents onEnter={onEnter} />
    </Canvas>
  );
}

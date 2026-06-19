"use client";

/**
 * GaiaExperience — Gaia Experience Slice (Ultra) · baked-hibrit sinematik
 *
 * Hedef: fotoreal sinematik "Unreal hissi" / yaşayan dijital mekân (teknik demo değil).
 * Mevcut /sahne'ye DOKUNULMAZ — bu paralel, ayrı bir sahnedir.
 *
 * Fotoreal kaldıraçları:
 *   • Procedural IBL (Environment + Lightformer) → gerçekçi materyal/yansıma, ASSET'siz
 *   • ACES filmic tone mapping + sinematik exposure (post-chain)
 *   • Derin exponential sis (fogExp2) → atmosferik perspektif / derinlik
 *   • Devasa altın-amber Kalp Ağacı (canon palet), monumental ölçek
 *   • Volumetrik ışık sütunları + içlerinde uçuşan toz zerreleri
 *   • Post: Bloom + DepthOfField + Vignette + (Ultra) film grain
 *   • Adaptif kalite (quality.ts): Desktop Ultra / Mobil optimize
 */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  Sparkles,
  useTexture,
} from "@react-three/drei";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

import { detectQuality, type QualitySettings } from "./quality";

const AMBER = "#ffc679";
const AMBER_DEEP = "#e69a45";
const GOLD = "#f3cf8a";
const CANOPY = "#cfe89a"; // sıcak yeşil yaprak
const PORTAL_VIOLET = "#b69cff";
const FOG = "#0b1a12";

/* ── Procedural IBL — asset'siz gerçekçi ışık/yansıma ── */
function StudioEnv({ q }: { q: QualitySettings }) {
  return (
    <Environment resolution={q.envResolution} frames={1}>
      {/* sıcak tepe key ışığı (ağaç üstünden inen altın) */}
      <Lightformer form="rect" intensity={2.6} color="#ffd8a0" position={[0, 45, -12]} scale={[70, 45, 1]} rotation={[-Math.PI / 2.2, 0, 0]} />
      {/* soğuk arka rim (derinlik/ayrışma) */}
      <Lightformer form="rect" intensity={1.1} color="#9fb6ff" position={[-26, 22, 34]} scale={[44, 30, 1]} rotation={[0, Math.PI / 4, 0]} />
      {/* amber yan dolgu */}
      <Lightformer form="ring" intensity={1.6} color="#ffb070" position={[28, 26, -18]} scale={[22, 22, 1]} />
      {/* alttan yumuşak biolum yansıması */}
      <Lightformer form="circle" intensity={0.6} color="#7fe6a8" position={[0, 1, 0]} scale={[40, 40, 1]} rotation={[Math.PI / 2, 0, 0]} />
    </Environment>
  );
}

/* ── Uzak sinematik vista (mevcut render, sis içine gömülü) ── */
function Backdrop() {
  const tex = useTexture("/universe/gaia-garden.png");
  return (
    <mesh position={[0, 36, -160]} scale={[330, 185, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} color="#7c8a72" toneMapped={false} depthWrite={false} fog />
    </mesh>
  );
}

function SkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[340, 32, 16]} />
      <meshBasicMaterial color="#050f0a" side={THREE.BackSide} fog={false} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[260, 96]} />
      {/* hafif nemli zemin → IBL'i yansıtır (gerçekçilik) */}
      <meshStandardMaterial color="#0c1f15" roughness={0.62} metalness={0.18} envMapIntensity={0.8} />
    </mesh>
  );
}

function DistantForest({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 60;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: 10 + Math.random() * 26, w: 3 + Math.random() * 4 };
      }),
    [count],
  );
  useFrame(() => {
    const m = ref.current;
    if (!m || (m.userData.placed as boolean)) return;
    const d = new THREE.Object3D();
    seeds.forEach((s, i) => {
      d.position.set(s.x, s.h / 2, s.z);
      d.scale.set(s.w, s.h, s.w);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.userData.placed = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <coneGeometry args={[1, 1, 7]} />
      <meshStandardMaterial color="#08180f" roughness={1} envMapIntensity={0.3} />
    </instancedMesh>
  );
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0.25, 0.25);
  s.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
  s.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
  s.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
  s.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
  s.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
  s.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
  return s;
}

function HeartTree({ breath }: { breath: React.MutableRefObject<number> }) {
  const canopy = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(heartShape(), {
      depth: 2.6,
      bevelEnabled: true,
      bevelThickness: 1.0,
      bevelSize: 1.0,
      bevelSegments: 6,
      curveSegments: 40,
    });
    g.center();
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const grow = THREE.MathUtils.lerp(17, 23, Math.min(1, t / 8));
    const b = Math.sin(t * 0.6);
    breath.current = b;
    const breathe = 1 + b * 0.04;
    if (canopy.current) {
      canopy.current.scale.setScalar(grow * breathe);
      canopy.current.rotation.y = Math.sin(t * 0.14) * 0.06;
      canopy.current.position.y = 36 + b * 0.6;
    }
    if (glow.current) glow.current.intensity = 30 + b * 12;
  });

  return (
    <group>
      <mesh position={[0, 14, 0]} castShadow>
        <cylinderGeometry args={[1.0, 2.2, 28, 18]} />
        <meshStandardMaterial color="#5b3d22" roughness={0.85} metalness={0.05} envMapIntensity={0.9} />
      </mesh>
      <group ref={canopy} position={[0, 36, 0]} rotation={[0, 0, Math.PI]}>
        <mesh geometry={geo}>
          {/* sıcak yaprak + iç amber biolum; IBL ile gerçek gölgelenme */}
          <meshStandardMaterial color={CANOPY} emissive={AMBER} emissiveIntensity={0.9} roughness={0.55} metalness={0.05} envMapIntensity={1.1} />
        </mesh>
      </group>
      <pointLight ref={glow} position={[0, 36, 5]} color={AMBER} distance={140} intensity={30} />
      <pointLight position={[0, 31, 0]} color={GOLD} distance={34} intensity={9} />
    </group>
  );
}

function Portal({ onEnter }: { onEnter: () => void }) {
  const ring = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const hovered = useRef(false);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.z = t * 0.15;
      ring.current.scale.setScalar(1 + Math.sin(t) * 0.014 + (hovered.current ? 0.04 : 0));
    }
    if (mat.current) mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, hovered.current ? 3 : 1.8, 0.08);
    if (inner.current) (inner.current.material as THREE.MeshBasicMaterial).opacity = 0.26 + Math.sin(t * 1.4) * 0.12 + (hovered.current ? 0.12 : 0);
  });
  return (
    <group
      position={[-36, 12, -18]}
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
        <torusGeometry args={[10.5, 0.85, 22, 110]} />
        <meshStandardMaterial ref={mat} color={PORTAL_VIOLET} emissive={PORTAL_VIOLET} emissiveIntensity={1.8} roughness={0.25} metalness={0.3} envMapIntensity={1.2} />
      </mesh>
      <mesh ref={inner}>
        <circleGeometry args={[9.8, 72]} />
        <meshBasicMaterial color={PORTAL_VIOLET} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Sparkles count={130} scale={[22, 22, 3]} size={4} speed={0.45} color={PORTAL_VIOLET} />
      <pointLight color={PORTAL_VIOLET} distance={64} intensity={18} />
    </group>
  );
}

function Flowers({ count }: { count: number }) {
  const heads = useRef<THREE.InstancedMesh>(null);
  const stems = useRef<THREE.InstancedMesh>(null);
  const palette = useMemo(
    () => [new THREE.Color("#ffb3d1"), new THREE.Color(GOLD), new THREE.Color("#c9a8ff"), new THREE.Color(CANOPY), new THREE.Color("#fff3df")],
    [],
  );
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = 6 + Math.random() * 120;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          head: 0.4 + Math.random() * 0.7,
          stem: 1.4 + Math.random() * 3,
          phase: Math.random() * Math.PI * 2,
          color: palette[Math.floor(Math.random() * palette.length)],
          open: 0,
        };
      }),
    [count, palette],
  );
  useFrame((state) => {
    const h = heads.current;
    const s = stems.current;
    if (!h || !s) return;
    const t = state.clock.elapsedTime;
    const cam = state.camera.position;
    const d = new THREE.Object3D();
    seeds.forEach((f, i) => {
      const dist = Math.hypot(f.x - cam.x, f.z - cam.z);
      const target = THREE.MathUtils.clamp((28 - dist) / 28, 0, 1);
      f.open += (target - f.open) * 0.08;
      const sway = Math.sin(t * 1.05 + f.phase) * 0.12;
      d.position.set(f.x, f.stem / 2, f.z);
      d.rotation.set(sway * 0.4, 0, sway * 0.4);
      d.scale.set(0.06, f.stem, 0.06);
      d.updateMatrix();
      s.setMatrixAt(i, d.matrix);
      const headScale = f.head * (0.45 + f.open * 1.35);
      d.position.set(f.x + sway * 0.25, f.stem + 0.15, f.z + sway * 0.25);
      d.rotation.set(0, t * 0.22 + f.phase, 0);
      d.scale.setScalar(headScale);
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
        <meshStandardMaterial color="#356b46" roughness={0.8} envMapIntensity={0.6} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, count]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial vertexColors emissive={AMBER} emissiveIntensity={0.3} roughness={0.5} envMapIntensity={0.9} />
      </instancedMesh>
    </group>
  );
}

/* ── Volumetrik ışık sütunları + içinde toz ── */
function LightShafts({ count }: { count: number }) {
  const grp = useRef<THREE.Group>(null);
  const shafts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: -52 + (i * 104) / count + (Math.random() - 0.5) * 10,
        z: -34 + Math.random() * 48,
        tilt: (Math.random() - 0.5) * 0.22,
        phase: Math.random() * Math.PI * 2,
        w: 2.6 + Math.random() * 3.2,
      })),
    [count],
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    grp.current?.children.forEach((c, i) => {
      const mesh = c.children?.[0] as THREE.Mesh | undefined;
      if (mesh) (mesh.material as THREE.MeshBasicMaterial).opacity = 0.05 + (Math.sin(t * 0.32 + shafts[i].phase) + 1) * 0.035;
    });
  });
  return (
    <group ref={grp}>
      {shafts.map((s, i) => (
        <group key={i} position={[s.x, 32, s.z]} rotation={[0, 0, s.tilt]}>
          <mesh>
            <cylinderGeometry args={[s.w * 0.28, s.w, 62, 14, 1, true]} />
            <meshBasicMaterial color={AMBER} transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </mesh>
          <Sparkles count={18} scale={[s.w * 1.6, 50, s.w * 1.6]} size={2.2} speed={0.18} color={GOLD} opacity={0.7} />
        </group>
      ))}
    </group>
  );
}

function SceneBreath({ breath }: { breath: React.MutableRefObject<number> }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    const b = breath.current;
    if (amb.current) amb.current.intensity = 0.32 + b * 0.06;
    if (hemi.current) hemi.current.intensity = 0.55 + b * 0.1;
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.32} />
      <hemisphereLight ref={hemi} args={["#ffe7c0", "#08180f", 0.55]} />
    </>
  );
}

function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // çok hafif sinematik kayma (OrbitControls damping ile uyumlu)
    state.camera.position.y += Math.sin(t * 0.18) * 0.004;
  });
  return null;
}

function Scene({ q, onEnter }: { q: QualitySettings; onEnter: () => void }) {
  const breath = useRef(0);
  return (
    <>
      <color attach="background" args={[FOG]} />
      <fogExp2 attach="fog" args={[FOG, 0.0072]} />

      <StudioEnv q={q} />
      <SceneBreath breath={breath} />
      <directionalLight position={[24, 64, 28]} intensity={1.1} color="#ffe9c4" />

      <SkyDome />
      <Suspense fallback={null}>
        <Backdrop />
      </Suspense>

      <Ground />
      <DistantForest count={q.forest} />
      <LightShafts count={q.shafts} />
      <HeartTree breath={breath} />
      <Portal onEnter={onEnter} />
      <Flowers count={q.flowers} />

      <Sparkles count={q.pollen} scale={[170, 56, 170]} position={[0, 26, 0]} size={3.2} speed={0.22} color={GOLD} opacity={0.7} />
      <Sparkles count={Math.round(q.pollen * 0.45)} scale={[150, 6, 150]} position={[0, 2.6, 0]} size={4.5} speed={0.4} color={AMBER_DEEP} opacity={0.85} />

      <CameraDrift />
      <OrbitControls
        target={[0, 16, 0]}
        enablePan={false}
        minDistance={14}
        maxDistance={110}
        minPolarAngle={Math.PI * 0.06}
        maxPolarAngle={Math.PI * 0.49}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.55}
        zoomSpeed={0.9}
      />

      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.22} luminanceSmoothing={0.5} mipmapBlur />
        {q.postDoF ? (
          <DepthOfField focusDistance={0.018} focalLength={0.05} bokehScale={2.6} />
        ) : (
          <></>
        )}
        <Vignette eskil={false} offset={0.2} darkness={0.78} />
        {q.postGrain ? <Noise opacity={0.028} /> : <></>}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}

export default function GaiaExperience({ onEnter }: { onEnter: () => void }) {
  const q = useMemo(() => detectQuality(), []);
  return (
    <Canvas
      shadows={false}
      dpr={q.dpr}
      camera={{ position: [0, 11, 74], fov: 52 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Scene q={q} onEnter={onEnter} />
    </Canvas>
  );
}

"use client";

/**
 * FrequencyDiveCanvas — Ağacın frekansına sonsuz dalış.
 *
 * Ortada bir ağaç durur. Dokununca (tıkla) içine girilir: kamera ağacın
 * içine dalar ve fareyi her oynattığında DAHA DERİNE iner — katman katman:
 * Kabuk → Yaprak → Öz Damar → Hücre → Su → Işık → Frekans → (∞ döngü).
 * Her katmanın bir Solfeggio Hz'i ve rengi vardır; tünel o renge bürünür.
 * Fare hareketi = ileri itki (derinlik); durunca yavaşça süzülmeye devam eder.
 *
 * Geometri prosedüreldir (asset gerektirmez). reduced-motion'a saygılıdır.
 */

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

export type DiveLayer = {
  name: string;
  hz: number;
  color: string;
  /** Kaçıncı katmandayız (∞ büyür). */
  depthIndex: number;
};

const LAYERS: { name: string; hz: number; color: string }[] = [
  { name: "Kabuk", hz: 396, color: "#c98a4b" },
  { name: "Yaprak", hz: 417, color: "#6fc24a" },
  { name: "Öz Damar", hz: 528, color: "#39d98a" },
  { name: "Hücre", hz: 639, color: "#3ad1c4" },
  { name: "Su", hz: 741, color: "#46b8ff" },
  { name: "Işık", hz: 852, color: "#9b7bff" },
  { name: "Frekans", hz: 963, color: "#ff7ad9" },
];

const SPACING = 4.5;
const RINGS = 34;
const TUNNEL = RINGS * SPACING;
const LAYER_LEN = 42; // derinlik birimi / katman
const BASE_CREEP = 5; // fare durunca taban hız (birim/sn)
const FOG_FAR = 64; // < TUNNEL → halkalar görünmeden doğar

function colorAt(d: number, out: THREE.Color, tmp: THREE.Color) {
  const span = LAYERS.length * LAYER_LEN;
  const dd = ((d % span) + span) % span;
  const idx = Math.floor(dd / LAYER_LEN);
  const frac = (dd % LAYER_LEN) / LAYER_LEN;
  out.set(LAYERS[idx % LAYERS.length].color);
  tmp.set(LAYERS[(idx + 1) % LAYERS.length].color);
  out.lerp(tmp, frac);
  return out;
}

/* ── Bekleyen ağaç: dokununca dalış başlar ── */
function IdleTree({
  reduced,
  onEnter,
}: {
  reduced: boolean;
  onEnter: () => void;
}) {
  const glow = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (reduced || !glow.current) return;
    const p = 0.6 + Math.sin(state.clock.elapsedTime * 1.6) * 0.4;
    glow.current.intensity = 3 + p * 3;
  });

  return (
    <group
      position={[0, -1, -4.5]}
      onClick={(e) => {
        e.stopPropagation();
        onEnter();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 1.9, 10]} />
        <meshStandardMaterial color="#5a3d22" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial
          color="#2f7a44"
          emissive="#39d98a"
          emissiveIntensity={0.35}
          roughness={0.75}
        />
      </mesh>
      <pointLight
        ref={glow}
        position={[0, 2.4, 1]}
        color="#39d98a"
        intensity={4}
        distance={9}
        decay={2}
      />
    </group>
  );
}

/* ── Tünel: frekans katmanlarına sonsuz dalış ── */
function DiveTunnel({
  reduced,
  onLayer,
}: {
  reduced: boolean;
  onLayer: (l: DiveLayer) => void;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const rings = useRef<THREE.Mesh[]>([]);
  const center = useRef<THREE.PointLight>(null);
  const depth = useRef(0);
  const vel = useRef(14); // dalışa giriş itkisi
  const steer = useRef({ x: 0, y: 0 });
  const lastLayer = useRef(-1);

  const col = useRef(new THREE.Color());
  const tmp = useRef(new THREE.Color());

  useEffect(() => {
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      // Fare ne kadar oynarsa o kadar derine: hareket büyüklüğü → itki.
      vel.current = Math.min(vel.current + (Math.abs(e.movementX) + Math.abs(e.movementY)) * (reduced ? 0 : 0.5), 80);
      steer.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [gl, reduced]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // İlerleme: taban + fare itkisi; itki sürtünmeyle söner.
    depth.current += (BASE_CREEP + vel.current) * dt;
    vel.current *= Math.pow(0.04, dt);

    // Hafif yön (parallax)
    camera.rotation.set(
      -steer.current.y * 0.12,
      -steer.current.x * 0.12,
      0,
      "YXZ",
    );

    // Halkaları sar + her birini kendi derinlik katmanının rengine boya.
    for (let i = 0; i < rings.current.length; i++) {
      const ring = rings.current[i];
      if (!ring) continue;
      const z = -TUNNEL + ((i * SPACING + depth.current) % TUNNEL);
      ring.position.setZ(z);
      const ringDepth = depth.current + (-z); // ileri = daha derin
      const c = colorAt(ringDepth, col.current, tmp.current);
      const mat = ring.material as THREE.MeshStandardMaterial;
      mat.color.copy(c);
      mat.emissive.copy(c);
      const pulse = reduced ? 1 : 1 + Math.sin(depth.current * 0.3 + i) * 0.06;
      ring.scale.set(pulse, pulse, 1);
    }

    // Merkez ışık = güncel katman rengi
    const now = colorAt(depth.current, col.current, tmp.current);
    if (center.current) center.current.color.copy(now);

    // Katman değişince üst kata bildir (frekans okuması)
    const span = LAYERS.length * LAYER_LEN;
    const dd = ((depth.current % span) + span) % span;
    const idx = Math.floor(dd / LAYER_LEN);
    const totalIdx = Math.floor(depth.current / LAYER_LEN);
    if (idx !== lastLayer.current) {
      lastLayer.current = idx;
      const L = LAYERS[idx % LAYERS.length];
      onLayer({
        name: L.name,
        hz: L.hz,
        color: L.color,
        depthIndex: Math.max(0, totalIdx),
      });
    }
  });

  return (
    <>
      <color attach="background" args={["#02030a"]} />
      <fog attach="fog" args={["#02030a", 8, FOG_FAR]} />
      <ambientLight intensity={0.25} />
      <pointLight ref={center} position={[0, 0, 2]} intensity={8} distance={20} decay={1.5} />

      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) rings.current[i] = el;
          }}
        >
          <torusGeometry args={[3.4, 0.14, 8, 48]} />
          <meshStandardMaterial
            emissiveIntensity={1.3}
            roughness={0.4}
            metalness={0.1}
            toneMapped={false}
          />
        </mesh>
      ))}

      {!reduced && (
        <Sparkles count={120} scale={[8, 8, FOG_FAR]} size={3} speed={0.6} opacity={0.7} />
      )}
    </>
  );
}

export default function FrequencyDiveCanvas({
  onLayer,
}: {
  onLayer: (l: DiveLayer | null) => void;
}) {
  const reduced = prefersReducedMotion();
  const [diving, setDiving] = useState(false);

  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 0], fov: 78 }}
    >
      {diving ? (
        <DiveTunnel reduced={reduced} onLayer={onLayer} />
      ) : (
        <>
          <color attach="background" args={["#060a12"]} />
          <fog attach="fog" args={["#060a12", 6, 22]} />
          <ambientLight intensity={0.5} />
          <hemisphereLight args={["#bfe0ff", "#16240f", 0.6]} />
          <directionalLight position={[4, 8, 2]} intensity={1.4} />
          <IdleTree
            reduced={reduced}
            onEnter={() => {
              setDiving(true);
            }}
          />
          {!reduced && <Sparkles count={60} scale={[10, 6, 10]} size={2} speed={0.3} />}
        </>
      )}
    </Canvas>
  );
}

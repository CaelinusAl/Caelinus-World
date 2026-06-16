"use client";

/**
 * ShowroomCanvas — "içinde yürünen" Caelinus Salonu (5D).
 *
 * Dekor değil, MEKÂN: göz hizasında birinci-şahıs gezinti (sürükle → bak,
 * zemine dokun → oraya yürü), seni saran sütunlu salon, fiziksel gölge ve
 * yaklaşım-tepkisi (bir esere yaklaşınca paneli kendiliğinden açılır).
 * Merkez ışığı kullanıcının frekans rengini taşır (rezonans / 5D).
 *
 * Global WorldBackdrop bu rotada "off" (lib/world/config) — çakışma yok.
 */

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MeshReflectorMaterial,
  Stars,
  Float,
  Html,
  Environment,
  Lightformer,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { useWorldStore } from "@/lib/world/store";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import { EXHIBITS, exhibitPosition, type Exhibit } from "./exhibits";

const EYE = 1.6; // göz hizası (metre)
const WALK_SPEED = 0.085; // kare başına metre
const MAX_RADIUS = 9; // salonun yürünebilir yarıçapı
const NEAR_DIST = 2.4; // eser "açılma" mesafesi

/** Birinci-şahıs gezinti: sürükle → bak (yaw/pitch), zemine dokun → yürü. */
function WalkControls({
  reduced,
  onNear,
}: {
  reduced: boolean;
  onNear: (i: number | null) => void;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(0);
  const last = useRef({ x: 0, y: 0 });
  const target = useRef<THREE.Vector3 | null>(null);
  const nearRef = useRef<number | null>(null);
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const ray = useRef(new THREE.Raycaster());
  const hit = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, EYE, 7);
    camera.rotation.set(0, 0, 0, "YXZ");
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;

    const down = (e: PointerEvent) => {
      dragging.current = true;
      moved.current = 0;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      moved.current += Math.abs(dx) + Math.abs(dy);
      yaw.current -= dx * 0.0026;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - dy * 0.0026,
        -0.6,
        0.5,
      );
      last.current = { x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      // Sürükleme değil de "dokunuş"sa → zemindeki noktaya yürü.
      if (dragging.current && moved.current < 7) {
        const rect = el.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        ray.current.setFromCamera(new THREE.Vector2(nx, ny), camera);
        if (ray.current.ray.intersectPlane(plane.current, hit.current)) {
          const r = Math.hypot(hit.current.x, hit.current.z);
          if (r > MAX_RADIUS) {
            hit.current.x = (hit.current.x / r) * MAX_RADIUS;
            hit.current.z = (hit.current.z / r) * MAX_RADIUS;
          }
          target.current = hit.current.clone();
        }
      }
      dragging.current = false;
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl, camera]);

  useFrame(() => {
    // Bakış
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

    // Yürüyüş
    const t = target.current;
    if (t) {
      const cur = camera.position;
      const dx = t.x - cur.x;
      const dz = t.z - cur.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.1) {
        const step = reduced ? dist : Math.min(dist, WALK_SPEED);
        camera.position.set(
          cur.x + (dx / dist) * step,
          EYE,
          cur.z + (dz / dist) * step,
        );
      } else {
        camera.position.set(cur.x, EYE, cur.z);
        target.current = null;
      }
    }

    // Yaklaşım-tepkisi: en yakın eser eşik içindeyse onu "aç".
    let near: number | null = null;
    let best = NEAR_DIST;
    for (let i = 0; i < EXHIBITS.length; i++) {
      const [px, , pz] = exhibitPosition(i);
      const d = Math.hypot(px - camera.position.x, pz - camera.position.z);
      if (d < best) {
        best = d;
        near = i;
      }
    }
    if (near !== nearRef.current) {
      nearRef.current = near;
      onNear(near);
    }
  });

  return null;
}

function Pedestal({
  index,
  exhibit,
  reduced,
  onSelect,
}: {
  index: number;
  exhibit: Exhibit;
  reduced: boolean;
  onSelect: (i: number) => void;
}) {
  const [px, , pz] = exhibitPosition(index);

  return (
    <group position={[px, 0, pz]}>
      <mesh
        position={[0, 0.45, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(index);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <cylinderGeometry args={[0.55, 0.62, 0.9, 48]} />
        <meshStandardMaterial color="#10131f" metalness={0.7} roughness={0.3} />
      </mesh>

      <Float
        speed={reduced ? 0 : 1.6}
        rotationIntensity={reduced ? 0 : 0.5}
        floatIntensity={reduced ? 0 : 0.7}
      >
        <mesh position={[0, 1.55, 0]} castShadow>
          <icosahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color={exhibit.color}
            emissive={exhibit.color}
            emissiveIntensity={1.4}
            metalness={0.2}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </Float>

      <pointLight
        position={[0, 1.5, 0]}
        color={exhibit.color}
        intensity={6}
        distance={6}
        decay={2}
      />

      <Html
        center
        position={[0, 2.45, 0]}
        distanceFactor={9}
        style={{ pointerEvents: "none" }}
      >
        <div className="sr-label">
          <span className="sr-label-glyph" style={{ color: exhibit.color }}>
            {exhibit.glyph}
          </span>
          <span className="sr-label-name">{exhibit.label}</span>
        </div>
      </Html>
    </group>
  );
}

/** Seni saran sütun halkası — boşluğu salona çevirir. */
function Colonnade() {
  const cols = 12;
  const r = 8.6;
  return (
    <group>
      {Array.from({ length: cols }).map((_, i) => {
        const a = (i / cols) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * r, 3, -Math.cos(a) * r]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.3, 0.34, 6, 24]} />
            <meshStandardMaterial
              color="#0c0f1a"
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene({
  reduced,
  resonancePrimary,
  onNear,
  onSelectIndex,
}: {
  reduced: boolean;
  resonancePrimary: string;
  onNear: (i: number | null) => void;
  onSelectIndex: (i: number) => void;
}) {
  return (
    <>
      <color attach="background" args={["#05060d"]} />
      <fog attach="fog" args={["#05060d", 12, 30]} />

      {/* Gerçek PBR yansımaları için hafif ortam (ağ gerektirmez). */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          intensity={1.6}
          position={[0, 6, -6]}
          scale={[12, 6, 1]}
          color="#8aa0ff"
        />
        <Lightformer
          intensity={1.2}
          position={[0, 4, 6]}
          scale={[12, 6, 1]}
          color={resonancePrimary}
        />
      </Environment>

      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#2a2f44", "#04040a", 0.4]} />
      {/* Merkez tavan ışığı — frekans rengi + gölge (mekânsallık). */}
      <spotLight
        position={[0, 9, 0]}
        angle={0.9}
        penumbra={0.6}
        intensity={70}
        distance={40}
        decay={1.5}
        color={resonancePrimary}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Stars
        radius={60}
        depth={40}
        count={reduced ? 1200 : 2600}
        factor={4}
        fade
        speed={reduced ? 0 : 0.4}
      />

      <Colonnade />

      {/* Yansıtıcı zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[42, 72]} />
        <MeshReflectorMaterial
          resolution={reduced ? 256 : 512}
          mirror={0.4}
          blur={[300, 90]}
          mixBlur={6}
          mixStrength={1.3}
          roughness={0.8}
          depthScale={1.1}
          metalness={0.5}
          color="#070912"
        />
      </mesh>

      {/* Pedestal altı yumuşak gölge — yerçekimi hissi. */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={24}
        blur={2.2}
        far={6}
      />

      {EXHIBITS.map((ex, i) => (
        <Pedestal
          key={ex.id}
          index={i}
          exhibit={ex}
          reduced={reduced}
          onSelect={onSelectIndex}
        />
      ))}

      <WalkControls reduced={reduced} onNear={onNear} />
    </>
  );
}

export default function ShowroomCanvas({
  onSelect,
}: {
  onSelect: (e: Exhibit | null) => void;
}) {
  const reduced = prefersReducedMotion();
  const resonancePrimary = useWorldStore((s) => s.resonance.primary);

  const handleIndex = (i: number | null) => {
    onSelect(i == null ? null : EXHIBITS[i]);
  };

  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, EYE, 7], fov: 60 }}
    >
      <Scene
        reduced={reduced}
        resonancePrimary={resonancePrimary}
        onNear={handleIndex}
        onSelectIndex={handleIndex}
      />
    </Canvas>
  );
}

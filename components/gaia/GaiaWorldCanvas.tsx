"use client";

/**
 * GaiaWorldCanvas — Gaia'nın Bahçesi, 360° (ilk aşama).
 *
 * Kullanıcı bahçenin ortasında durur. Ekrana basıp sürükledikçe dünya 360°
 * döner; her yönde bir sektör belirir: sebze bahçeleri, meyve bahçeleri,
 * şifalı bitkiler, dükkanlar. Boş bırakılınca yavaşça kendi etrafında süzülür
 * (canlı his). Bir sektör totemine tıklayınca o dünyaya "gir" paneli açılır.
 *
 * Geometri prosedüreldir (asset gerektirmez) ama ışık/atmosfer ile "mekân"
 * hissi verir. reduced-motion'a saygılıdır.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Cloud, Html, Float } from "@react-three/drei";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import {
  GAIA_SECTORS,
  sectorAngle,
  sectorPosition,
  type GaiaSector,
} from "./gaia-sectors";

const EYE = 1.6;

/** Saf, tohumlanabilir PRNG (Math.random yerine — kararlı yerleşim). */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Gezinti: ekrana bas-sürükle → 360° dön. Boşta yavaş süzülür. ── */
function LookControls({ reduced }: { reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const idle = useRef(0);

  useEffect(() => {
    camera.position.set(0, EYE, 0);
    camera.rotation.set(0, 0, 0, "YXZ");
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      dragging.current = true;
      idle.current = 0;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      yaw.current -= dx * 0.004;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - dy * 0.003,
        -0.35,
        0.45,
      );
      last.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
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

  useFrame((_, delta) => {
    if (!dragging.current && !reduced) {
      idle.current += delta;
      if (idle.current > 1.5) yaw.current -= delta * 0.06;
    }
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
  });

  return null;
}

/* ── Bitki bileşenleri (prosedürel) ── */

function FruitTree({ tone, seed }: { tone: string; seed: number }) {
  const fruits = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: 6 }).map(() => {
      const a = rnd() * Math.PI * 2;
      const r = 0.55 + rnd() * 0.35;
      const h = 1.7 + rnd() * 0.6;
      return [Math.cos(a) * r, h, Math.sin(a) * r] as [number, number, number];
    });
  }, [seed]);
  return (
    <group>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.18, 1.3, 8]} />
        <meshStandardMaterial color="#5a3d22" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial color="#2f7a44" roughness={0.8} />
      </mesh>
      {fruits.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial
            color={tone}
            emissive={tone}
            emissiveIntensity={0.25}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function VeggieMound({ seed }: { seed: number }) {
  const sprouts = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: 5 }).map(() => {
      const a = rnd() * Math.PI * 2;
      const r = rnd() * 0.35;
      const rot = rnd() * 3;
      return {
        p: [Math.cos(a) * r, 0.18, Math.sin(a) * r] as [
          number,
          number,
          number,
        ],
        rot,
      };
    });
  }, [seed]);
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <sphereGeometry args={[0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4a3322" roughness={1} />
      </mesh>
      {sprouts.map((s, i) => (
        <mesh key={i} position={s.p} rotation={[0, s.rot, 0]}>
          <coneGeometry args={[0.1, 0.42, 6]} />
          <meshStandardMaterial color="#7bc24a" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function HerbCluster({ tone, seed }: { tone: string; seed: number }) {
  const blades = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: 7 }).map(() => {
      const a = rnd() * Math.PI * 2;
      const r = rnd() * 0.28;
      const h = 0.5 + rnd() * 0.5;
      return {
        p: [Math.cos(a) * r, h / 2, Math.sin(a) * r] as [
          number,
          number,
          number,
        ],
        h,
      };
    });
  }, [seed]);
  return (
    <group>
      {blades.map((b, i) => (
        <mesh key={i} position={b.p}>
          <coneGeometry args={[0.06, b.h, 6]} />
          <meshStandardMaterial
            color={tone}
            emissive={tone}
            emissiveIntensity={0.5}
            roughness={0.6}
          />
        </mesh>
      ))}
      <pointLight color={tone} intensity={2.5} distance={3} decay={2} />
    </group>
  );
}

function Stall({ tone }: { tone: string }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.6, 1, 0.7]} />
        <meshStandardMaterial color="#6b4a2e" roughness={0.85} />
      </mesh>
      <mesh position={[-0.75, 1.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
        <meshStandardMaterial color="#4a3320" />
      </mesh>
      <mesh position={[0.75, 1.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
        <meshStandardMaterial color="#4a3320" />
      </mesh>
      <mesh position={[0, 1.75, 0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.9, 0.08, 0.9]} />
        <meshStandardMaterial
          color={tone}
          emissive={tone}
          emissiveIntensity={0.3}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

/* ── Sektör: merkez konuma yerleştirilen bitki kümesi + totem ── */
function Sector({
  index,
  sector,
  reduced,
  onSelect,
}: {
  index: number;
  sector: GaiaSector;
  reduced: boolean;
  onSelect: (s: GaiaSector) => void;
}) {
  const a = sectorAngle(index);
  const [cx, , cz] = sectorPosition(index);

  // Sektör içine dağılmış bitki örnekleri (deterministik konum).
  const items = useMemo(() => {
    const count = sector.kind === "shop" ? 3 : 6;
    return Array.from({ length: count }).map((_, i) => {
      const spread = ((i / Math.max(1, count - 1)) - 0.5) * 0.9; // arc
      const ang = a + spread;
      const rad = 7 + (i % 2) * 1.6;
      return [Math.sin(ang) * rad, 0, -Math.cos(ang) * rad] as [
        number,
        number,
        number,
      ];
    });
  }, [a, sector.kind]);

  const facing = Math.atan2(-cx, -cz); // bitkiler/totem merkeze bakar

  return (
    <group>
      {items.map((p, i) => (
        <group key={i} position={p} rotation={[0, facing, 0]}>
          {sector.kind === "fruit" && (
            <FruitTree tone={sector.color} seed={index * 17 + i + 1} />
          )}
          {sector.kind === "veg" && <VeggieMound seed={index * 17 + i + 1} />}
          {sector.kind === "herb" && (
            <HerbCluster tone={sector.color} seed={index * 17 + i + 1} />
          )}
          {sector.kind === "shop" && <Stall tone={sector.color} />}
        </group>
      ))}

      {/* Totem — tıklanabilir işaret taşı */}
      <group position={[cx * 0.62, 0, cz * 0.62]}>
        <mesh
          position={[0, 1, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(sector);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <cylinderGeometry args={[0.16, 0.22, 2, 6]} />
          <meshStandardMaterial
            color={sector.color}
            emissive={sector.color}
            emissiveIntensity={0.8}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          position={[0, 1.6, 0]}
          color={sector.color}
          intensity={4}
          distance={5}
          decay={2}
        />
        <Float
          speed={reduced ? 0 : 2}
          floatIntensity={reduced ? 0 : 0.8}
          rotationIntensity={reduced ? 0 : 0.6}
        >
          <mesh position={[0, 2.5, 0]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color={sector.color}
              emissive={sector.color}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
        </Float>
        <Html
          center
          position={[0, 3.3, 0]}
          distanceFactor={12}
          style={{ pointerEvents: "none" }}
        >
          <div className="sr-label">
            <span className="sr-label-glyph" style={{ color: sector.color }}>
              {sector.glyph}
            </span>
            <span className="sr-label-name">{sector.label}</span>
          </div>
        </Html>
      </group>
    </group>
  );
}

function Scene({
  reduced,
  onSelect,
}: {
  reduced: boolean;
  onSelect: (s: GaiaSector) => void;
}) {
  return (
    <>
      <Sky sunPosition={[8, 6, -4]} turbidity={6} rayleigh={2} />
      <fog attach="fog" args={["#bfe0d0", 16, 40]} />

      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#cfeaff", "#3a5a32", 0.7]} />
      <directionalLight
        position={[8, 12, -4]}
        intensity={1.8}
        color="#fff3d8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {!reduced && (
        <>
          <Cloud position={[-10, 9, -12]} speed={0.2} opacity={0.4} />
          <Cloud position={[12, 11, -8]} speed={0.15} opacity={0.3} />
        </>
      )}

      {/* Çim zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color="#3f7a3c" roughness={1} />
      </mesh>
      {/* Merkez taş daire — kullanıcının durduğu yer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.4, 2.4, 48]} />
        <meshStandardMaterial color="#caa86a" roughness={0.8} />
      </mesh>

      {GAIA_SECTORS.map((s, i) => (
        <Sector
          key={s.id}
          index={i}
          sector={s}
          reduced={reduced}
          onSelect={onSelect}
        />
      ))}

      <LookControls reduced={reduced} />
    </>
  );
}

export default function GaiaWorldCanvas({
  onSelect,
}: {
  onSelect: (s: GaiaSector) => void;
}) {
  const reduced = prefersReducedMotion();
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, EYE, 0], fov: 72 }}
    >
      <Scene reduced={reduced} onSelect={onSelect} />
    </Canvas>
  );
}

"use client";

/**
 * CaelinusUniverseScene — Caelinus Evreni Ana Meydanı
 *
 * Merkezde YAŞAM MOTORU (Source Engine): 3 orbital halka + kristal çekirdek +
 * altın partiküller. 4 ışık yolu cardinal yönlere açılır (SANRI/GAIA/BAZAAR/ATELİER).
 * Zemin siyah ayna su. Kamera giriş yürüyüşü → kullanıcı keşfi.
 *
 * Stack: @react-three/fiber ^9 + @react-three/drei ^10 + three ^0.183
 */

import { Suspense, useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Stars,
  Sparkles,
  MeshReflectorMaterial,
  Float,
  Text,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import { useRouter } from "next/navigation";

// ─── Bölge (District) tanımları ─────────────────────────────────────────────
const DISTRICTS = [
  {
    id: "sanri",
    label: "SANRI",
    sub: "Ruhun Işığı",
    pos: [0, 0, 26] as [number, number, number],
    color: "#c0d4f0",
    emissive: "#7799ee",
    href: "/universe/sanctum",
  },
  {
    id: "gaia",
    label: "GAIA",
    sub: "Yaşamın Bilgeliği",
    pos: [-26, 0, 0] as [number, number, number],
    color: "#44ee88",
    emissive: "#22aa55",
    href: "/universe/gaia",
  },
  {
    id: "bazaar",
    label: "BAZAAR",
    sub: "İlhamın Pazarı",
    pos: [0, 0, -26] as [number, number, number],
    color: "#ffbb44",
    emissive: "#dd8800",
    href: "/universe/shop",
  },
  {
    id: "atelier",
    label: "ATELİER",
    sub: "Yaratımın Ruhu",
    pos: [26, 0, 0] as [number, number, number],
    color: "#d4b78a",
    emissive: "#aa7744",
    href: "/atelier",
  },
] as const;

// ─── YAŞAM MOTORU (Source Engine) ───────────────────────────────────────────
function YasamMotoru() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const pillar = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (ring1.current) ring1.current.rotation.z += 0.007;
    if (ring2.current) {
      ring2.current.rotation.x += 0.005;
      ring2.current.rotation.y += 0.003;
    }
    if (ring3.current) {
      ring3.current.rotation.y += 0.009;
      ring3.current.rotation.z -= 0.002;
    }
    if (core.current) {
      core.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.07);
      (core.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        4 + Math.sin(t * 1.7) * 1.5;
    }
    if (pillar.current) {
      pillar.current.rotation.y += 0.012;
      (pillar.current.material as THREE.MeshStandardMaterial).opacity =
        0.18 + Math.sin(t * 2.5) * 0.07;
    }
  });

  return (
    <group position={[0, 1.6, 0]}>
      {/* Altın ana halka */}
      <mesh ref={ring1}>
        <torusGeometry args={[2.8, 0.055, 20, 128]} />
        <meshStandardMaterial
          color="#ffcc44"
          emissive="#ff9900"
          emissiveIntensity={2.8}
        />
      </mesh>

      {/* Mor ikinci halka — eğik */}
      <mesh ref={ring2} rotation={[Math.PI / 2.3, 0, Math.PI / 5]}>
        <torusGeometry args={[2.1, 0.04, 18, 100]} />
        <meshStandardMaterial
          color="#9944ff"
          emissive="#7722ee"
          emissiveIntensity={3.2}
        />
      </mesh>

      {/* Gümüş iç halka */}
      <mesh ref={ring3} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[1.4, 0.028, 16, 80]} />
        <meshStandardMaterial
          color="#ccbbff"
          emissive="#aaaaff"
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* Kristal çekirdek */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.72, 3]} />
        <meshStandardMaterial
          color="#6600ff"
          emissive="#5500ee"
          emissiveIntensity={4}
        />
      </mesh>

      {/* Plazma sütunu */}
      <mesh ref={pillar}>
        <cylinderGeometry args={[0.04, 0.55, 22, 8]} />
        <meshStandardMaterial
          color="#9900ff"
          emissive="#7700cc"
          emissiveIntensity={3}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Altın partiküller — yukarı */}
      <Sparkles
        count={200}
        scale={[5, 16, 5]}
        position={[0, 6, 0]}
        size={2.5}
        speed={0.55}
        color="#ffcc44"
        opacity={0.95}
      />

      {/* Mor partiküller — yüzen */}
      <Sparkles
        count={80}
        scale={[7, 6, 7]}
        position={[0, 2, 0]}
        size={1.6}
        speed={0.25}
        color="#aa66ff"
        opacity={0.5}
      />

      {/* Nokta ışıkları */}
      <pointLight color="#7700ff" intensity={20} distance={14} />
      <pointLight color="#ffaa00" intensity={10} distance={10} />
    </group>
  );
}

// ─── Işık Yolları (4 bölgeye doğru) ─────────────────────────────────────────
function IsiklarYollari() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.0 + Math.sin(t * 1.4 + i * 1.57) * 0.5;
      mat.opacity = 0.3 + Math.sin(t * 1.1 + i * 1.2) * 0.1;
    });
  });

  return (
    <group position={[0, 0.06, 0]}>
      {DISTRICTS.map((d, i) => {
        const [tx, , tz] = d.pos;
        const len = Math.sqrt(tx * tx + tz * tz);
        const angle = Math.atan2(tx, tz);
        return (
          <mesh
            key={d.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={[tx / 2, 0, tz / 2]}
            rotation={[-Math.PI / 2, 0, angle]}
          >
            <planeGeometry args={[0.35, len - 4]} />
            <meshStandardMaterial
              color={d.color}
              emissive={d.emissive}
              emissiveIntensity={1.0}
              transparent
              opacity={0.32}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Zemin Kutsal Geometri Halkaları ─────────────────────────────────────────
function ZeminHalkalari() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z += 0.00035 * (i % 2 === 0 ? 1 : -1);
      (m.material as THREE.MeshStandardMaterial).opacity =
        0.35 + Math.sin(t * 0.8 + i * 0.7) * 0.12;
    });
  });

  const radii = [4.5, 8, 12, 17, 22, 28];

  return (
    <group position={[0, 0.04, 0]}>
      {radii.map((r, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[r - 0.055, r + 0.055, 128]} />
          <meshStandardMaterial
            color="#ffaa22"
            emissive="#ff8800"
            emissiveIntensity={2.5}
            transparent
            opacity={0.38}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Bölge Kapısı (District Portal) ─────────────────────────────────────────
function BolgeKapisi({ d }: { d: (typeof DISTRICTS)[number] }) {
  const [hovered, setHovered] = useState(false);
  const sphereRef = useRef<THREE.Mesh>(null);
  const pillarRef = useRef<THREE.Mesh>(null);
  const router = useRouter();

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (sphereRef.current) {
      const mat = sphereRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = hovered
        ? 5 + Math.sin(t * 5) * 1.5
        : 1.5 + Math.sin(t * 1.2) * 0.4;
      mat.opacity = hovered ? 0.55 : 0.18;
    }
    if (pillarRef.current) {
      const mat = pillarRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity =
        (hovered ? 0.45 : 0.16) + Math.sin(t * 1.8 + 1) * 0.06;
    }
  });

  return (
    <group position={d.pos}>
      {/* Glow küre — tıklanabilir */}
      <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.22}>
        <mesh
          ref={sphereRef}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => router.push(d.href)}
        >
          <sphereGeometry args={[3.2, 32, 32]} />
          <meshStandardMaterial
            color={d.color}
            emissive={d.emissive}
            emissiveIntensity={1.5}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      </Float>

      {/* Işık sütunu */}
      <mesh ref={pillarRef} position={[0, 6, 0]}>
        <cylinderGeometry args={[0.06, 1.2, 12, 8]} />
        <meshStandardMaterial
          color={d.color}
          emissive={d.emissive}
          emissiveIntensity={2}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Bölge ismi */}
      <Text
        position={[0, 7.5, 0]}
        fontSize={1.1}
        color={d.color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.18}
        fillOpacity={hovered ? 1 : 0.72}
        outlineWidth={0.045}
        outlineColor="#000022"
      >
        {d.label}
      </Text>

      {/* Alt yazı */}
      <Text
        position={[0, 6.05, 0]}
        fontSize={0.38}
        color={d.color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={hovered ? 0.9 : 0.45}
        outlineWidth={0.02}
        outlineColor="#000022"
      >
        {d.sub}
      </Text>

      {/* Bölge nokta ışığı */}
      <pointLight
        color={d.color}
        intensity={hovered ? 14 : 4}
        distance={20}
      />
    </group>
  );
}

// ─── Kamera Giriş Yürüyüşü ──────────────────────────────────────────────────
function KameraYuruyusu() {
  const { camera } = useThree();
  const progress = useRef(0);
  const done = useRef(false);
  const startPos = useMemo(() => new THREE.Vector3(0, 2.2, -34), []);
  const endPos = useMemo(() => new THREE.Vector3(0, 2.2, -9), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, 1.8, 0), []);

  useEffect(() => {
    camera.position.copy(startPos);
    camera.lookAt(lookTarget);
  }, [camera, startPos, lookTarget]);

  useFrame((_, delta) => {
    if (done.current) return;
    progress.current = Math.min(progress.current + delta * 0.1, 1);
    const t = progress.current;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    camera.position.lerpVectors(startPos, endPos, ease);
    camera.lookAt(lookTarget);
    if (progress.current >= 1) done.current = true;
  });

  return null;
}

// ─── Ana 3D Sahne İçeriği ────────────────────────────────────────────────────
function Sahne() {
  return (
    <>
      {/* Temel ışıklar */}
      <ambientLight intensity={0.04} color="#100018" />
      <directionalLight
        position={[15, 25, 10]}
        intensity={0.3}
        color="#6050a0"
      />

      {/* Yıldız alanı */}
      <Stars
        radius={130}
        depth={70}
        count={7000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.4}
      />

      {/* Ayna Su Zemini */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[140, 140]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={0.6}
          mixStrength={25}
          roughness={0.04}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#000508"
          metalness={0.92}
        />
      </mesh>

      {/* YAŞAM MOTORU — merkez */}
      <YasamMotoru />

      {/* 4 Işık Yolu */}
      <IsiklarYollari />

      {/* Zemin kutsal geometri halkaları */}
      <ZeminHalkalari />

      {/* Bölge kapıları */}
      {DISTRICTS.map((d) => (
        <BolgeKapisi key={d.id} d={d} />
      ))}

      {/* Kamera giriş animasyonu */}
      <KameraYuruyusu />

      {/* Kullanıcı orbit kontrolü (giriş bittikten sonra) */}
      <OrbitControls
        enableZoom
        enablePan={false}
        enableRotate
        zoomSpeed={0.5}
        rotateSpeed={0.45}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 9}
        minDistance={6}
        maxDistance={55}
        target={[0, 1.8, 0]}
      />
    </>
  );
}

// ─── Loading ekranı ──────────────────────────────────────────────────────────
function Yukleniyor() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000006",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          border: "1.5px solid #ffcc44",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1.2s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          fontSize: "10px",
          letterSpacing: "4px",
          color: "#9988bb",
          opacity: 0.6,
        }}
      >
        CAELINUS EVRENİ AÇILIYOR
      </div>
    </div>
  );
}

// ─── ROOT BILEŞEN ────────────────────────────────────────────────────────────
export default function CaelinusUniverseScene() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000006",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ fov: 58, near: 0.1, far: 600, position: [0, 2.2, -34] }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.85,
        }}
      >
        <Suspense fallback={null}>
          <Sahne />
        </Suspense>
      </Canvas>

      {/* HUD — üst şerit */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "28px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "4px",
              color: "#ffcc44",
              marginBottom: "5px",
              opacity: 0.8,
            }}
          >
            ✦ CAELINUS UNIVERSE ✦
          </div>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "2px",
              color: "#8899bb",
              opacity: 0.5,
            }}
          >
            YAKLAŞ · KEŞFET · GEÇ
          </div>
        </div>

        <a
          href="/"
          style={{
            fontSize: "10px",
            letterSpacing: "2px",
            color: "#8899bb",
            opacity: 0.45,
            textDecoration: "none",
            pointerEvents: "auto",
            cursor: "pointer",
          }}
        >
          ← GERİ
        </a>
      </div>

      {/* HUD — alt köşe ipucu */}
      <div
        style={{
          position: "absolute",
          bottom: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            letterSpacing: "3px",
            color: "#8899bb",
            opacity: 0.4,
          }}
        >
          SÜRÜKLE · DÖNDÜR · ZUM
        </div>
      </div>
    </div>
  );
}

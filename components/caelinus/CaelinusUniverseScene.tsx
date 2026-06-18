"use client";

/**
 * CaelinusUniverseScene — Caelinus Evreni Ana Meydanı (procedural iskelet).
 *
 * KARAR (v2): Three.js = motor (etkileşim, kamera, ışık, hover, geçiş).
 * Görsel kalite Blender/Spline/GLB'den gelecek. Procedural primitive mimari YOK;
 * GLB hazır olana dek "soft glowing portal" placeholder'lar kullanılır.
 * Yazılar sahne içinde değil, HTML overlay (drei <Html>).
 *
 * Katmanlar:
 *   • Siyah yansıtıcı su zemini (WaterPlane)
 *   • Merkez: soyut enerji çekirdeği — küre + partikül spirali + halkalar (SourceCore)
 *     + zemin kutsal halkaları (PortalGate)
 *   • Altın toz partikülleri (ParticleField) + yıldız alanı (Stars)
 *   • 4 bölge kapısı: SANRI / GAIA / BAZAAR / ATELIER (DistrictGate — portal placeholder)
 *   • Sinematik son işleme: Bloom + Vignette
 *
 * Gezinti:
 *   • Masaüstü → WASD ile yürü + mouse ile bak (CameraRig).
 *   • Mobil    → OrbitControls (orbit/parallax fallback).
 *
 * Sonraki katmanlar: Blender/Spline GLB kapı modelleri (District.model), Medusa,
 * Yerebatan, Tanrıça hologramları.
 */

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import WaterPlane from "./WaterPlane";
import ParticleField from "./ParticleField";
import SourceCore from "./SourceCore";
import PortalGate from "./PortalGate";
import DistrictGate, { type District } from "./DistrictGate";
import CameraRig from "./CameraRig";

const DISTRICTS: District[] = [
  {
    name: "SANRI",
    subtitle: "Temple of Consciousness",
    position: [0, 0, -13],
    color: "#d8b7ff",
    stone: "#2b2540",
    route: "/universe/sanri",
  },
  {
    name: "GAIA",
    subtitle: "Garden of Earth",
    position: [-13, 0, 0],
    color: "#7cffb2",
    stone: "#26342c",
    route: "/universe/gaia",
  },
  {
    name: "BAZAAR",
    subtitle: "Treasures of Expression",
    position: [0, 0, 13],
    color: "#ffd98f",
    stone: "#3a2f1c",
    route: "/universe/bazaar",
  },
  {
    name: "ATELIER",
    subtitle: "Create Your Frequency",
    position: [13, 0, 0],
    color: "#9fc7ff",
    stone: "#222d3e",
    route: "/universe/atelier",
  },
];

/** Arkada yükselen mor ay — meydana "kadim gökyüzü" hissi katar. */
function Moon() {
  return (
    <group position={[0, 13, -26]}>
      <mesh>
        <sphereGeometry args={[3.2, 48, 48]} />
        <meshStandardMaterial color="#d9c7ff" emissive="#b48bff" emissiveIntensity={1.6} roughness={1} />
      </mesh>
      {/* yumuşak hare */}
      <mesh>
        <sphereGeometry args={[4.6, 32, 32]} />
        <meshBasicMaterial color="#8f6cff" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function CaelinusWorld({ mobile }: { mobile: boolean }) {
  return (
    <>
      <color attach="background" args={["#02030a"]} />
      <fog attach="fog" args={["#03040c", 10, 46]} />

      {/* Karanlık mistik gece — mimari kendi ışığıyla parlasın, su siyah ayna kalsın */}
      <ambientLight intensity={0.12} color="#6f79bf" />
      <directionalLight position={[2, 12, -10]} intensity={0.4} color="#aeb8ff" />
      <pointLight
        position={[0, 6, -6]}
        intensity={4}
        color="#8f6cff"
        distance={28}
      />

      <Stars
        radius={80}
        depth={40}
        count={1600}
        factor={3}
        saturation={0}
        fade
        speed={0.4}
      />

      <Moon />

      <Suspense fallback={null}>
        <WaterPlane />
        <PortalGate />
        <ParticleField count={mobile ? 500 : 900} />
        <SourceCore />

        {DISTRICTS.map((d) => (
          <DistrictGate key={d.name} {...d} />
        ))}
      </Suspense>

      {mobile ? (
        <OrbitControls
          enableZoom
          enablePan={false}
          target={[0, 1.7, 0]}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 3.2}
          minDistance={6}
          maxDistance={26}
          rotateSpeed={0.5}
          zoomSpeed={0.5}
        />
      ) : (
        <CameraRig enabled start={[0, 2.4, 9]} />
      )}
    </>
  );
}

export default function CaelinusUniverseScene() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 768px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#03060f]">
      <Canvas
        camera={{ position: [0, 2.4, 9], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <CaelinusWorld mobile={mobile} />

        {/* Sinematik son işleme — glow'lar premium hisse bürünsün */}
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            mipmapBlur
            intensity={mobile ? 0.55 : 0.8}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.25}
          />
          <Vignette offset={0.3} darkness={0.82} eskil={false} />
        </EffectComposer>
      </Canvas>

      {/* Vinyet — kenarları karart, merkeze odakla */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      {/* Üst HUD */}
      <div className="pointer-events-none absolute left-1/2 top-7 -translate-x-1/2 text-center">
        <div className="text-[10px] uppercase tracking-[0.42em] text-[#ead8a0]/80">
          ✦ Caelinus Universe ✦
        </div>
      </div>

      {/* Alt ipucu — cihaza göre */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.28em] text-[#ead8a0]/70">
        {mobile ? "Drag to look · Pinch to zoom" : "WASD to walk · Move mouse to look"}
      </div>
    </div>
  );
}

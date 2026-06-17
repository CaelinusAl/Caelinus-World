"use client";

/**
 * /vr — "Gelecekte açılacak kapı."
 *
 * VR bir ÜRÜN değil; Caelinus'un yaşayan evren vizyonunun bir sonraki eşiği.
 * Bu sayfa altyapıyı (WebXR + @react-three/xr) kurar ama deneyimi zorlamaz:
 *   • Her tarayıcıda 3B portal önizlemesi döner (web'de mükemmelleştirdiğimiz dil).
 *   • Yalnızca WebXR destekleyen cihazlarda (Quest tarayıcısı vb.) "Enter VR" çıkar.
 *
 * Navigasyona bağlı DEĞİL — bilinçli olarak sessiz bir kapı. Hazır olunca açılır.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import * as THREE from "three";

const store = createXRStore();

function PortalRing() {
  const ring = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);

  useFrame((_s, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.12;
    if (core.current) {
      const s = 1 + Math.sin(performance.now() * 0.0006) * 0.04;
      core.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* Eşik halkası — yavaş dönen altın portal. */}
      <mesh ref={ring} position={[0, 1.5, -3]}>
        <torusGeometry args={[1.1, 0.035, 24, 120]} />
        <meshStandardMaterial
          color="#c9a45c"
          emissive="#e8d7a3"
          emissiveIntensity={1.4}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Portal çekirdeği — nefes alan ay-ışığı diski. */}
      <Float speed={1.1} rotationIntensity={0} floatIntensity={0.4}>
        <mesh ref={core} position={[0, 1.5, -3.05]}>
          <circleGeometry args={[1.05, 64]} />
          <meshBasicMaterial
            color="#a06eff"
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </Float>
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#03060f"]} />
      <fog attach="fog" args={["#03060f", 4, 14]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 4, 2]} intensity={18} color="#e8d7a3" />
      <pointLight position={[-3, 1, -2]} intensity={10} color="#a06eff" />
      <Suspense fallback={null}>
        <Stars radius={40} depth={30} count={2200} factor={3} saturation={0} fade speed={0.6} />
        <PortalRing />
      </Suspense>
    </>
  );
}

export default function VrGatePage() {
  const [vrSupported, setVrSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported?: (m: string) => Promise<boolean> } }).xr;
    if (!xr?.isSessionSupported) {
      setVrSupported(false);
      return;
    }
    xr.isSessionSupported("immersive-vr")
      .then((ok) => setVrSupported(ok))
      .catch(() => setVrSupported(false));
  }, []);

  return (
    <main className="vr-gate">
      <Canvas
        className="vr-gate-canvas"
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 1.5, 1.5], fov: 60 }}
      >
        <XR store={store}>
          <Scene />
        </XR>
      </Canvas>

      <div className="vr-gate-overlay">
        <p className="vr-gate-kicker">CAELINUS</p>
        <h1 className="vr-gate-title">The gate that will open</h1>
        <p className="vr-gate-sub">
          Bir gün bu eşikten gerçekten geçeceksin. Şimdilik web&apos;de nefes alıyor.
        </p>

        <div className="vr-gate-actions">
          {vrSupported ? (
            <button
              type="button"
              className="vr-gate-enter"
              onClick={() => store.enterVR()}
            >
              Enter VR
            </button>
          ) : (
            <span className="vr-gate-note">
              {vrSupported === null
                ? "VR desteği denetleniyor…"
                : "Bu cihaz WebXR desteklemiyor — web önizlemesi aktif."}
            </span>
          )}
          <Link href="/" className="vr-gate-back">
            ← Evrene dön
          </Link>
        </div>
      </div>
    </main>
  );
}

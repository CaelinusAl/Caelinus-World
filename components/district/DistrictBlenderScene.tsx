"use client";

/**
 * DistrictBlenderScene — District Engine · yaşayan 3B district motoru.
 *
 * Bu bir "GLB viewer" DEĞİLDİR. Uzun vadede tek bir district sahnesinin tüm
 * katmanlarını yöneten motordur:
 *   • GLB ortam modeli            (FAZ 1 ✓)
 *   • Tek kamera + orbit kontrolü  (FAZ 1 ✓)
 *   • District metadata (ışık/aksan/atmosfer temeli)  (FAZ 1 ✓)
 *   • Kamera yolları (flythrough)  (gelecek)
 *   • Portal bölgeleri             (gelecek)
 *   • NPC / hologram noktaları     (gelecek)
 *   • Enerji nehirleri             (gelecek)
 *   • Atmosfer presetleri (HDRI)   (gelecek)
 *   • Ses katmanları               (gelecek)
 *
 * Mimari: her katman `district.blender` sözleşmesinden okunur ve yalnızca
 * tanımlıysa render edilir. Yeni katman eklemek = registry'ye veri + buraya
 * bir <Layer/> bileşeni; sözleşme kırılmaz. Faz 1'de aşağıdaki "GELECEK
 * KATMANLAR" bloğu bilinçli olarak boştur.
 *
 * r3f kullanır → sayfa tarafından `dynamic(..., { ssr: false })` ile import
 * edilmelidir.
 */

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { District, DistrictCamera } from "@/lib/district/types";

/** Kamera tanımı yoksa kullanılan güvenli varsayılan. */
const DEFAULT_CAMERA: Required<DistrictCamera> = {
  position: [0, 1.6, 7],
  target: [0, 1.2, 0],
  fov: 45,
};

/** GLB ortam modeli — Suspense altında yüklenir. */
function DistrictModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

type Props = {
  district: District;
  className?: string;
  /**
   * interactive → orbit + zoom (kullanıcı sahneyi gezinir, read-only).
   * ambient     → kontrolsüz, yavaş otomatik dönüş (arka plan dekoru).
   */
  mode?: "interactive" | "ambient";
};

export default function DistrictBlenderScene({ district, className, mode = "interactive" }: Props) {
  const { glb, camera, atmosphere } = district.blender;

  // GLB yoksa motor sessizce devre dışı kalır → DistrictShell'in CSS hero/glow
  // katmanı (veya preview posteri) görünür kalır. Diğer GLB'siz district'ler güvende.
  if (!glb) return null;

  const cam = camera ?? DEFAULT_CAMERA;
  const target = cam.target ?? DEFAULT_CAMERA.target;
  const interactive = mode === "interactive";

  return (
    <div className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: cam.position, fov: cam.fov ?? DEFAULT_CAMERA.fov }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        {/* ── District metadata → atmosfer temeli (Faz 1) ── */}
        {atmosphere?.background && <color attach="background" args={[atmosphere.background]} />}
        {atmosphere?.fog && (
          <fog attach="fog" args={[atmosphere.fog.color, atmosphere.fog.near, atmosphere.fog.far]} />
        )}

        {/* Basit, ağ bağımsız aydınlatma (HDRI gerektirmez → çevrimdışı güvenli) */}
        <ambientLight intensity={0.55} color="#eef0ff" />
        <directionalLight position={[5, 9, 6]} intensity={1.15} color="#fff6e6" />
        <pointLight position={[0, 3, 3]} intensity={2.2} color={district.hero.accent} distance={24} />

        <Suspense fallback={null}>
          <DistrictModel url={glb} />
        </Suspense>

        {/* ── Tek kamera + orbit (Faz 1) ── */}
        <OrbitControls
          makeDefault
          enabled={interactive}
          enableZoom={interactive}
          enablePan={false}
          target={target}
          autoRotate={!interactive}
          autoRotateSpeed={0.4}
          minDistance={2}
          maxDistance={40}
        />

        {/* ──────────────────────────────────────────────────────────────
            GELECEK KATMANLAR — Faz 1'de bilinçli olarak render EDİLMEZ.
            Sözleşme `district.blender` üzerinden hazır; veri tanımlandığında
            ilgili <Layer/> burada mount edilecek:

              {blender.cameraPaths   && <CameraPathRig paths={blender.cameraPaths} />}
              {blender.portalZones   && <PortalZones zones={blender.portalZones} />}
              {blender.npcs          && <NpcMarkers points={blender.npcs} />}
              {blender.energyRivers  && <EnergyRivers rivers={blender.energyRivers} />}
              {blender.atmosphere?.env && <Environment preset={...} />}
              {blender.audioLayers   && <SceneAudio layers={blender.audioLayers} />}
            ────────────────────────────────────────────────────────────── */}
      </Canvas>
    </div>
  );
}

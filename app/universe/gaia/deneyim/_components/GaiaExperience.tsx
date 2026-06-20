"use client";

/**
 * GaiaExperience — Gaia'nın Kalbi (V2: matte-hero canlı katman)
 *
 * Matte-painting (AI 4K) bir CSS background olarak gösterilir (page/deneyim.css).
 * Bu Canvas ŞEFFAFtır — yalnız CANLI katmanı render eder: sürüklenen
 * ateşböcekleri, ışık kelebekleri, altın polen. "Site değil, bir yer" hissi
 * matte'nin sinematik kalitesi + bu canlı parçacıklar + CSS nabız + parallax ile gelir.
 *
 * NOT: arka plan rengi YOK (şeffaf) → arkadaki matte görünür. Post-FX yok
 * (alpha'yı bozmasın). Düşük-poli 3B yok (matte hero).
 */

import { Canvas } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";

function LiveLayer() {
  return (
    <>
      <ambientLight intensity={0.9} />
      {/* altın ateşböcekleri — yakın, parlak */}
      <Sparkles count={70} scale={[16, 9, 4]} position={[0, 0.5, 1]} size={3} speed={0.25} color="#ffd98a" opacity={0.9} />
      {/* turkuaz ışık kelebekleri / spor — orta katman */}
      <Sparkles count={46} scale={[18, 10, 5]} position={[2, -0.5, 2]} size={5} speed={0.45} color="#8fe6d8" opacity={0.85} />
      {/* ince altın polen — geniş, yavaş, derin */}
      <Sparkles count={130} scale={[22, 12, 3]} position={[0, 0, -1]} size={1.8} speed={0.1} color="#ffe6c0" opacity={0.65} />
      {/* havada asılı su zerreleri — yavaş, soğuk */}
      <Sparkles count={60} scale={[20, 11, 4]} position={[-2, 0.5, 0.5]} size={2.4} speed={0.06} color="#bfeede" opacity={0.55} />
    </>
  );
}

export default function GaiaExperience() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 12], fov: 50 }}
    >
      <LiveLayer />
    </Canvas>
  );
}

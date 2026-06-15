"use client";

/**
 * WorldCanvas — global, kalıcı WebGL canvas.
 *
 * Sabit tam-ekran, içeriğin ARKASINDA (z-index katmanı .world-canvas
 * CSS'inde), pointer-events YOK → sayfa etkileşimini engellemez ama
 * işaretçi parallax'ı için pointer'ı yine de okur (R3F global pointer).
 *
 * Cihaz uyumu:
 *   • prefers-reduced-motion → sahne sürüklenmeleri durur.
 *   • PerformanceMonitor → FPS düşerse DPR ve kalite kademesi otomatik iner.
 *   • alpha:true → arka plan saydam; koyu gradient CSS'ten gelir.
 *
 * SSR: WorldBackdrop bunu `dynamic(..., { ssr:false })` ile yükler —
 * WebGL yalnızca tarayıcıda kurulur, sayfa metni SSR'da kalır (SEO).
 */

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import WorldScenes from "./WorldScenes";
import { useWorldStore, type WorldQuality } from "@/lib/world/store";
import type { WorldSceneId } from "@/lib/world/config";

export default function WorldCanvas({ scene }: { scene: WorldSceneId }) {
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const setReducedMotion = useWorldStore((s) => s.setReducedMotion);
  const quality = useWorldStore((s) => s.quality);
  const setQuality = useWorldStore((s) => s.setQuality);
  const sceneOverride = useWorldStore((s) => s.sceneOverride);

  const [dpr, setDpr] = useState(1.4);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setReducedMotion]);

  // Sayfa bir sahne override ettiyse onu, yoksa route eşlemesini kullan.
  const active = sceneOverride ?? scene;

  return (
    <div className="world-canvas" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 55 }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr((d) => Math.max(0.7, +(d - 0.2).toFixed(2)));
            setQuality(stepDownQuality(quality));
          }}
        />
        <WorldScenes
          scene={active}
          reducedMotion={reducedMotion}
          quality={quality}
        />
      </Canvas>
    </div>
  );
}

function stepDownQuality(q: WorldQuality): WorldQuality {
  return q === "high" ? "medium" : "low";
}

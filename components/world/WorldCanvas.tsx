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
 *   • WebGL yok / kapalı → Canvas hiç kurulmaz, CSS gradient fallback gösterilir.
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
  const resonance = useWorldStore((s) => s.resonance);

  const [dpr, setDpr] = useState(1.4);

  // WebGL desteğini bir kez, senkron ölçeriz (bileşen ssr:false → window var).
  // Başarısızsa Canvas hiç denenmez; siyah ekran yerine CSS gradient kalır.
  const [webglOk] = useState(detectWebGL);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setReducedMotion]);

  // Sayfa bir sahne override ettiyse onu, yoksa route eşlemesini kullan.
  const active = sceneOverride ?? scene;

  // WebGL yoksa: aynı katman kutusu, sadece CSS gradient (WorldBackdrop'tan).
  if (!webglOk) {
    return <div className="world-canvas world-canvas--fallback" aria-hidden="true" />;
  }

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
          resonance={resonance}
        />
      </Canvas>
    </div>
  );
}

function stepDownQuality(q: WorldQuality): WorldQuality {
  return q === "high" ? "medium" : "low";
}

/**
 * Tarayıcının WebGL bağlamı oluşturabildiğini bir kez dener.
 * Geçici bir <canvas> üzerinde webgl2 → webgl → experimental-webgl sırasıyla
 * dener; hiçbiri yoksa (eski cihaz, WebGL devre dışı, GPU yok) false döner.
 */
function detectWebGL(): boolean {
  if (typeof window === "undefined") return true; // ssr: optimist, mount'ta yeniden değerlenir
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

"use client";

/**
 * CosmosScene — Caelinus dünyasının ilk ambient sahnesi (placeholder).
 *
 * Yıldız alanı + altın "frekans tozu" (Sparkles) + işaretçi parallax'ı ile
 * "içine giriliyormuş / canlı" hissi. Şeyma'nın sahnesi geldiğinde bu
 * dosya onun grafiğiyle değiştirilecek; arayüz (props) sabit kalır.
 *
 * Performans: arka plan saydam (alpha) — koyu gradient .world-canvas
 * CSS'inden gelir; sahne yalnızca emissive yıldız/sparkle çizer, ışık
 * hesabı yok. reducedMotion → tüm sürüklenmeler durur.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars, Sparkles } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  reducedMotion: boolean;
  /** Kalite kademesi — yıldız/sparkle sayısını ölçekler. */
  quality?: "high" | "medium" | "low";
};

export default function CosmosScene({ reducedMotion, quality = "high" }: Props) {
  const group = useRef<THREE.Group>(null);

  const starCount = quality === "low" ? 1200 : quality === "medium" ? 2200 : 3500;
  const sparkleCount = quality === "low" ? 24 : quality === "medium" ? 48 : 80;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    // Yavaş kozmik sürüklenme — reducedMotion'da durur.
    if (!reducedMotion) {
      g.rotation.y += delta * 0.012;
    }

    // İşaretçi parallax'ı — kullanıcı fareyi/parmağını gezdirdikçe evren
    // hafifçe ona doğru kayar; "derinlik içindeyim" hissi verir.
    const { pointer } = state;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.y * 0.06, 0.04);
    g.position.x = THREE.MathUtils.lerp(g.position.x, pointer.x * 0.5, 0.04);
  });

  return (
    <group ref={group}>
      <Stars
        radius={90}
        depth={60}
        count={starCount}
        factor={4}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.5}
      />
      <Sparkles
        count={sparkleCount}
        scale={[14, 8, 10]}
        size={3}
        speed={reducedMotion ? 0 : 0.4}
        opacity={0.7}
        color="#e6c896"
      />
    </group>
  );
}

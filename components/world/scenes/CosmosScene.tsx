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
import { DEFAULT_RESONANCE, type Resonance } from "@/lib/world/resonance";

type Props = {
  reducedMotion: boolean;
  /** Kalite kademesi — yıldız/sparkle sayısını ölçekler. */
  quality?: "high" | "medium" | "low";
  /** Kullanıcının frekansından türeyen sahne parametreleri (5D). */
  resonance?: Resonance;
};

export default function CosmosScene({
  reducedMotion,
  quality = "high",
  resonance = DEFAULT_RESONANCE,
}: Props) {
  const group = useRef<THREE.Group>(null);

  const starCount = quality === "low" ? 1200 : quality === "medium" ? 2200 : 3500;
  const sparkleCount = quality === "low" ? 24 : quality === "medium" ? 48 : 80;

  // Frekans nabzı: ateş daha canlı, su daha dingin sürüklenir.
  const drift = 0.012 * resonance.intensity;
  const starSpeed = reducedMotion ? 0 : 0.5 * resonance.intensity;
  // Uyanmış (profilli) evren yıldızlara da hafif renk verir.
  const starSaturation = resonance.attuned ? 0.18 : 0;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    // Yavaş kozmik sürüklenme — reducedMotion'da durur.
    if (!reducedMotion) {
      g.rotation.y += delta * drift;
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
        saturation={starSaturation}
        fade
        speed={starSpeed}
      />
      {/* Ana frekans tozu — kullanıcının element rengi. */}
      <Sparkles
        count={sparkleCount}
        scale={[14, 8, 10]}
        size={3}
        speed={reducedMotion ? 0 : 0.4 * resonance.intensity}
        opacity={0.7}
        color={resonance.primary}
      />
      {/* İkincil niyet katmanı — yalnızca uyanmış evrende, daha geniş & sönük. */}
      {resonance.attuned ? (
        <Sparkles
          count={Math.round(sparkleCount * 0.5)}
          scale={[20, 12, 14]}
          size={5}
          speed={reducedMotion ? 0 : 0.25 * resonance.intensity}
          opacity={0.4}
          color={resonance.secondary}
        />
      ) : null}
    </group>
  );
}

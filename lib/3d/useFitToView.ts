"use client";

/**
 * useFitToView — Three.js scene'in görünür mesh'lerini hedef boyuta
 * normalize eder. Bounds bileşeninden farklı olarak armature, helper
 * ve gizli node'ları yok sayar, böylece manken üst gövdesi armature
 * uzantısı yüzünden kart dışına taşmaz.
 *
 * Kullanım: GLTF/FBX scene'i klonladıktan sonra bu hook'a verirsin;
 * scene'i in-place ölçekler ve y-up ile pivot=0,0,0 olacak şekilde
 * konumlandırır. AvatarCanvas ve ModelPreview ortak kullanır.
 */

import { useEffect } from "react";
import { Box3, Vector3, type Object3D } from "three";

type FitOptions = {
  /** Hedef bounding küre çapı (Three.js dünya birimi). 2.2 ≈ kart yüksekliğine güzel oturur. */
  targetSize?: number;
  /** Mesh'i sahnenin tabanına doğru kaydır (yüz biraz üstte kalsın diye). */
  yOffset?: number;
};

export function useFitToView(scene: Object3D | null | undefined, options: FitOptions = {}) {
  const { targetSize = 2.2, yOffset = -0.05 } = options;

  useEffect(() => {
    if (!scene) return;

    // Sadece görünür mesh'lerin bbox'ı — armature/empty/helper node'lar hariç.
    const box = new Box3();
    let hasMesh = false;
    scene.traverse((o) => {
      const obj = o as { isMesh?: boolean; visible?: boolean };
      if (obj.isMesh && obj.visible !== false) {
        const meshBox = new Box3().setFromObject(o);
        if (!meshBox.isEmpty()) {
          box.union(meshBox);
          hasMesh = true;
        }
      }
    });
    if (!hasMesh || box.isEmpty()) return;

    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim <= 0) return;

    const scale = targetSize / maxDim;
    scene.scale.setScalar(scale);

    // Bbox merkezini origin'e çek, sonra hafif y ofseti ile yüzü kameraya yakınlaştır.
    const scaledCenter = center.clone().multiplyScalar(scale);
    scene.position.set(-scaledCenter.x, -scaledCenter.y + yOffset, -scaledCenter.z);
  }, [scene, targetSize, yOffset]);
}

"use client";

/**
 * WaterPlane — siyah yansıtıcı su zemini (Caelinus meydanının tabanı).
 *
 * drei MeshReflectorMaterial ile gerçek yansıma: Source Tree, kapılar ve
 * yıldızlar suya vurur. Procedural iskelet; Blender GLB zemin sonra bunun
 * yerine geçebilir.
 */

import { MeshReflectorMaterial } from "@react-three/drei";

export default function WaterPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
      <planeGeometry args={[120, 120]} />
      <MeshReflectorMaterial
        blur={[180, 45]}
        resolution={512}
        mixBlur={0.9}
        mixStrength={12}
        roughness={0.28}
        depthScale={1}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        color="#03060f"
        metalness={0.8}
      />
    </mesh>
  );
}

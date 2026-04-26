"use client";

import { useEffect, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  textureUrl: string | null;
};

/**
 * Minimum vertex count to qualify as "avatar body mesh".
 * Filters out simple decoration meshes (aura capsule ~600 verts, etc.).
 */
const MIN_VERTS = 800;

/**
 * Lazily loaded DecalGeometry — avoids Turbopack SSR issues
 * with three/examples/jsm imports.
 */
let DecalGeometryCtor: typeof import("three/examples/jsm/geometries/DecalGeometry.js").DecalGeometry | null = null;

async function getDecalGeometry() {
  if (DecalGeometryCtor) return DecalGeometryCtor;
  try {
    const mod = await import("three/examples/jsm/geometries/DecalGeometry.js");
    DecalGeometryCtor = mod.DecalGeometry;
    return DecalGeometryCtor;
  } catch {
    return null;
  }
}

function AvatarFaceTextureInner({ textureUrl }: Props) {
  const anchorRef = useRef<THREE.Group>(null!);
  const decalRef = useRef<THREE.Mesh | null>(null);
  const avatarReady = useRef(false);
  const targetMesh = useRef<THREE.Mesh | null>(null);
  const headWorld = useRef(new THREE.Vector3());
  const modelH = useRef(0);
  const activeUrl = useRef<string | null>(null);

  function cleanup() {
    const d = decalRef.current;
    if (!d) return;
    try {
      d.geometry?.dispose();
      if (d.material instanceof THREE.Material) d.material.dispose();
      d.removeFromParent();
    } catch { /* disposal failure is non-critical */ }
    decalRef.current = null;
  }

  /** Scan siblings once per frame until the avatar mesh is found. */
  useFrame(() => {
    if (avatarReady.current) return;
    const parent = anchorRef.current?.parent;
    if (!parent) return;

    let best: THREE.Mesh | null = null;
    let bestVerts = 0;
    const box = new THREE.Box3();
    box.makeEmpty();

    parent.traverse((child) => {
      if (child === anchorRef.current) return;
      if (!(child instanceof THREE.Mesh)) return;
      const count = child.geometry?.attributes?.position?.count ?? 0;
      if (count < MIN_VERTS) return;

      try {
        const cb = new THREE.Box3().setFromObject(child);
        if (cb.isEmpty()) return;
        box.union(cb);
        if (count > bestVerts) {
          bestVerts = count;
          best = child;
        }
      } catch { /* skip problematic meshes */ }
    });

    if (!best || box.isEmpty()) return;

    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y < 0.4) return;

    targetMesh.current = best;
    modelH.current = size.y;

    let headFrontZ = (box.min.z + box.max.z) / 2;
    parent.traverse((child) => {
      if (child === anchorRef.current) return;
      if (!(child instanceof THREE.Mesh)) return;
      if ((child.geometry?.attributes?.position?.count ?? 0) < MIN_VERTS) return;
      try {
        const cb = new THREE.Box3().setFromObject(child);
        if (!cb.isEmpty() && cb.max.y > box.min.y + size.y * 0.82) {
          headFrontZ = Math.max(headFrontZ, cb.max.z);
        }
      } catch { /* skip */ }
    });

    headWorld.current.set(
      (box.min.x + box.max.x) / 2,
      box.min.y + size.y * 0.915,
      headFrontZ
    );

    avatarReady.current = true;

    if (activeUrl.current) buildDecal(activeUrl.current);
  });

  async function buildDecal(url: string) {
    cleanup();
    const mesh = targetMesh.current;
    const parent = anchorRef.current?.parent;
    if (!mesh || !parent) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      if (activeUrl.current !== url) return;

      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;

      const h = modelH.current;
      const decalSize = new THREE.Vector3(h * 0.155, h * 0.19, h * 0.28);
      const orientation = new THREE.Euler(0, 0, 0);

      try {
        const DecalGeo = await getDecalGeometry();
        if (!DecalGeo) throw new Error("DecalGeometry unavailable");

        const geo = new DecalGeo(
          mesh,
          headWorld.current,
          orientation,
          decalSize
        );

        if (geo.attributes.position.count < 3) throw new Error("empty decal");

        const mat = new THREE.MeshPhysicalMaterial({
          map: tex,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          depthTest: true,
          polygonOffset: true,
          polygonOffsetFactor: -6,
          polygonOffsetUnits: -6,
          roughness: 0.55,
          metalness: 0.0,
          side: THREE.FrontSide,
          toneMapped: false,
        });

        const dm = new THREE.Mesh(geo, mat);
        dm.renderOrder = 10;
        dm.frustumCulled = false;
        parent.add(dm);
        decalRef.current = dm;
      } catch {
        buildPlane(tex, parent);
      }
    };
    img.onerror = () => {
      console.warn("[AvatarFaceTexture] Failed to load:", url.slice(0, 60));
    };
    img.src = url;
  }

  /** Fallback: simple plane in front of head. */
  function buildPlane(tex: THREE.Texture, parent: THREE.Object3D) {
    const h = modelH.current;
    const fw = h * 0.14;
    const fh = h * 0.17;
    const pos = headWorld.current.clone();
    pos.z += 0.04;

    const geo = new THREE.PlaneGeometry(fw, fh);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.90,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    const p = new THREE.Mesh(geo, mat);
    p.position.copy(pos);
    p.renderOrder = 999;
    p.frustumCulled = false;
    parent.add(p);
    decalRef.current = p;
  }

  useEffect(() => {
    activeUrl.current = textureUrl;
    if (!textureUrl) {
      cleanup();
      return;
    }
    if (avatarReady.current) buildDecal(textureUrl);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureUrl]);

  return <group ref={anchorRef} />;
}

export const AvatarFaceTexture = memo(AvatarFaceTextureInner);

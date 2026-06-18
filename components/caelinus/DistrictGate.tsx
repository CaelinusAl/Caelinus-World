"use client";

/**
 * DistrictGate — Caelinus'un 4 bölge kapısı.
 *
 * KARAR (v2): Artık primitive box/silindir mimari YOK. Three.js yalnızca
 * etkileşim, ışık, hover ve geçiş için. Görsel kalite Blender/Spline GLB'den
 * gelecek. Henüz GLB hazır olmadığı için her kapı geçici olarak şu katmanlardan
 * oluşan "soft glowing portal" placeholder'dır:
 *
 *   • Mermer/taş kemer çerçevesi (ExtrudeGeometry — beveled arch, kendi ışığıyla)
 *   • İçte yumuşak parlayan portal düzlemi (radyal glow, nabız gibi nefes alır)
 *   • Dikey ışık çizgileri (enerji eşiği)
 *   • Alttan yükselen sis (atmosfer)
 *   • Önde renkli ışık (suya yansır) + hover'da güçlenen glow
 *
 * `model` verilirse (ileride GLB yolu) placeholder yerine o asset yüklenir.
 * Yazı sahnenin içinde değil; drei <Html> ile HTML overlay olarak gelir.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";

import { radialTexture, fadeBarTexture, mistTexture } from "./glow";

export type District = {
  name: string;
  subtitle: string;
  position: [number, number, number];
  color: string; // glow / accent rengi
  stone: string; // mermer/taş tonu
  route: string;
  model?: string; // ileride Blender/Spline GLB yolu (varsa placeholder yerine yüklenir)
};

/** Yarım daire tepeli kemer silüeti (doorway). */
function archShape(halfW: number, legH: number) {
  const s = new THREE.Shape();
  s.moveTo(-halfW, 0);
  s.lineTo(-halfW, legH);
  s.absarc(0, legH, halfW, Math.PI, 0, true);
  s.lineTo(halfW, 0);
  s.lineTo(-halfW, 0);
  return s;
}

const OUT_W = 1.5;
const OUT_H = 2.2;
const IN_W = 1.02;
const IN_H = 1.92;

/** İleride GLB modeli yüklemek için — yalnız model verildiğinde render edilir. */
function GateModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} />;
}

export default function DistrictGate({
  name,
  subtitle,
  position,
  color,
  stone,
  route,
  model,
}: District) {
  const router = useRouter();

  const ref = useRef<THREE.Group>(null);
  const portalMat = useRef<THREE.MeshBasicMaterial>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const linesRef = useRef<THREE.Group>(null);
  const mistRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Kapı merkeze baksın
  const rotationY = useMemo(
    () => Math.atan2(-position[0], -position[2]),
    [position],
  );

  // Mermer kemer çerçevesi — dış kemer eksi iç kemer (delik) = doorway frame
  const frameGeo = useMemo(() => {
    const outer = archShape(OUT_W, OUT_H);
    outer.holes.push(archShape(IN_W, IN_H));
    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.42,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 64,
    });
    geo.translate(0, 0, -0.21);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Dokular (client-only; sahne ssr:false)
  const portalTex = useMemo(
    () =>
      radialTexture([
        [0.0, "rgba(255,247,224,0.95)"],
        [0.22, hexToRgba(color, 0.85)],
        [0.6, hexToRgba(color, 0.28)],
        [1.0, "rgba(8,6,20,0)"],
      ]),
    [color],
  );
  const lineTex = useMemo(() => fadeBarTexture(hexToRgba(color, 1)), [color]);
  const mistTex = useMemo(() => mistTexture(hexToRgba(color, 0.5)), [color]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // hafif nefes + hover ölçek
    const target = hovered ? 1.05 : 1 + Math.sin(t * 0.7 + position[0]) * 0.005;
    const next = THREE.MathUtils.lerp(ref.current.scale.x, target, 0.1);
    ref.current.scale.setScalar(next);

    const pulse = 0.62 + Math.sin(t * 1.4 + position[2]) * 0.14;
    if (portalMat.current) {
      portalMat.current.opacity = THREE.MathUtils.lerp(
        portalMat.current.opacity,
        hovered ? 0.95 : pulse,
        0.1,
      );
    }
    if (frameMat.current) {
      frameMat.current.emissiveIntensity = THREE.MathUtils.lerp(
        frameMat.current.emissiveIntensity,
        hovered ? 0.9 : 0.35 + Math.sin(t * 1.4 + position[2]) * 0.08,
        0.1,
      );
    }
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        hovered ? 6 : 2.6,
        0.1,
      );
    }
    // ışık çizgileri hafif titreşir
    if (linesRef.current) {
      linesRef.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.3 + Math.sin(t * 2 + i * 1.7) * 0.18 + (hovered ? 0.25 : 0);
      });
    }
    // sis yavaşça sürüklenir
    if (mistRef.current) {
      mistRef.current.children.forEach((c, i) => {
        c.position.x = Math.sin(t * 0.3 + i * 2) * 0.4;
        const m = ((c as THREE.Mesh).material as THREE.MeshBasicMaterial);
        m.opacity = 0.18 + Math.sin(t * 0.5 + i) * 0.08;
      });
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        router.push(route);
      }}
    >
      {model ? (
        <GateModel url={model} />
      ) : (
        <>
          {/* Mermer kemer çerçevesi */}
          <mesh geometry={frameGeo} castShadow>
            <meshStandardMaterial
              ref={frameMat}
              color={stone}
              emissive={color}
              emissiveIntensity={0.35}
              roughness={0.32}
              metalness={0.12}
            />
          </mesh>

          {/* İçte yumuşak parlayan portal düzlemi */}
          <mesh position={[0, (IN_H + IN_W) / 2 - 0.1, -0.02]}>
            <planeGeometry args={[IN_W * 2.05, IN_H + IN_W]} />
            <meshBasicMaterial
              ref={portalMat}
              map={portalTex}
              transparent
              opacity={0.62}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>

          {/* Dikey ışık çizgileri — enerji eşiği */}
          <group ref={linesRef} position={[0, 0, 0.02]}>
            {[-0.55, -0.18, 0.18, 0.55].map((x, i) => (
              <mesh key={x} position={[x, 1.4, 0]}>
                <planeGeometry args={[0.09, 2.7 - Math.abs(x) * 0.9]} />
                <meshBasicMaterial
                  map={lineTex}
                  transparent
                  opacity={0.35}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>

          {/* Alttan yükselen sis */}
          <group ref={mistRef} position={[0, 0.45, 0.3]}>
            {[0, 1].map((i) => (
              <mesh key={i} position={[0, i * 0.4, i * 0.15]}>
                <planeGeometry args={[3.8, 1.7]} />
                <meshBasicMaterial
                  map={mistTex}
                  transparent
                  opacity={0.18}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>

          {/* Zemin glow diski — suya yansıyan eşik ışığı */}
          <mesh position={[0, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.7, 48]} />
            <meshBasicMaterial
              map={portalTex}
              transparent
              opacity={0.4}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Bölge etiketi — sahne içi değil, HTML overlay */}
      <Html
        position={[0, OUT_H + OUT_W + 0.5, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>
          <div
            style={{
              fontFamily: "var(--cae-font-serif, Georgia, serif)",
              fontSize: "15px",
              letterSpacing: "0.34em",
              textIndent: "0.34em",
              color: "#f3ecdd",
              textShadow: "0 0 12px rgba(0,0,0,0.8)",
              opacity: hovered ? 1 : 0.92,
              transition: "opacity .3s ease",
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: "4px",
              fontFamily: "var(--cae-font-sans, system-ui, sans-serif)",
              fontSize: "9px",
              letterSpacing: "0.26em",
              textIndent: "0.26em",
              textTransform: "uppercase",
              color,
              opacity: hovered ? 0.95 : 0.6,
              transition: "opacity .3s ease",
            }}
          >
            {subtitle}
          </div>
        </div>
      </Html>

      <pointLight
        ref={lightRef}
        color={color}
        intensity={2.6}
        distance={10}
        position={[0, 2, 1.4]}
      />
    </group>
  );
}

/** #rrggbb → rgba(r,g,b,a) */
function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

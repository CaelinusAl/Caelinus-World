"use client";

/**
 * CaelinusUniverseScene — Caelinus Evreni (AAA sinematik metaverse meydanı).
 *
 * Mimari ve routing KORUNUR (DISTRICTS id/href değişmez). Prototip his veren
 * koni/glow-küre sahnesi, yaşayan bir güneş sistemine refactor edildi:
 *   • derin volumetrik nebula + galaksi tozu + uzak galaksiler + uzay sisi,
 *   • her bölge = kendi kimliğine sahip prosedürel gezegen (atmosfer/bulut/halka/
 *     partikül/yörünge),
 *   • merkezde sistem yıldızı (eski "Yaşam Motoru"), korona + ışık,
 *   • asteroit kuşağı · kuyruklu yıldızlar · kristaller · süpernova flaşları,
 *   • sinematik kamera (damping/inertia/auto-orbit/nefes/paralaks),
 *   • gezegene giriş = warp (yıldız çizgileri + chromatic aberration + bloom +
 *     beyaz flaş) → mevcut route'a yumuşak geçiş.
 *
 * Stack: @react-three/fiber ^9 · @react-three/drei ^10 · @react-three/postprocessing ^3 · three ^0.183
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sparkles, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { DISTRICTS, type District } from "@/components/universe/districts";
import { useUniverseAudio } from "@/lib/audio/useUniverseAudio";
import "@/app/styles/universe.css";

const UniverseHUD = dynamic(
  () => import("@/components/universe/UniverseHUD"),
  { ssr: false },
);

/* ───────────────────────── Paylaşılan GLSL gürültü ───────────────────────── */
const NOISE = /* glsl */ `
  float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float vnoise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
   return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
              mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<3;i++){ v+=a*vnoise(p); p*=2.03; a*=0.5; } return v; }
`;

/* Paylaşılan durum referansları (context yerine ucuz ref geçişi). */
type Shared = {
  positions: Record<string, THREE.Vector3>;
  warp: { value: number };
  selectedId: string | null;
};

/* ════════════════════════════ NEBULA BACKDROP ════════════════════════════ */
const NEBULA_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform float uTime;
  ${NOISE}
  void main(){
    vec3 d = normalize(vDir);
    vec3 p = d * 2.2;
    float t = uTime * 0.015;
    float n1 = fbm(p + vec3(t, t*0.6, -t*0.4));
    float n2 = fbm(p*2.1 + vec3(-t*0.5, t*0.3, t));
    float gas = smoothstep(0.35, 0.95, n1*0.7 + n2*0.4);

    vec3 violet = vec3(0.36, 0.22, 0.62);
    vec3 indigo = vec3(0.10, 0.12, 0.34);
    vec3 magenta = vec3(0.52, 0.20, 0.46);
    vec3 gold   = vec3(0.45, 0.34, 0.18);

    vec3 col = indigo * 0.5;
    col = mix(col, violet, gas);
    col = mix(col, magenta, smoothstep(0.6, 1.0, n2) * gas * 0.7);
    col += gold * smoothstep(0.7, 1.0, n1) * 0.18;

    // derinlik: alt kısım koyulaşsın
    col *= 0.55 + 0.45 * smoothstep(-0.6, 0.6, d.y);
    col *= 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`;
const NEBULA_VERT = /* glsl */ `
  varying vec3 vDir;
  void main(){
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
function Nebula() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((s) => {
    if (mat.current) mat.current.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[160, 48, 48]} />
      <shaderMaterial
        ref={mat}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ════════════════════════════ STARFIELD + DUST ════════════════════════════ */
const STAR_VERT = /* glsl */ `
  attribute float aSize; attribute float aPhase;
  varying float vTw;
  uniform float uTime; uniform float uPixel;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position,1.0);
    float tw = 0.5 + 0.5*sin(uTime*1.4 + aPhase*6.2831);
    vTw = tw;
    gl_PointSize = aSize * uPixel * (0.6+tw*0.7) * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const STAR_FRAG = /* glsl */ `
  precision highp float; varying float vTw; uniform vec3 uColor;
  void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard;
    float a=smoothstep(0.5,0.0,r)*vTw; gl_FragColor=vec4(uColor*(0.6+vTw*0.7), a); }
`;
function StarField({
  count,
  inner,
  outer,
  size,
  color,
}: {
  count: number;
  inner: number;
  outer: number;
  size: number;
  color: THREE.Color;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size: vp, viewport } = useThree();
  const { positions, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .normalize()
        .multiplyScalar(inner + Math.random() * (outer - inner));
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      sizes[i] = size * (0.4 + Math.random() * Math.random() * 2.4);
      phases[i] = Math.random();
    }
    return { positions, sizes, phases };
  }, [count, inner, outer, size]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: color.clone() }, uPixel: { value: 90 } }),
    [color],
  );
  useFrame((s) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = s.clock.elapsedTime;
      mat.current.uniforms.uPixel.value = (vp.height / viewport.height) * 70;
    }
  });
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} count={count} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} count={count} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/* ─── Uzak galaksiler — yavaş dönen spiral sprite'lar ─── */
function makeGalaxyTexture(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.18, color);
  g.addColorStop(0.5, "rgba(120,90,180,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  // spiral kollar
  ctx.globalCompositeOperation = "lighter";
  for (let arm = 0; arm < 2; arm++) {
    ctx.beginPath();
    for (let i = 0; i < 220; i++) {
      const a = i * 0.13 + arm * Math.PI;
      const r = i * 0.52;
      const x = 128 + Math.cos(a) * r;
      const y = 128 + Math.sin(a) * r * 0.7;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(220,200,255,0.10)";
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function DistantGalaxies() {
  const data = useMemo(
    () => [
      { pos: [-70, 30, -90] as const, scale: 36, color: "rgba(180,150,255,0.5)", spin: 0.02 },
      { pos: [85, -20, -70] as const, scale: 28, color: "rgba(255,200,150,0.45)", spin: -0.015 },
      { pos: [40, 55, -110] as const, scale: 44, color: "rgba(150,200,255,0.4)", spin: 0.01 },
    ],
    [],
  );
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const texs = useMemo(() => data.map((d) => makeGalaxyTexture(d.color)), [data]);
  useFrame((_s, delta) => {
    refs.current.forEach((sp, i) => {
      if (sp) sp.material.rotation += delta * data[i].spin;
    });
  });
  return (
    <>
      {data.map((d, i) => (
        <sprite
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={d.pos as unknown as [number, number, number]}
          scale={[d.scale, d.scale, d.scale]}
        >
          <spriteMaterial
            map={texs[i]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.8}
            toneMapped={false}
          />
        </sprite>
      ))}
    </>
  );
}

/* ════════════════════════════ MERKEZ YILDIZ ════════════════════════════ */
const STAR_CORE_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vObjPos; varying vec3 vWorldNormal; varying vec3 vWorldPos;
  uniform float uTime; uniform vec3 uCamPos;
  ${NOISE}
  void main(){
    vec3 p = normalize(vObjPos)*2.5;
    float n = fbm(p + vec3(uTime*0.12));
    float n2 = fbm(p*2.4 - vec3(uTime*0.18));
    float heat = 0.5 + 0.5*sin((n+n2)*6.2831);
    vec3 hot = vec3(1.0, 0.92, 0.62);
    vec3 mid = vec3(1.0, 0.66, 0.22);
    vec3 cool = vec3(0.85, 0.32, 0.55);
    vec3 col = mix(cool, mid, smoothstep(0.2,0.6,n));
    col = mix(col, hot, smoothstep(0.55,0.95,heat));
    vec3 V = normalize(uCamPos - vWorldPos);
    float fres = pow(1.0 - max(dot(normalize(vWorldNormal),V),0.0), 2.0);
    col += vec3(1.0,0.8,0.5) * fres * 0.8;
    gl_FragColor = vec4(col * 2.2, 1.0);
  }
`;
const WORLD_VERT = /* glsl */ `
  varying vec3 vObjPos; varying vec3 vWorldNormal; varying vec3 vWorldPos;
  void main(){
    vObjPos = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position,1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
function CentralStar() {
  const core = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const halo = useRef<THREE.Sprite>(null);
  const { camera } = useThree();
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uCamPos: { value: new THREE.Vector3() } }),
    [],
  );
  const haloTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,230,170,0.9)");
    g.addColorStop(0.3, "rgba(255,170,90,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame((s) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = s.clock.elapsedTime;
      (mat.current.uniforms.uCamPos.value as THREE.Vector3).copy(camera.position);
    }
    if (core.current) core.current.rotation.y += 0.0015;
    if (halo.current) {
      const pulse = 1 + 0.05 * Math.sin(s.clock.elapsedTime * 0.8);
      halo.current.scale.setScalar(26 * pulse);
    }
  });
  return (
    <group position={[0, 1.6, 0]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[3.4, 6]} />
        <shaderMaterial
          ref={mat}
          vertexShader={WORLD_VERT}
          fragmentShader={STAR_CORE_FRAG}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
      <sprite ref={halo}>
        <spriteMaterial
          map={haloTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.85}
          toneMapped={false}
        />
      </sprite>
      <Sparkles count={70} scale={[14, 14, 14]} size={2.4} speed={0.3} color="#ffcf6e" opacity={0.7} />
      <pointLight color="#ffd9a0" intensity={420} distance={120} decay={1.4} />
      <pointLight color="#ff8a4a" intensity={120} distance={60} decay={1.6} />
    </group>
  );
}

/* ════════════════════════════ GEZEGEN ════════════════════════════ */
const PLANET_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vObjPos; varying vec3 vWorldNormal; varying vec3 vWorldPos;
  uniform float uTime; uniform vec3 uDeep, uBase, uHi, uAtm;
  uniform vec3 uLightPos; uniform vec3 uCamPos;
  uniform float uHover; uniform float uSeed; uniform float uScale;
  ${NOISE}
  float terrain(vec3 p){ return fbm(p*uScale + uSeed); }
  void main(){
    vec3 op = normalize(vObjPos);
    float n = terrain(op);
    // GPU-dostu: pixel başına tek terrain çağrısı; kabartma yerine geometrik
    // normal (terminatör korunur, kraterler albedo'da okunur).
    vec3 N = normalize(vWorldNormal);

    vec3 col = mix(uDeep, uBase, smoothstep(0.34,0.55,n));
    col = mix(col, uHi, smoothstep(0.62,0.84,n));

    vec3 L = normalize(uLightPos - vWorldPos);
    float ndl = dot(N, L);
    float lit = smoothstep(-0.25, 0.55, ndl);
    col *= (0.16 + lit*1.05);
    // gece tarafı hafif atmosfer ışıması
    col += uAtm * (1.0-lit) * 0.05;
    // limb terminatör sıcaklığı
    col += uHi * smoothstep(0.0,0.15,abs(ndl)) * 0.0;

    vec3 V = normalize(uCamPos - vWorldPos);
    float fres = pow(1.0 - max(dot(N,V),0.0), 3.0);
    col += uAtm * fres * (0.35 + uHover*0.6);
    col *= (1.0 + uHover*0.22);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const ATM_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal; varying vec3 vWorldPos; varying vec3 vObjPos;
  uniform vec3 uCamPos; uniform vec3 uColor; uniform float uIntensity; uniform vec3 uLightPos;
  void main(){
    vec3 V = normalize(uCamPos - vWorldPos);
    float fres = pow(1.0 - max(dot(normalize(vWorldNormal), V), 0.0), 2.6);
    vec3 L = normalize(uLightPos - vWorldPos);
    float lit = clamp(dot(normalize(vWorldNormal), L)*0.7+0.5, 0.15, 1.0);
    float a = fres * uIntensity * lit;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const CLOUD_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vObjPos; varying vec3 vWorldNormal; varying vec3 vWorldPos;
  uniform float uTime; uniform vec3 uLightPos; uniform vec3 uCamPos;
  ${NOISE}
  void main(){
    vec3 p = normalize(vObjPos)*2.6;
    float c = fbm(p + vec3(uTime*0.03, 0.0, -uTime*0.02));
    float cov = smoothstep(0.52, 0.78, c);
    if(cov < 0.02) discard;
    vec3 L = normalize(uLightPos - vWorldPos);
    float lit = smoothstep(-0.2,0.6, dot(normalize(vWorldNormal), L));
    vec3 col = vec3(1.0) * (0.25 + lit*0.85);
    gl_FragColor = vec4(col, cov * (0.35 + lit*0.5));
  }
`;

const RING_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vObjPos; varying vec3 vWorldPos;
  uniform vec3 uColor; uniform float uInner; uniform float uOuter; uniform vec3 uLightPos; varying vec3 vWorldNormal;
  void main(){
    float r = length(vObjPos.xy);
    float t = (r - uInner)/(uOuter - uInner);
    if(t<0.0 || t>1.0) discard;
    float bands = 0.55 + 0.45*sin(t*38.0);
    float edge = smoothstep(0.0,0.08,t)*smoothstep(1.0,0.9,t);
    float a = bands * edge * 0.7;
    gl_FragColor = vec4(uColor * (0.6+bands*0.6), a);
  }
`;

function Planet({
  d,
  shared,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  d: District;
  shared: Shared;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const planet = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const surfMat = useRef<THREE.ShaderMaterial>(null);
  const atmMat = useRef<THREE.ShaderMaterial>(null);
  const cloudMat = useRef<THREE.ShaderMaterial>(null);
  const hov = useRef(0);
  const { camera } = useThree();

  const C = useMemo(
    () => ({
      deep: new THREE.Color(d.deep),
      base: new THREE.Color(d.base),
      hi: new THREE.Color(d.hi),
      atm: new THREE.Color(d.atmosphere),
      accent: new THREE.Color(d.accent),
    }),
    [d],
  );
  const starPos = useMemo(() => new THREE.Vector3(0, 1.6, 0), []);

  const surfUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: C.deep },
      uBase: { value: C.base },
      uHi: { value: C.hi },
      uAtm: { value: C.atm },
      uLightPos: { value: starPos },
      uCamPos: { value: new THREE.Vector3() },
      uHover: { value: 0 },
      uSeed: { value: d.seed },
      uScale: { value: d.surfaceScale },
    }),
    [C, d, starPos],
  );
  const atmUniforms = useMemo(
    () => ({
      uCamPos: { value: new THREE.Vector3() },
      uColor: { value: C.atm },
      uIntensity: { value: 0.9 },
      uLightPos: { value: starPos },
    }),
    [C, starPos],
  );
  const cloudUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLightPos: { value: starPos },
      uCamPos: { value: new THREE.Vector3() },
    }),
    [starPos],
  );
  const ringUniforms = useMemo(
    () => ({
      uColor: { value: C.atm },
      uInner: { value: d.planetRadius * 1.5 },
      uOuter: { value: d.planetRadius * 2.5 },
      uLightPos: { value: starPos },
    }),
    [C, d, starPos],
  );

  useEffect(() => {
    if (!shared.positions[d.id]) shared.positions[d.id] = new THREE.Vector3();
  }, [shared, d.id]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    hov.current += ((hovered ? 1 : 0) - hov.current) * Math.min(1, delta * 6);

    // Yörünge — seçilince dur (kamera hedefi sabit kalsın).
    if (group.current) {
      if (!selected) {
        const a = d.angle + t * d.orbitSpeed;
        group.current.position.set(
          Math.sin(a) * d.orbitRadius,
          1.6 + Math.sin(t * 0.3 + d.seed) * 0.4,
          Math.cos(a) * d.orbitRadius,
        );
      }
      shared.positions[d.id]?.copy(group.current.position);
    }
    // Dönüş — hover/seçimde hızlan.
    const spin = 0.05 + hov.current * 0.18 + (selected ? 0.6 : 0);
    if (planet.current) planet.current.rotation.y += delta * spin;
    if (clouds.current) clouds.current.rotation.y += delta * (spin * 1.25);

    const cam = camera.position;
    if (surfMat.current) {
      surfMat.current.uniforms.uTime.value = t;
      surfMat.current.uniforms.uHover.value = hov.current;
      (surfMat.current.uniforms.uCamPos.value as THREE.Vector3).copy(cam);
    }
    if (atmMat.current) {
      (atmMat.current.uniforms.uCamPos.value as THREE.Vector3).copy(cam);
      atmMat.current.uniforms.uIntensity.value =
        (0.8 + hov.current * 0.9) * (0.9 + 0.1 * Math.sin(t * 0.7 + d.seed));
    }
    if (cloudMat.current) {
      cloudMat.current.uniforms.uTime.value = t;
      (cloudMat.current.uniforms.uCamPos.value as THREE.Vector3).copy(cam);
    }
  });

  const setCursor = (on: boolean) => {
    document.body.style.cursor = on ? "pointer" : "auto";
  };

  return (
    <group ref={group}>
      {/* Yüzey — tıklanabilir */}
      <mesh
        ref={planet}
        onPointerOver={(e) => { e.stopPropagation(); onHover(d.id); setCursor(true); }}
        onPointerOut={() => { onHover(null); setCursor(false); }}
        onClick={(e) => { e.stopPropagation(); onSelect(d.id); }}
      >
        <sphereGeometry args={[d.planetRadius, 64, 64]} />
        <shaderMaterial
          ref={surfMat}
          vertexShader={WORLD_VERT}
          fragmentShader={PLANET_FRAG}
          uniforms={surfUniforms}
        />
      </mesh>

      {/* Bulut katmanı */}
      {d.hasClouds && (
        <mesh ref={clouds} scale={1.025}>
          <sphereGeometry args={[d.planetRadius, 48, 48]} />
          <shaderMaterial
            ref={cloudMat}
            vertexShader={WORLD_VERT}
            fragmentShader={CLOUD_FRAG}
            uniforms={cloudUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Atmosfer hâlesi */}
      <mesh scale={1.14}>
        <sphereGeometry args={[d.planetRadius, 48, 48]} />
        <shaderMaterial
          ref={atmMat}
          vertexShader={WORLD_VERT}
          fragmentShader={ATM_FRAG}
          uniforms={atmUniforms}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Halka sistemi */}
      {d.hasRings && (
        <mesh rotation={[-Math.PI / 2.1, 0.2, 0]}>
          <ringGeometry args={[d.planetRadius * 1.5, d.planetRadius * 2.5, 128]} />
          <shaderMaterial
            vertexShader={WORLD_VERT}
            fragmentShader={RING_FRAG}
            uniforms={ringUniforms}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Gezegen partikül sistemi */}
      <Sparkles
        count={hovered ? 60 : 26}
        scale={[d.planetRadius * 3.4, d.planetRadius * 3.4, d.planetRadius * 3.4]}
        size={2}
        speed={0.25}
        color={d.accent}
        opacity={hovered ? 0.9 : 0.45}
      />

      {/* Bölge ambient ışığı */}
      <pointLight color={d.light} intensity={hovered ? 28 : 10} distance={d.planetRadius * 8} decay={1.6} />
    </group>
  );
}

/* ════════════════════════════ YÖRÜNGE + TAKIMYILDIZ ════════════════════════════ */
function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.6, 0]}>
      <ringGeometry args={[radius - 0.06, radius + 0.06, 220]} />
      <meshBasicMaterial
        color="#6b5ea8"
        transparent
        opacity={0.16}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function Constellations({ shared }: { shared: Shared }) {
  const ref = useRef<THREE.LineSegments>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(DISTRICTS.length * 2 * 3), 3),
    );
    return g;
  }, []);
  useFrame(() => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const center = new THREE.Vector3(0, 1.6, 0);
    DISTRICTS.forEach((d, i) => {
      const p = shared.positions[d.id] ?? center;
      arr[i * 6] = center.x;
      arr[i * 6 + 1] = center.y;
      arr[i * 6 + 2] = center.z;
      arr[i * 6 + 3] = p.x;
      arr[i * 6 + 4] = p.y;
      arr[i * 6 + 5] = p.z;
    });
    pos.needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial
        color="#8a7ad0"
        transparent
        opacity={0.14}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}

/* ════════════════════════════ ÇEVRE: KUŞAK · KUYRUKLU · KRİSTAL · SÜPERNOVA ════════════════════════════ */
function AsteroidBelt() {
  const group = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const COUNT = 260;
  useEffect(() => {
    if (!inst.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 10;
      dummy.position.set(
        Math.cos(a) * r,
        1.6 + (Math.random() - 0.5) * 3,
        Math.sin(a) * r,
      );
      const s = 0.12 + Math.random() * 0.5;
      dummy.scale.setScalar(s);
      dummy.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      dummy.updateMatrix();
      inst.current.setMatrixAt(i, dummy.matrix);
    }
    inst.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame((_s, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.012;
  });
  return (
    <group ref={group}>
      <instancedMesh ref={inst} args={[undefined as never, undefined as never, COUNT]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6b6072" roughness={0.95} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}

function Comet({ seed, color }: { seed: number; color: string }) {
  const group = useRef<THREE.Group>(null);
  const tailTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [color]);
  const prev = useRef(new THREE.Vector3());
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.12 + seed;
    const r = 56 + Math.sin(seed) * 8;
    const pos = new THREE.Vector3(
      Math.cos(t) * r,
      1.6 + Math.sin(t * 0.7 + seed) * 14,
      Math.sin(t) * r * 0.8,
    );
    if (group.current) {
      group.current.position.copy(pos);
      const vel = pos.clone().sub(prev.current);
      if (vel.lengthSq() > 1e-6) {
        group.current.lookAt(pos.clone().add(vel));
      }
    }
    prev.current.copy(pos);
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite position={[0, 0, 3]} scale={[7, 1.6, 1]}>
        <spriteMaterial
          map={tailTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.7}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}

function Crystals() {
  const data = useMemo(
    () => [
      { pos: [16, 8, 18] as const, c: "#b9a3ff" },
      { pos: [-20, 6, -10] as const, c: "#9ad8ff" },
      { pos: [10, 12, -24] as const, c: "#ffd9a0" },
    ],
    [],
  );
  return (
    <>
      {data.map((d, i) => (
        <Float key={i} speed={1.4} rotationIntensity={0.8} floatIntensity={1.4}>
          <mesh position={d.pos as unknown as [number, number, number]}>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color={d.c}
              emissive={d.c}
              emissiveIntensity={1.6}
              roughness={0.1}
              metalness={0.3}
              transparent
              opacity={0.85}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Supernova() {
  const ref = useRef<THREE.Sprite>(null);
  const next = useRef(8);
  const t0 = useRef(-1);
  const pos = useRef(new THREE.Vector3());
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(200,210,255,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame((s) => {
    const time = s.clock.elapsedTime;
    const sp = ref.current;
    if (!sp) return;
    if (t0.current < 0 && time > next.current) {
      t0.current = time;
      pos.current.set(
        (Math.random() - 0.5) * 160,
        (Math.random() - 0.2) * 70,
        -60 - Math.random() * 60,
      );
      sp.position.copy(pos.current);
    }
    if (t0.current >= 0) {
      const local = time - t0.current;
      const life = 2.2;
      const p = local / life;
      const a = Math.sin(Math.min(p, 1) * Math.PI);
      sp.visible = p < 1;
      sp.scale.setScalar(4 + a * 26);
      (sp.material as THREE.SpriteMaterial).opacity = a;
      if (p >= 1) {
        t0.current = -1;
        next.current = time + 10 + Math.random() * 16;
      }
    } else {
      sp.visible = false;
    }
  });
  return (
    <sprite ref={ref} visible={false}>
      <spriteMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0}
        toneMapped={false}
      />
    </sprite>
  );
}

/* ════════════════════════════ WARP STAR STREAKS ════════════════════════════ */
function WarpStreaks({ shared }: { shared: Shared }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const { camera } = useThree();
  const COUNT = 220;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(COUNT * 2 * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 1.5 + Math.random() * 9;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      const z = -2 - Math.random() * 30;
      // segment forward boyunca (-z) — group.scale.z ile uzar
      arr[i * 6] = x; arr[i * 6 + 1] = y; arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x; arr[i * 6 + 4] = y; arr[i * 6 + 5] = z - 1.0;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useFrame(() => {
    const w = shared.warp.value;
    if (group.current) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
      group.current.scale.set(1, 1, 1 + w * 60);
      group.current.visible = w > 0.01;
    }
    if (mat.current) mat.current.opacity = Math.min(w * 1.6, 0.9);
  });
  return (
    <group ref={group}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial
          ref={mat}
          color="#cfe0ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

/* ════════════════════════════ KAMERA ════════════════════════════ */
function CameraController({
  shared,
  phase,
}: {
  shared: Shared;
  phase: "idle" | "warp";
}) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  const warp = useRef(0);
  const shake = useRef(new THREE.Vector3());

  useFrame((s, delta) => {
    const c = controls.current;
    if (phase === "warp" && shared.selectedId) {
      warp.current = Math.min(1, warp.current + delta * (0.5 + warp.current * 2.2));
      shared.warp.value = warp.current;
      if (c) c.enabled = false;
      const tp = shared.positions[shared.selectedId];
      if (tp) {
        const dir = camera.position.clone().sub(tp);
        const dist = dir.length();
        dir.normalize();
        const desiredDist = THREE.MathUtils.lerp(dist, 0.15, warp.current);
        const desired = tp.clone().add(dir.multiplyScalar(Math.max(desiredDist, 0.15)));
        camera.position.lerp(desired, 0.1 + warp.current * 0.35);
        // kamera sarsıntısı
        const sh = warp.current * 0.12;
        shake.current.set(
          (Math.random() - 0.5) * sh,
          (Math.random() - 0.5) * sh,
          0,
        );
        camera.position.add(shake.current);
        camera.lookAt(tp);
      }
    } else {
      warp.current = 0;
      shared.warp.value = 0;
      if (c) {
        c.enabled = true;
        const t = s.clock.elapsedTime;
        // nefes + mikro hareket (yüzme hissi)
        c.target.x = Math.sin(t * 0.16) * 0.6;
        c.target.y = 1.6 + Math.sin(t * 0.22) * 0.4;
        c.target.z = Math.cos(t * 0.13) * 0.6;
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      enablePan={false}
      autoRotate
      autoRotateSpeed={0.25}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
      minDistance={9}
      maxDistance={90}
      maxPolarAngle={Math.PI / 1.8}
      minPolarAngle={Math.PI / 7}
      target={[0, 1.6, 0]}
    />
  );
}

/* ════════════════════════════ POST FX ════════════════════════════ */
/* Bloom + Vignette — düşük bellek (MSAA kapalı, CA geçişi kaldırıldı). */
function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.5}
        radius={0.7}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.28} darkness={0.7} />
    </EffectComposer>
  );
}

/* ════════════════════════════ SAHNE ════════════════════════════ */
function Scene({
  shared,
  hoveredId,
  selectedId,
  phase,
  onHover,
  onSelect,
}: {
  shared: Shared;
  hoveredId: string | null;
  selectedId: string | null;
  phase: "idle" | "warp";
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <fog attach="fog" args={["#0a0820", 60, 150]} />
      <ambientLight intensity={0.08} color="#2a2150" />

      <Nebula />
      <StarField count={2600} inner={70} outer={150} size={1.1} color={new THREE.Color("#ffffff")} />
      <StarField count={900} inner={45} outer={90} size={1.7} color={new THREE.Color("#cdb8ff")} />
      <DistantGalaxies />

      <CentralStar />

      {DISTRICTS.map((d) => (
        <OrbitRing key={`o-${d.id}`} radius={d.orbitRadius} />
      ))}
      <Constellations shared={shared} />

      {DISTRICTS.map((d) => (
        <Planet
          key={d.id}
          d={d}
          shared={shared}
          hovered={hoveredId === d.id}
          selected={selectedId === d.id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <AsteroidBelt />
      <Comet seed={0} color="#bfe0ff" />
      <Comet seed={3.7} color="#ffd9a0" />
      <Crystals />
      <Supernova />

      <WarpStreaks shared={shared} />
      <CameraController shared={shared} phase={phase} />
      <PostFX />
    </>
  );
}

/* WebGL yeteneği + YAZILIM render tespiti.
 *
 * "ok"       → gerçek GPU, ağır sahne kurulur.
 * "none"     → WebGL hiç yok, fallback.
 * "software" → context kuruluyor AMA SwiftShader/llvmpipe/Microsoft Basic gibi
 *              YAZILIM renderer'ı. Bu ağır custom-shader sahnesi yazılım
 *              render'da boş/siyah çıkıyor (en sık: masaüstü Chrome'da donanım
 *              hızlandırma KAPALI). Eski kod context kurulduğu için "var" sayıp
 *              boş sahneyi gösteriyordu — bunun yerine gezilebilir fallback.
 *
 * Not: WEBGL_debug_renderer_info engelliyse renderer="" olur ve "ok" döneriz —
 * yani yalnızca POZİTİF yazılım tespitinde düşürürüz (gerçek GPU'ları asla
 * yanlışlıkla fallback'e atmayız; mobil yolu güvende). */
type GLStatus = "ok" | "none" | "software";
const SOFTWARE_RE = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;
function detectGL(): GLStatus {
  if (typeof window === "undefined") return "none";
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ||
      c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!window.WebGLRenderingContext || !gl) return "none";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "")
      : "";
    return SOFTWARE_RE.test(renderer) ? "software" : "ok";
  } catch {
    return "none";
  }
}

/* ════════════════════════════ ROOT ════════════════════════════ */
export default function CaelinusUniverseScene() {
  const router = useRouter();
  const audio = useUniverseAudio();
  const [ready, setReady] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "warp">("idle");
  const [glStatus, setGlStatus] = useState<GLStatus>("ok");
  const [crashed, setCrashed] = useState(false);
  const selectingRef = useRef(false);

  useEffect(() => {
    setGlStatus(detectGL());
  }, []);

  const live = glStatus === "ok" && !crashed;

  const shared = useMemo<Shared>(
    () => ({ positions: {}, warp: { value: 0 }, selectedId: null }),
    [],
  );
  shared.selectedId = selectedId;

  const handleHover = useCallback(
    (id: string | null) => {
      setHoveredId(id);
      if (id) audio.onHover();
    },
    [audio],
  );

  const handleSelect = useCallback(
    (id: string) => {
      if (selectingRef.current) return;
      selectingRef.current = true;
      const d = DISTRICTS.find((x) => x.id === id);
      if (!d) return;
      setSelectedId(id);
      setHoveredId(id);
      audio.onClick();
      // kısa bekleme → yörünge dursun + kamera kilitlensin, sonra warp
      window.setTimeout(() => {
        setPhase("warp");
        audio.onWarp();
      }, 220);
      window.setTimeout(() => {
        audio.onArrive();
        router.push(d.href);
      }, 1900);
    },
    [audio, router],
  );

  return (
    <div className={`uv-root${phase === "warp" ? " is-warping" : ""}`}>
      <div className="uv-canvas-wrap">
        {live ? (
          <Canvas
            dpr={[1, 1.4]}
            camera={{ fov: 55, near: 0.1, far: 600, position: [0, 6, -46] }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 0.9,
              failIfMajorPerformanceCaveat: false,
            }}
            onCreated={({ gl }) => {
              setReady(true);
              gl.domElement.addEventListener(
                "webglcontextlost",
                (e) => {
                  e.preventDefault();
                  setCrashed(true);
                },
                { once: true },
              );
            }}
          >
            <color attach="background" args={["#02030a"]} />
            <Suspense fallback={null}>
              <Scene
                shared={shared}
                hoveredId={hoveredId}
                selectedId={selectedId}
                phase={phase}
                onHover={handleHover}
                onSelect={handleSelect}
              />
            </Suspense>
          </Canvas>
        ) : (
          /* Fallback — 3B yoksa kullanıcı yine de bölgelere geçebilsin */
          <div className="uv-fallback">
            <div className="uv-fallback-orb" />
            <h2>Caelinus Evreni</h2>
            {glStatus === "software" ? (
              <p>
                Tarayıcıda donanım hızlandırma kapalı görünüyor, bu yüzden 3B
                gezegen sahnesi yüklenemiyor. Chrome&apos;da{" "}
                <strong>
                  Ayarlar → Sistem → “Mümkün olduğunda grafik hızlandırmayı
                  kullan”
                </strong>{" "}
                seçeneğini aç ve sayfayı yenile. Şimdilik bölgelere doğrudan
                geçebilirsin.
              </p>
            ) : (
              <p>Bu cihazda 3B sahne gösterilemedi — bölgelere doğrudan geç.</p>
            )}
            <div className="uv-fallback-nav">
              {DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  style={{ borderColor: d.accent, color: d.accent }}
                  onClick={() => router.push(d.href)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <UniverseHUD
        districts={DISTRICTS}
        hoveredId={hoveredId}
        activeId={selectedId}
        soundOn={audio.enabled}
        onToggleSound={audio.toggle}
        onChipHover={handleHover}
        onChipSelect={handleSelect}
      />

      <div className="uv-warp-flash" aria-hidden="true" />

      {live && !ready && (
        <div className="uv-loading">
          <div className="ring" />
          <div className="label">Caelinus Evreni Açılıyor</div>
        </div>
      )}
    </div>
  );
}

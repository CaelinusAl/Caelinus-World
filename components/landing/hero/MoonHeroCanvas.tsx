"use client";

/**
 * MoonHeroCanvas — Caelinus giriş eşiğinin sinematik 3D çekirdeği.
 *
 * Ay artık düz bir <img> değil; gerçek bir küre üzerinde prosedürel ay yüzeyi
 * (kraterler + maria + terminatör gölgesi), fresnel hâle, atmosferik pus, yavaş
 * dönüş, yüzme ve fare paralaksı ile yaşayan bir gök cismi. Bloom + chromatic
 * aberration ile sinematik post-processing.
 *
 * Etkileşim:
 *   • hover  → glow + bloom artar, partikül patlaması, hafif scale, ışık nabzı,
 *   • click  → kamera aya doğru uçar, ay ekranı doldurur, yıldızlar hızlanır,
 *              mor enerji halkaları + ışık patlaması (beyaza fade DOM'da).
 *
 * Tüm hareket GPU-dostu uniform güncellemeleriyle yapılır; mesh transformları
 * minimumda tutulur. Yalnızca tarayıcıda mount edilir (parent ssr:false).
 */

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Cloud, Clouds } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* ───────────────────────── Marka renk DNA'sı ───────────────────────── */
const VIOLET = new THREE.Color("#8f6cff");
const LAVENDER = new THREE.Color("#d8b7ff");
const GOLD = new THREE.Color("#e8c884");

/* ───────────────────── Yardımcı: radyal hâle dokusu ─────────────────── */
function makeRadialTexture(stops: [number, string][], size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ═══════════════════════════════ MOON ═══════════════════════════════ */
const MOON_VERT = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vObjPos = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const MOON_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vObjPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform float uHover;       // 0..1 hover yumuşatılmış
  uniform vec3  uLightDir;    // dünya uzayı ışık yönü (normalize)
  uniform vec3  uCamPos;
  uniform vec3  uViolet;
  uniform vec3  uGold;

  /* 3B value-noise + fbm */
  float hash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float vnoise(vec3 x){
    vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p*=2.03; a*=0.5; } return v; }

  /* Ay yükseklik alanı: maria (koyu denizler) + kraterler */
  float height(vec3 p){
    float base = fbm(p*1.4);
    float maria = smoothstep(0.42, 0.62, fbm(p*0.7));      // geniş koyu havzalar
    float ridges = fbm(p*3.1);
    float crater = pow(1.0 - abs(2.0*ridges-1.0), 5.0);    // krater kenar halkaları
    float fine = fbm(p*7.0)*0.25;                          // ince doku
    return base*0.6 + crater*0.5 - maria*0.35 + fine;
  }

  void main(){
    vec3 p = normalize(vObjPos) * 2.1;

    float h = height(p);
    // Normal pertürbasyonu — yüzey kabartması (object space gradient)
    float e = 0.012;
    vec3 t1 = normalize(abs(vObjPos.y) < 0.99 ? cross(vObjPos, vec3(0,1,0)) : vec3(1,0,0));
    vec3 t2 = normalize(cross(vObjPos, t1));
    float hx = height(p + t1*e);
    float hy = height(p + t2*e);
    vec3 nObj = normalize(vObjPos);
    vec3 perturbed = normalize(nObj - (t1*(hx-h) + t2*(hy-h)) * 6.0);
    vec3 N = normalize(mat3(modelMatrix) * perturbed);

    // Albedo — gümüş/fildişi, maria koyu, krater kenarları parlak
    float maria = smoothstep(0.42, 0.62, fbm(p*0.7));
    float albedo = mix(0.92, 0.58, maria);
    albedo += smoothstep(0.6, 1.0, h) * 0.18;
    albedo = clamp(albedo, 0.18, 1.05);

    // Terminatör — yumuşak gün/gece geçişi + volumetrik ışık hissi
    float ndl = dot(N, normalize(uLightDir));
    float lit = smoothstep(-0.18, 0.32, ndl);

    vec3 warm = mix(vec3(albedo), vec3(albedo)*uGold*1.15, 0.30);
    vec3 col = warm * lit;

    // Earthshine — karanlık taraf tamamen ölü olmasın (mor marka ışığı)
    col += uViolet * (1.0 - lit) * 0.06 * albedo;
    col += vec3(albedo) * 0.05;

    // Fresnel rim — limb parıltısı (violet→gold), bloom yakalar
    vec3 V = normalize(uCamPos - vWorldPos);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 rimCol = mix(uViolet, uGold, 0.45 + 0.25*sin(uTime*0.4));
    col += rimCol * fres * (0.8 + uHover*1.4);

    // Hover ışık nabzı — tüm disk hafif parlar
    col += rimCol * uHover * (0.10 + 0.06*sin(uTime*3.0)) * lit;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Moon({
  hovered,
  setHovered,
  onEnter,
}: {
  hovered: boolean;
  setHovered: (v: boolean) => void;
  onEnter: () => void;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const hov = useRef(0);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uLightDir: { value: new THREE.Vector3(-0.55, 0.35, 0.75).normalize() },
      uCamPos: { value: new THREE.Vector3() },
      uViolet: { value: VIOLET.clone() },
      uGold: { value: GOLD.clone() },
    }),
    [],
  );

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    hov.current += ((hovered ? 1 : 0) - hov.current) * Math.min(1, delta * 6);
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uHover.value = hov.current;
    (m.uniforms.uCamPos.value as THREE.Vector3).copy(camera.position);
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.035; // yavaş dönüş
      const s = 1 + hov.current * 0.045;
      mesh.current.scale.setScalar(s);
    }
  });

  return (
    <mesh
      ref={mesh}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEnter();
      }}
    >
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial
        ref={mat}
        vertexShader={MOON_VERT}
        fragmentShader={MOON_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}

/* ═════════════════════════ GLOW + HAZE ═════════════════════════ */
const GLOW_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main(){
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position,1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const GLOW_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  uniform vec3 uCamPos;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;
  uniform float uTime;
  void main(){
    vec3 V = normalize(uCamPos - vWorldPos);
    float fres = pow(1.0 - max(dot(normalize(vWorldNormal), V), 0.0), 2.4);
    vec3 col = mix(uColorA, uColorB, 0.5 + 0.5*sin(uTime*0.5));
    float a = fres * uIntensity;
    gl_FragColor = vec4(col * a, a);
  }
`;

function MoonGlow({ hovered }: { hovered: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const hov = useRef(0);
  const { camera } = useThree();
  const uniforms = useMemo(
    () => ({
      uCamPos: { value: new THREE.Vector3() },
      uColorA: { value: VIOLET.clone() },
      uColorB: { value: GOLD.clone() },
      uIntensity: { value: 0.9 },
      uTime: { value: 0 },
    }),
    [],
  );
  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    hov.current += ((hovered ? 1 : 0) - hov.current) * Math.min(1, delta * 6);
    (m.uniforms.uCamPos.value as THREE.Vector3).copy(camera.position);
    m.uniforms.uTime.value = state.clock.elapsedTime;
    const breath = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 0.6);
    m.uniforms.uIntensity.value = (0.85 + hov.current * 1.1) * breath;
  });
  return (
    <mesh scale={1.07}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={mat}
        vertexShader={GLOW_VERT}
        fragmentShader={GLOW_FRAG}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function HazeHalo({ hovered }: { hovered: boolean }) {
  const tex = useMemo(
    () =>
      makeRadialTexture([
        [0, "rgba(216,183,255,0.55)"],
        [0.25, "rgba(143,108,255,0.28)"],
        [0.55, "rgba(120,90,220,0.10)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    [],
  );
  const ref = useRef<THREE.Sprite>(null);
  const hov = useRef(0);
  useFrame((state, delta) => {
    hov.current += ((hovered ? 1 : 0) - hov.current) * Math.min(1, delta * 6);
    if (ref.current) {
      const breath = 1 + 0.04 * Math.sin(state.clock.elapsedTime * 0.6);
      const s = (3.6 + hov.current * 0.6) * breath;
      ref.current.scale.set(s, s, s);
      (ref.current.material as THREE.SpriteMaterial).opacity =
        0.8 + hov.current * 0.2;
    }
  });
  return (
    <sprite ref={ref} position={[0, 0, -0.6]}>
      <spriteMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.8}
      />
    </sprite>
  );
}

/* ═════════════════════════ PARTICLE BURST (hover) ═════════════════════════ */
function HoverParticles({ hovered }: { hovered: boolean }) {
  const COUNT = 90;
  const ref = useRef<THREE.Points>(null);
  const amp = useRef(0);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const r = Math.sqrt(1 - z * z);
      seeds[i * 3] = r * Math.cos(a);
      seeds[i * 3 + 1] = r * Math.sin(a);
      seeds[i * 3 + 2] = z;
    }
    return { positions, seeds };
  }, []);
  useFrame((state, delta) => {
    amp.current += ((hovered ? 1 : 0) - amp.current) * Math.min(1, delta * 4);
    const pts = ref.current;
    if (!pts) return;
    const t = state.clock.elapsedTime;
    const arr = (pts.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const k = 1.15 + amp.current * (0.55 + 0.25 * Math.sin(t * 2 + i));
      arr[i * 3] = seeds[i * 3] * k;
      arr[i * 3 + 1] = seeds[i * 3 + 1] * k + Math.sin(t + i) * 0.02;
      arr[i * 3 + 2] = seeds[i * 3 + 2] * k;
    }
    (pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;
    (pts.material as THREE.PointsMaterial).opacity = amp.current * 0.9;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={GOLD}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ═════════════════════════ STARFIELD ═════════════════════════ */
const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  varying float vTw;
  uniform float uTime;
  uniform float uPixel;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position,1.0);
    float tw = 0.55 + 0.45*sin(uTime*1.6 + aPhase*6.2831);
    vTw = tw;
    gl_PointSize = aSize * uPixel * tw * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const STAR_FRAG = /* glsl */ `
  precision highp float;
  varying float vTw;
  uniform vec3 uColor;
  void main(){
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if(r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r) * vTw;
    gl_FragColor = vec4(uColor * (0.6 + vTw*0.6), a);
  }
`;

function StarLayer({
  count,
  radius,
  spread,
  baseSize,
  color,
  parallax,
}: {
  count: number;
  radius: number;
  spread: number;
  baseSize: number;
  color: THREE.Color;
  parallax: number;
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const { positions, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // yarım küre — kameranın önünde, derinlikli
      const a = Math.random() * Math.PI * 2;
      const rr = radius + (Math.random() - 0.5) * spread;
      positions[i * 3] = Math.cos(a) * rr * (0.6 + Math.random() * 0.8);
      positions[i * 3 + 1] = (Math.random() - 0.5) * rr * 1.2;
      positions[i * 3 + 2] = -Math.abs(Math.sin(a) * rr) - 2;
      sizes[i] = baseSize * (0.4 + Math.random() * Math.random() * 2.2);
      phases[i] = Math.random();
    }
    return { positions, sizes, phases };
  }, [count, radius, spread, baseSize]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: color.clone() },
      uPixel: { value: 120 },
    }),
    [color],
  );

  useFrame((state, delta) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = state.clock.elapsedTime;
      mat.current.uniforms.uPixel.value =
        (size.height / viewport.height) * 90;
    }
    if (group.current) {
      const px = state.pointer.x * parallax;
      const py = state.pointer.y * parallax;
      group.current.rotation.y += (px * 0.05 - group.current.rotation.y) * 0.04;
      group.current.rotation.x += (-py * 0.04 - group.current.rotation.x) * 0.04;
      group.current.rotation.z += delta * 0.004;
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={count}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[sizes, 1]}
            count={count}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[phases, 1]}
            count={count}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={mat}
          vertexShader={STAR_VERT}
          fragmentShader={STAR_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ─── Kayan yıldızlar — nadir, çok ince ─── */
function ShootingStars() {
  const COUNT = 3;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      next: 3 + i * 4 + Math.random() * 6,
      t: 0,
      active: false,
      from: new THREE.Vector3(),
      dir: new THREE.Vector3(),
    })),
  );
  const tex = useMemo(
    () =>
      makeRadialTexture([
        [0, "rgba(255,255,255,1)"],
        [0.3, "rgba(216,183,255,0.7)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    [],
  );
  useFrame((s, delta) => {
    const time = s.clock.elapsedTime;
    state.current.forEach((st, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      if (!st.active && time > st.next) {
        st.active = true;
        st.t = 0;
        st.from.set(
          (Math.random() - 0.5) * 18 + 6,
          4 + Math.random() * 4,
          -8 - Math.random() * 6,
        );
        st.dir
          .set(-1 - Math.random(), -0.5 - Math.random() * 0.5, 0.2)
          .normalize();
      }
      if (st.active) {
        st.t += delta;
        const life = 1.1;
        const p = st.t / life;
        mesh.visible = true;
        mesh.position.copy(st.from).addScaledVector(st.dir, p * 22);
        const a = Math.sin(Math.min(p, 1) * Math.PI);
        (mesh.material as THREE.MeshBasicMaterial).opacity = a * 0.9;
        const len = 0.6 + a * 2.2;
        mesh.scale.set(len, 0.06 + a * 0.05, 1);
        mesh.lookAt(mesh.position.clone().add(st.dir));
        if (st.t > life) {
          st.active = false;
          st.next = time + 6 + Math.random() * 10;
          mesh.visible = false;
        }
      }
    });
  });
  return (
    <>
      {Array.from({ length: COUNT }).map((_, i) => (
        <mesh
          key={i}
          visible={false}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

/* ═════════════════════════ ENERGY RINGS (enter) ═════════════════════════ */
function EnergyRings({ entering }: { entering: boolean }) {
  const RINGS = 4;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const t0 = useRef<number | null>(null);
  useFrame((state) => {
    if (!entering) {
      t0.current = null;
      refs.current.forEach((m) => m && (m.visible = false));
      return;
    }
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - t0.current;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const local = elapsed - i * 0.16;
      if (local < 0) {
        m.visible = false;
        return;
      }
      const p = Math.min(local / 1.1, 1);
      m.visible = p < 1;
      const s = 0.8 + p * 6.5;
      m.scale.set(s, s, s);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8;
    });
  });
  return (
    <group>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh
          key={i}
          visible={false}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <ringGeometry args={[0.9, 1.0, 96]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? VIOLET : LAVENDER}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═════════════════════════ SCENE SCALER ═════════════════════════ */
/** Ay grubunu görünür alana göre ölçekler → her ekranda asla kırpılmaz. */
function MoonRig({
  children,
  entering,
}: {
  children: React.ReactNode;
  entering: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const enterAmt = useRef(0);
  useFrame((state, delta) => {
    enterAmt.current +=
      ((entering ? 1 : 0) - enterAmt.current) * Math.min(1, delta * 1.6);
    if (!group.current) return;
    // hâle yarıçapı ~1.6 → görünür alanın küçük boyutunun %32'sine sığsın
    const fit =
      (Math.min(viewport.width, viewport.height) * 0.32) / 1.6;
    const grow = 1 + enterAmt.current * 4.5; // enter'da ay ekranı doldurur
    const s = fit * grow;
    group.current.scale.setScalar(s);
    // hafif yüzme
    group.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.5) * 0.06 * fit;
    // fare paralaksı (sahnesel)
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.position.x +=
      (px * 0.18 * fit - group.current.position.x) * 0.04;
    group.current.rotation.x += (-py * 0.05 - group.current.rotation.x) * 0.04;
  });
  return <group ref={group}>{children}</group>;
}

/* ═════════════════════════ CAMERA RIG ═════════════════════════ */
function CameraRig({ entering }: { entering: boolean }) {
  const { camera } = useThree();
  const enterAmt = useRef(0);
  useFrame((state, delta) => {
    enterAmt.current +=
      ((entering ? 1 : 0) - enterAmt.current) * Math.min(1, delta * 1.8);
    const baseZ = 5;
    const z = baseZ - enterAmt.current * 3.4; // aya doğru uç
    const px = state.pointer.x * 0.25;
    const py = state.pointer.y * 0.18;
    camera.position.x += (px - camera.position.x) * 0.03;
    camera.position.y += (py - camera.position.y) * 0.03;
    camera.position.z += (z - camera.position.z) * 0.08;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ═════════════════════════ POST FX ═════════════════════════ */
function PostFX({ entering }: { entering: boolean }) {
  const caRef = useRef<any>(null);
  const off = useRef(new THREE.Vector2(0, 0));
  const amt = useRef(0);
  useFrame((_s, delta) => {
    amt.current += ((entering ? 1 : 0) - amt.current) * Math.min(1, delta * 2);
    const o = amt.current * 0.004;
    off.current.set(o, o);
    if (caRef.current) caRef.current.offset = off.current;
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.4}
        radius={0.75}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        offset={off.current}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.72} />
    </EffectComposer>
  );
}

/* ═════════════════════════ SCENE ═════════════════════════ */
function Scene({
  entering,
  onEnter,
}: {
  entering: boolean;
  onEnter: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <ambientLight intensity={0.15} color={LAVENDER} />
      <directionalLight
        position={[-4, 3, 5]}
        intensity={0.4}
        color="#fff4e0"
      />

      {/* Yıldız katmanları — derinlik + paralaks */}
      <StarLayer
        count={1400}
        radius={26}
        spread={20}
        baseSize={1.1}
        color={new THREE.Color("#ffffff")}
        parallax={0.5}
      />
      <StarLayer
        count={700}
        radius={16}
        spread={14}
        baseSize={1.6}
        color={LAVENDER}
        parallax={1.1}
      />
      <StarLayer
        count={300}
        radius={10}
        spread={8}
        baseSize={2.0}
        color={GOLD}
        parallax={1.9}
      />
      <ShootingStars />

      {/* Volumetrik bulutlar — alt katman, yavaş sürüklenir */}
      <group position={[0, -2.4, -3]}>
        <Clouds material={THREE.MeshBasicMaterial} limit={40}>
          <Cloud
            seed={2}
            segments={26}
            bounds={[10, 1.6, 3]}
            volume={5}
            color="#3a2d66"
            opacity={0.22}
            speed={0.08}
            fade={28}
          />
          <Cloud
            seed={7}
            segments={20}
            bounds={[12, 1.2, 3]}
            volume={6}
            color="#7a5fd0"
            opacity={0.12}
            speed={0.05}
            fade={30}
          />
        </Clouds>
      </group>

      {/* Ay portalı */}
      <MoonRig entering={entering}>
        <HazeHalo hovered={hovered} />
        <MoonGlow hovered={hovered} />
        <Moon hovered={hovered} setHovered={setHovered} onEnter={onEnter} />
        <HoverParticles hovered={hovered} />
        <EnergyRings entering={entering} />
      </MoonRig>

      <CameraRig entering={entering} />
      <PostFX entering={entering} />
    </>
  );
}

/* ═════════════════════════ ROOT ═════════════════════════ */
export default function MoonHeroCanvas({
  entering,
  onEnter,
}: {
  entering: boolean;
  onEnter: () => void;
}) {
  return (
    <Canvas
      className="moon-hero-canvas"
      dpr={[1, 1.8]}
      camera={{ fov: 42, near: 0.1, far: 120, position: [0, 0, 5] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <Suspense fallback={null}>
        <Scene entering={entering} onEnter={onEnter} />
      </Suspense>
    </Canvas>
  );
}

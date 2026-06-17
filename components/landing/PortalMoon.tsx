"use client";

/**
 * PortalMoon — gerçek ay dokusunu "yaşayan portala" çeviren WebGL katmanı.
 *
 * Tasarım kararı: ay görselini (public/moon/moon-real.png) DEĞİŞTİRMEZ; onu
 * base olarak bırakır ve üstüne **additive** bir enerji shader'ı bindirir.
 * Böylece ay hem gerçek/güvenli kalır (WebGL düşse bile alttaki CSS ay görünür)
 * hem de nefes alır: mor + altın enerji akışı, ince fresnel kenar parıltısı,
 * yavaş nefes ve işaretçiye (mouse) zarif tepki.
 *
 * Canvas, .moon-wrap kutusunu doldurur, pointer-events YOK (tık moon-wrap
 * butonunda kalır). Yalnızca yetenekli masaüstünde + reduced-motion kapalıyken
 * mount edilir; mobil/azaltılmış-hareket alttaki CSS ayı (kendi nefesiyle) görür.
 */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScreenQuad, useTexture } from "@react-three/drei";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uTime;
  uniform vec2  uPointer;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }

  void main() {
    vec4 tex = texture2D(uTex, vUv);
    float disc = tex.a;
    if (disc < 0.02) discard;

    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec2 c = vUv - 0.5;
    float r = length(c);
    float ang = atan(c.y, c.x);
    float t = uTime * 0.06;

    // İki katmanlı akış — ayın yüzeyinde dönen enerji.
    float f1 = fbm(vec2(ang * 1.6 + sin(t) * 0.5, r * 5.0 - t * 1.2));
    float f2 = fbm(vec2(ang * 2.4 - t * 0.8 + uPointer.x * 0.6, r * 7.0 + t * 0.6 + uPointer.y * 0.6));

    // Caelinus renk DNA'sı.
    vec3 violet = vec3(0.79, 0.64, 1.0);   // #caa4ff
    vec3 indigo = vec3(0.55, 0.43, 1.0);   // #8c6dff
    vec3 gold   = vec3(1.0, 0.85, 0.56);   // #ffd98f

    // Enerji yüzeyi YALNIZCA aydınlıkta değil, gölgede de yaşasın → "Portal
    // Core": yüzeyden çok enerji görünür. lum'a kısmi bağ (0.5 taban).
    float surf = mix(0.5, 1.0, lum);

    float e1 = smoothstep(0.44, 0.95, f1);
    float e2 = smoothstep(0.52, 1.0, f2);
    vec3 col = mix(indigo, violet, e1) * e1 * 0.26 + gold * e2 * 0.17;
    col *= surf;

    // Altın iç damarlar — ridged filamentler akışı izler (frekans motoru).
    // İşaretçi, damarların yönünü çok az kaydırır → "enerji yön değiştiriyor".
    float vf = fbm(vec2(ang * 3.0 + r * 2.0 - t * 1.5 + uPointer.x * 0.9, r * 9.0 + t * 0.5));
    float veins = pow(1.0 - abs(2.0 * vf - 1.0), 6.0);
    col += gold * veins * surf * 0.30;

    // İç yüzey dalgası — eş merkezli, dışa süzülen ince ripple.
    float ripple = smoothstep(0.6, 1.0, 0.5 + 0.5 * sin(r * 26.0 - uTime * 1.1));
    col += violet * ripple * (1.0 - r * 1.4) * 0.10;

    // Fresnel kenar — gerçek disk sınırından (alpha düşüşü) türetilir.
    vec2 dir = r > 0.0001 ? c / r : vec2(0.0);
    float aOut = texture2D(uTex, vUv + dir * 0.024).a;
    float rim = disc * (1.0 - aOut);
    col += mix(violet, gold, 0.5) * rim * 0.72;

    // Nefes — yavaş parlaklık dalgası.
    float breath = 0.84 + 0.16 * sin(uTime * 0.45);
    col *= breath;

    // İşaretçiye bağlı ışık süpürmesi (zarif).
    vec2 ld = normalize(vec2(-0.4, 0.5) + uPointer * 0.5);
    float spec = max(0.0, dot(dir, ld));
    col += gold * pow(spec, 4.0) * surf * 0.12;

    // Düz-alfa çıktı: parlaklık = kapsama. CSS 'screen' blend ile aya eklenir.
    float a = clamp(dot(col, vec3(0.36)) * 2.8, 0.0, 1.0);
    gl_FragColor = vec4(col, a);
  }
`;

function MoonEnergy() {
  const tex = useTexture("/moon/moon-real.png");
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const uniforms = useMemo(
    () => ({
      uTex: { value: tex },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    [tex],
  );

  // Kendi işaretçi takibi — canvas pointer-events:none olduğu için R3F global
  // pointer güncellenmez; window'dan okuruz. Normalize (-1..1), lerp ile yumuşak.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Transform değil uniform günceller (ucuz, GPU dostu).
  useFrame((_state, delta) => {
    const m = matRef.current;
    if (!m) return;
    const k = Math.min(1, delta * 3);
    pointer.current.x += (pointer.current.tx - pointer.current.x) * k;
    pointer.current.y += (pointer.current.ty - pointer.current.y) * k;
    (m.uniforms.uTime.value as number) += delta;
    (m.uniforms.uPointer.value as THREE.Vector2).set(pointer.current.x, pointer.current.y);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </ScreenQuad>
  );
}

export default function PortalMoon() {
  return (
    <div className="portal-moon-gl" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: false,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: "high-performance",
        }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <MoonEnergy />
        </Suspense>
      </Canvas>
    </div>
  );
}

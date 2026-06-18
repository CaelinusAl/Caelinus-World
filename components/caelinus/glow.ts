/**
 * glow.ts — Canvas tabanlı yumuşak ışık dokuları (procedural primitive YOK).
 *
 * Three.js sahnesinde kutu/silindir yerine, premium "soft glow" hissi için
 * canvas'ta üretilen radyal/çizgi/sis dokuları. Hepsi additive blend ile
 * kullanılır; Blender/Spline GLB assetleri gelene kadar geçici görsel dildir.
 *
 * Not: document'a eriştiği için yalnız client'ta (ssr:false sahne) çağrılır.
 */

import * as THREE from "three";

function makeCanvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Radyal yumuşak glow — portal yüzeyi, sis çekirdeği, partikül sprite'ı. */
export function radialTexture(stops: Array<[number, string]>, size = 256) {
  const c = makeCanvas(size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

/** Dikey ışık çizgisi — kemerin içindeki enerji eşiği "light lines". */
export function fadeBarTexture(color = "rgba(222,196,255,1)", size = 256) {
  const c = makeCanvas(size);
  const ctx = c.getContext("2d")!;
  // yatayda ince parlak bant
  const h = ctx.createLinearGradient(0, 0, size, 0);
  h.addColorStop(0.0, "rgba(0,0,0,0)");
  h.addColorStop(0.5, color);
  h.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = h;
  ctx.fillRect(0, 0, size, size);
  // dikeyde uçları sönümle
  ctx.globalCompositeOperation = "destination-in";
  const v = ctx.createLinearGradient(0, 0, 0, size);
  v.addColorStop(0.0, "rgba(0,0,0,0)");
  v.addColorStop(0.3, "rgba(255,255,255,1)");
  v.addColorStop(0.7, "rgba(255,255,255,1)");
  v.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

/** Yumuşak sis bulutu — yatay geniş, alttan yükselen atmosfer. */
export function mistTexture(color = "rgba(180,150,230,0.55)", size = 256) {
  const c = makeCanvas(size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, color);
  g.addColorStop(0.45, color.replace(/[\d.]+\)$/, "0.18)"));
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

"use client";

/**
 * CAELINUS — Portrait kompozisyon motoru (Phase 1A MVP, deterministik).
 *
 * Doğuş anında kullanıcının yüzünü, seçtiği tanrıçanın renk/sembol/ışık
 * DNA'sıyla ve district'in ortam frekansıyla harmanlayıp sinematik (3:4)
 * bir Portrait dataURL'i üretir. HARİCİ AI MODELİ GEREKTİRMEZ — saf canvas.
 * Gerçek üretim sağlayıcısı (gpt-image-1 / Replicate) ileride bu motorun
 * yerine kolayca takılabilir; sözleşme `composePortrait(input) → dataUrl`.
 *
 * Görsel DNA omurgası: mor alabaster + altın damar (locked-frame his),
 * tam ekran sinematik — asla "yuvarlak profil çerçevesi" değil.
 */

import {
  getGoddess,
  type GoddessId,
} from "@/data/goddess-archetypes";
import {
  getAvatarDistrict,
  type AvatarDistrictId,
} from "@/data/avatar-districts";
import type { BirthIntensity } from "./birth-types";

export interface ComposePortraitInput {
  faceDataUrl: string | null;
  goddess: GoddessId;
  district: AvatarDistrictId;
  intensity: BirthIntensity;
}

const OUT_W = 768;
const OUT_H = 1024;

/** Yoğunluk → arketip stilizasyon katmanının gücü (0..1). */
const INTENSITY_STRENGTH: Record<BirthIntensity, number> = {
  light: 0.34,
  balanced: 0.56,
  full: 0.82,
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mor alabaster + altın damar — ince marka mührü. */
function paintBrandVeins(
  ctx: CanvasRenderingContext2D,
  accent: string,
  strength: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.06 + strength * 0.06;
  ctx.lineWidth = 1.1;
  const veins = 5;
  for (let i = 0; i < veins; i++) {
    const x0 = (OUT_W / (veins + 1)) * (i + 1) + (i % 2 ? -40 : 40);
    const grad = ctx.createLinearGradient(x0, 0, x0 + 60, OUT_H);
    grad.addColorStop(0, withAlpha("#f4d58a", 0));
    grad.addColorStop(0.5, withAlpha("#f4d58a", 0.9));
    grad.addColorStop(1, withAlpha(accent, 0));
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x0, -20);
    ctx.bezierCurveTo(
      x0 + 70,
      OUT_H * 0.3,
      x0 - 70,
      OUT_H * 0.65,
      x0 + 24,
      OUT_H + 20
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Portre kompozisyonu üretir. Yüz verilirse onu merkez-üst alana yerleştirir
 * ve frekans katmanıyla sarar; yüz yoksa "doğmamış tanrıça" silüeti çizer.
 */
export async function composePortrait(
  input: ComposePortraitInput
): Promise<string> {
  const goddess = getGoddess(input.goddess);
  const district = getAvatarDistrict(input.district);
  const strength = INTENSITY_STRENGTH[input.intensity];
  const { primary, secondary, accent } = goddess.palette;

  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return input.faceDataUrl ?? "";

  /* 1) Zemin — tanrıça paleti + district tint dikey gradyan. */
  const bg = ctx.createLinearGradient(0, 0, 0, OUT_H);
  bg.addColorStop(0, secondary);
  bg.addColorStop(0.55, primary);
  bg.addColorStop(1, "#0d0a16");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, OUT_W, OUT_H);

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = district.tint;
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  ctx.restore();

  /* 2) Aura — arketip parıltısı (merkez-üst radyal). */
  const auraX = OUT_W / 2;
  const auraY = OUT_H * 0.42;
  const aura = ctx.createRadialGradient(
    auraX,
    auraY,
    20,
    auraX,
    auraY,
    OUT_W * 0.75
  );
  aura.addColorStop(0, withAlpha(accent, 0.35 + strength * 0.25));
  aura.addColorStop(0.5, withAlpha(primary, 0.18));
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  ctx.restore();

  /* 3) Yüz (varsa) — merkez-üst, yumuşak parıltı halkası içinde. */
  if (input.faceDataUrl) {
    try {
      const face = await loadImage(input.faceDataUrl);
      const fw = OUT_W * 0.62;
      const ratio = face.naturalHeight / Math.max(1, face.naturalWidth);
      const fh = fw * ratio;
      const fx = (OUT_W - fw) / 2;
      const fy = OUT_H * 0.16;

      // Halka parıltısı (yüzün arkasında)
      const ring = ctx.createRadialGradient(
        OUT_W / 2,
        fy + fh / 2,
        fw * 0.2,
        OUT_W / 2,
        fy + fh / 2,
        fw * 0.72
      );
      ring.addColorStop(0, withAlpha(accent, 0.5));
      ring.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = ring;
      ctx.fillRect(0, 0, OUT_W, OUT_H);
      ctx.restore();

      ctx.drawImage(face, fx, fy, fw, fh);

      // Frekans gizemi — yüz üstüne tanrıça tonu (yoğunluğa göre)
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = strength * 0.6;
      const faceTint = ctx.createLinearGradient(0, fy, 0, fy + fh);
      faceTint.addColorStop(0, withAlpha(accent, 0.7));
      faceTint.addColorStop(1, withAlpha(primary, 0.7));
      ctx.fillStyle = faceTint;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.restore();

      // Soğuk/sıcak rim — district ışık imzası
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.25 + strength * 0.2;
      const rim = ctx.createLinearGradient(fx, 0, fx + fw, 0);
      rim.addColorStop(0, withAlpha(accent, 0.6));
      rim.addColorStop(0.5, "rgba(0,0,0,0)");
      rim.addColorStop(1, withAlpha(district.accent, 0.6));
      ctx.fillStyle = rim;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.restore();
    } catch {
      /* yüz yüklenemezse silüete düş */
      paintSilhouette(ctx, accent, strength);
    }
  } else {
    paintSilhouette(ctx, accent, strength);
  }

  /* 4) Sembol — tanrıça işareti, alt-merkez, ışıyan. */
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.5 + strength * 0.35;
  ctx.fillStyle = withAlpha(accent, 0.9);
  ctx.font = `${Math.round(OUT_W * 0.22)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = withAlpha(accent, 0.9);
  ctx.shadowBlur = 40;
  ctx.fillText(goddess.symbolGlyph, OUT_W / 2, OUT_H * 0.8);
  ctx.restore();

  /* 5) Marka damarları + vinyet. */
  paintBrandVeins(ctx, accent, strength);

  const vig = ctx.createRadialGradient(
    OUT_W / 2,
    OUT_H * 0.44,
    OUT_W * 0.3,
    OUT_W / 2,
    OUT_H * 0.55,
    OUT_H * 0.75
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, district.vignette);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, OUT_W, OUT_H);

  try {
    return canvas.toDataURL("image/webp", 0.92);
  } catch {
    return canvas.toDataURL("image/png");
  }
}

/** Yüz yoksa — "doğmamış tanrıça" silüeti. */
function paintSilhouette(
  ctx: CanvasRenderingContext2D,
  accent: string,
  strength: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const cx = OUT_W / 2;
  const headY = OUT_H * 0.3;
  const grad = ctx.createRadialGradient(cx, headY, 10, cx, headY, OUT_W * 0.4);
  grad.addColorStop(0, withAlpha(accent, 0.5 + strength * 0.2));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;

  // baş
  ctx.beginPath();
  ctx.ellipse(cx, headY, OUT_W * 0.13, OUT_W * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // omuz/gövde
  ctx.beginPath();
  ctx.moveTo(cx - OUT_W * 0.26, OUT_H * 0.62);
  ctx.quadraticCurveTo(cx, OUT_H * 0.4, cx + OUT_W * 0.26, OUT_H * 0.62);
  ctx.lineTo(cx + OUT_W * 0.22, OUT_H * 0.72);
  ctx.lineTo(cx - OUT_W * 0.22, OUT_H * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

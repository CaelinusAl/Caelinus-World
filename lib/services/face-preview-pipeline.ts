/**
 * Client-side face preview: center-weighted elliptical crop + quality heuristics.
 * No ML — swap for real detector later; persist `boundingBoxNorm` for rehydrate.
 */

import type { FaceAnalysis, FacePreviewResult } from "./ai-types";
import { UPLOAD_CONSTRAINTS } from "./ai-types";

function uid(): string {
  return `fp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gorsel yuklenemedi"));
    img.src = src;
  });
}

function centerVarianceScore(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): number {
  const cw = Math.max(32, Math.floor(w * 0.4));
  const ch = Math.max(32, Math.floor(h * 0.4));
  const sx = Math.floor((w - cw) / 2);
  const sy = Math.floor((h - ch) / 2);
  const data = ctx.getImageData(sx, sy, cw, ch).data;
  let sum = 0;
  let sumSq = 0;
  const n = cw * ch;
  for (let i = 0; i < data.length; i += 4) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += y;
    sumSq += y * y;
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

/**
 * Tight face box for a typical selfie: face occupies center 42% width, 45% height,
 * starting ~15% from top (forehead). Tighter than before for avatar head fit.
 */
function defaultFaceBox(imgW: number, imgH: number) {
  const w = imgW * 0.42;
  const h = imgH * 0.45;
  const x = (imgW - w) / 2;
  const y = imgH * 0.12;
  return { x, y, w, h };
}

function buildLandmarks(
  box: { x: number; y: number; w: number; h: number }
): FaceAnalysis["landmarks"] {
  const { x, y, w, h } = box;
  return {
    leftEye: [x + w * 0.32, y + h * 0.36],
    rightEye: [x + w * 0.68, y + h * 0.36],
    nose: [x + w * 0.5, y + h * 0.55],
    mouthLeft: [x + w * 0.38, y + h * 0.74],
    mouthRight: [x + w * 0.62, y + h * 0.74],
  };
}

/**
 * Draw the cropped face with soft elliptical vignette so it blends into the avatar.
 */
function drawWithEllipticalFade(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number
) {
  ctx.save();
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  const cx = dw / 2;
  const cy = dh / 2;
  const rx = dw / 2;
  const ry = dh / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.55, "rgba(0,0,0,0)");
  grad.addColorStop(0.85, "rgba(0,0,0,0.6)");
  grad.addColorStop(1.0, "rgba(0,0,0,1)");

  ctx.save();
  ctx.setTransform(rx, 0, 0, ry, cx, cy);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export async function runFacePreviewPipeline(imageUrl: string): Promise<FacePreviewResult> {
  try {
    const img = await loadImageElement(imageUrl);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    if (iw < UPLOAD_CONSTRAINTS.minWidth || ih < UPLOAD_CONSTRAINTS.minHeight) {
      return {
        id: uid(),
        previewUrl: "",
        analysis: { faceDetected: false, confidence: 0 },
        status: "low_quality",
        message: `Gorsel cok kucuk (min ${UPLOAD_CONSTRAINTS.minWidth}px).`,
      };
    }

    const probe = document.createElement("canvas");
    probe.width = Math.min(128, iw);
    probe.height = Math.min(128, ih);
    const pctx = probe.getContext("2d");
    if (!pctx) {
      return {
        id: uid(),
        previewUrl: "",
        analysis: { faceDetected: false, confidence: 0 },
        status: "low_quality",
        message: "Canvas kullanilamadi.",
      };
    }
    pctx.drawImage(img, 0, 0, probe.width, probe.height);
    const variance = centerVarianceScore(pctx, probe.width, probe.height);
    if (variance < 12) {
      return {
        id: uid(),
        previewUrl: "",
        analysis: { faceDetected: false, confidence: 0 },
        status: "no_face",
        message: "Net bir yuz alani algilanamadi. Daha aydinlik, tek kisilik bir selfie deneyin.",
      };
    }

    const box = defaultFaceBox(iw, ih);
    const maxOut = 512;
    const scale = Math.min(1, maxOut / Math.max(box.w, box.h));
    const outW = Math.max(64, Math.round(box.w * scale));
    const outH = Math.max(64, Math.round(box.h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        id: uid(),
        previewUrl: "",
        analysis: { faceDetected: false, confidence: 0 },
        status: "low_quality",
        message: "Onizleme olusturulamadi.",
      };
    }

    drawWithEllipticalFade(ctx, img, box.x, box.y, box.w, box.h, outW, outH);

    const analysis: FaceAnalysis = {
      faceDetected: true,
      boundingBox: { x: box.x, y: box.y, w: box.w, h: box.h },
      boundingBoxNorm: {
        x: box.x / iw,
        y: box.y / ih,
        w: box.w / iw,
        h: box.h / ih,
      },
      landmarks: buildLandmarks(box),
      confidence: Math.min(0.98, 0.55 + Math.min(variance / 200, 0.4)),
    };

    const previewUrl = canvas.toDataURL("image/png");

    return {
      id: uid(),
      previewUrl,
      analysis,
      status: "success",
      message: "Yuz bolgesi hazir.",
    };
  } catch {
    return {
      id: uid(),
      previewUrl: "",
      analysis: { faceDetected: false, confidence: 0 },
      status: "low_quality",
      message: "Gorsel islenemedi. URL veya CORS kontrol edin.",
    };
  }
}

/** Rebuild face texture from original upload URL + saved normalized crop */
export async function buildFaceTextureDataUrl(
  imageUrl: string,
  norm: { x: number; y: number; w: number; h: number },
  maxSide = 512
): Promise<string | null> {
  try {
    const img = await loadImageElement(imageUrl);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const x = norm.x * iw;
    const y = norm.y * ih;
    const w = norm.w * iw;
    const h = norm.h * ih;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const outW = Math.max(32, Math.round(w * scale));
    const outH = Math.max(32, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    drawWithEllipticalFade(ctx, img, x, y, w, h, outW, outH);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

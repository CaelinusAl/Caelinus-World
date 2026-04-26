/**
 * Face crop pipeline — uses MediaPipe for detection, falls back to heuristic.
 * Returns a PNG data URL with elliptical soft edges + the detection result.
 */

import { detectFace, type FaceDetectionResult } from "./mediapipe-face";

export type CropResult = {
  dataUrl: string;
  detection: FaceDetectionResult;
};

const OUT_SIZE = 512;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function ellipticalMask(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  const cx = w / 2;
  const cy = h / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.58, "rgba(0,0,0,0)");
  grad.addColorStop(0.86, "rgba(0,0,0,0.65)");
  grad.addColorStop(1.0, "rgba(0,0,0,1)");

  ctx.save();
  ctx.setTransform(cx, 0, 0, cy, cx, cy);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Detect + crop face from any image URL (blob:, data:, http:).
 * Returns data URL + detection metadata, or null on failure.
 */
export async function cropFaceFromUrl(
  imageUrl: string
): Promise<CropResult | null> {
  try {
    const img = await loadImage(imageUrl);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (iw < 48 || ih < 48) return null;

    const detection = await detectFace(img);

    const bbox = detection.detected
      ? detection.bbox
      : { x: 0.2, y: 0.05, w: 0.6, h: 0.65 };

    const sx = bbox.x * iw;
    const sy = bbox.y * ih;
    const sw = bbox.w * iw;
    const sh = bbox.h * ih;

    const aspect = sw / sh;
    const outW = aspect >= 1 ? OUT_SIZE : Math.round(OUT_SIZE * aspect);
    const outH = aspect >= 1 ? Math.round(OUT_SIZE / aspect) : OUT_SIZE;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    ellipticalMask(ctx, outW, outH);

    return {
      dataUrl: canvas.toDataURL("image/png"),
      detection,
    };
  } catch {
    return null;
  }
}

/**
 * analyzeSelfie — tarayıcı-içi tam selfie analizi.
 *
 * Eski RunPod Python worker'ının (`runpod/face-analyze/`) bire bir
 * tarayıcı eşdeğeri. Selfie CİHAZDAN ÇIKMADAN şunları üretir:
 *   • 478 landmark (MediaPipe Tasks Vision, GPU-hızlandırmalı)
 *   • Yüz şekli (oval / round / heart / square / long)
 *   • Yanak ten tonu + saç bölgesi rengi
 *   • Avatar-deform için oran metrikleri
 *
 * Çıktı `SelfieAnalysis` — backend job pipeline'ı bunu olduğu gibi
 * tüketir (artık sunucu tarafı MediaPipe/RunPod çağrısı YOK).
 *
 * SADECE tarayıcıda çalışır (Image + canvas gerektirir).
 */

import type { SelfieAnalysis, SelfieInput } from "../caelinus-ai/types";
import { detectFace, type FaceLandmark } from "../mediapipe-face";
import { sampleHairColor, sampleSkinTone, type NormBBox } from "./color-sample";
import { extractFaceMetrics } from "./extract-metrics";
import { classifyFaceShape, extractShapeMetrics } from "./shape";

/** dataUrl / blob URL → yüklenmiş HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Selfie görüntüsü yüklenemedi."));
    img.decoding = "async";
    img.src = src;
  });
}

/** Landmark sınırlarından ham (padding'siz) bbox — renk örneklemesi için. */
function rawBBoxFromLandmarks(lms: FaceLandmark[]): NormBBox {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const l of lms) {
    if (l.x < minX) minX = l.x;
    if (l.y < minY) minY = l.y;
    if (l.x > maxX) maxX = l.x;
    if (l.y > maxY) maxY = l.y;
  }
  return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
}

/** Görüntüyü canvas'a çizip RGBA piksel verisini al. */
function readPixels(
  img: HTMLImageElement,
): { data: Uint8ClampedArray; W: number; H: number } | null {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  if (W === 0 || H === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, W, H);
  try {
    return { data: ctx.getImageData(0, 0, W, H).data, W, H };
  } catch {
    // Cross-origin taint vb. — renk örneklemesini atla, geometri yine çalışır.
    return null;
  }
}

/**
 * Selfie'yi analiz et. Yüz bulunamazsa `{ detected: false }` döner;
 * pipeline bunu kullanıcı-dostu mesaja çevirir.
 */
export async function analyzeSelfie(
  selfie: SelfieInput,
  options: { sampleColors?: boolean } = {},
): Promise<SelfieAnalysis> {
  const sampleColors = options.sampleColors ?? true;

  let img: HTMLImageElement;
  try {
    img = await loadImage(selfie.dataUrl);
  } catch {
    return { detected: false };
  }

  const detection = await detectFace(img);
  if (!detection.detected || detection.landmarks.length < 100) {
    return { detected: false, landmarkCount: detection.landmarks.length };
  }

  const lms = detection.landmarks;

  // Yüz şekli — ham geometrik ölçüler + heuristik sınıflandırma.
  const shapeMetrics = extractShapeMetrics(lms);
  const faceShape = shapeMetrics ? classifyFaceShape(shapeMetrics) : "oval";

  // Avatar-deform için oran metrikleri (mevcut pipeline bunu bekliyor).
  const deform = extractFaceMetrics(lms);

  const analysis: SelfieAnalysis = {
    detected: true,
    landmarkCount: lms.length,
    faceShape,
    rawMetrics: {
      ...(deform
        ? {
            faceWidthRatio: deform.faceWidthRatio,
            jawWidthRatio: deform.jawWidthRatio,
            chinLengthRatio: deform.chinLengthRatio,
            eyeSpacingRatio: deform.eyeSpacingRatio,
            eyeSizeRatio: deform.eyeSizeRatio,
            noseWidthRatio: deform.noseWidthRatio,
            mouthWidthRatio: deform.mouthWidthRatio,
            eyebrowHeightRatio: deform.eyebrowHeightRatio,
            faceLengthNorm: deform.faceLengthNorm,
          }
        : {}),
      ...(shapeMetrics
        ? {
            faceLength: shapeMetrics.faceLength,
            faceWidth: shapeMetrics.faceWidth,
            jawWidth: shapeMetrics.jawWidth,
            foreheadWidth: shapeMetrics.foreheadWidth,
            cheekboneWidth: shapeMetrics.cheekboneWidth,
          }
        : {}),
    },
  };

  if (sampleColors) {
    const px = readPixels(img);
    if (px) {
      const bbox = rawBBoxFromLandmarks(lms);
      analysis.estimatedSkinTone = sampleSkinTone(px.data, px.W, px.H, bbox);
      analysis.estimatedHairColor = sampleHairColor(px.data, px.W, px.H, bbox);
    }
  }

  return analysis;
}

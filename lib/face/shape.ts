/**
 * Face-shape classifier — browser-side port of the former RunPod Python
 * worker (`runpod/face-analyze/face_analyzer.py`). Same landmark indices,
 * same heuristic → bire bir aynı sonuç, ama selfie cihazdan çıkmadan.
 *
 * Tamamen deterministic: aynı landmark seti her zaman aynı sınıfı verir.
 */

import type { FaceShape } from "../caelinus-ai/types";
import { LM, dist2d } from "./landmarks";
import type { FaceLandmark } from "./types";

/**
 * Yüz şekli sınıflandırması için ham (normalize 0-1) genişlik/uzunluk
 * ölçüleri. `extractFaceMetrics`'ten farklı: o avatar-deform için oran
 * üretir; bu modül Python worker'ın `FaceMetrics` sözleşmesini taşır.
 */
export type FaceShapeMetrics = {
  faceLength: number;
  faceWidth: number;
  jawWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
};

/**
 * 478 landmark'tan yüz-şekli ölçülerini çıkar. Python'daki
 * `_metrics_from_landmarks` ile birebir aynı indeksler.
 */
export function extractShapeMetrics(
  lms: FaceLandmark[],
): FaceShapeMetrics | null {
  if (lms.length < 400) return null;
  const get = (i: number) => lms[i];

  return {
    faceLength: dist2d(get(LM.foreheadTop), get(LM.chinBottom)),
    faceWidth: dist2d(get(LM.leftTemple), get(LM.rightTemple)),
    jawWidth: dist2d(get(LM.leftJawAngle), get(LM.rightJawAngle)),
    foreheadWidth: dist2d(get(LM.leftForehead), get(LM.rightForehead)),
    cheekboneWidth: dist2d(get(LM.leftCheek), get(LM.rightCheek)),
  };
}

/**
 * 5 sınıf: oval / round / heart / square / long.
 *
 * Port of `classify_face_shape` — eşik değerleri Python ile aynı tutuldu.
 */
export function classifyFaceShape(m: FaceShapeMetrics): FaceShape {
  const { faceLength: fl, faceWidth: fw } = m;
  if (fl <= 0 || fw <= 0) return "oval";

  const ratio = fl / fw; // uzun / yuvarlak ekseni
  const foreheadToJaw = m.jawWidth > 0 ? m.foreheadWidth / m.jawWidth : 1.0;
  const cheekToJaw = m.jawWidth > 0 ? m.cheekboneWidth / m.jawWidth : 1.0;

  if (ratio > 1.45) return "long";
  if (ratio < 1.12) {
    // kare ile yuvarlak ayrımı: çenenin keskinliği
    if (cheekToJaw < 1.05 && foreheadToJaw < 1.05) return "square";
    return "round";
  }
  // 1.12-1.45 arası: oval ya da heart
  if (foreheadToJaw > 1.18) return "heart";
  return "oval";
}

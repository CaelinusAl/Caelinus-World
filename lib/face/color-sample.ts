/**
 * Skin-tone & hair-color sampling — browser-side port of the former
 * RunPod Python worker (`face_analyzer.py` → `sample_skin_tone` /
 * `sample_hair_color`). Aynı ofsetler, aynı patch-ortalama mantığı.
 *
 * Python piksel okumayı NumPy ile yapıyordu; tarayıcıda eşdeğeri
 * canvas `ImageData` (RGBA, satır-major). Bu modül saf hesap — DOM'a
 * dokunmaz; çağıran taraf `ImageData`'yı verir.
 *
 * NOT: bbox burada **ham** (landmark sınırları, padding'siz) beklenir —
 * tıpkı Python'da olduğu gibi. `detectFace` padding'li bbox döndürür,
 * o yüzden `analyzeSelfie` renk örneklemesi için ham bbox'ı kendi
 * hesaplar.
 */

import type { ColorHex } from "../caelinus-ai/types";

export type NormBBox = { x: number; y: number; w: number; h: number };

/** Nötr ten tonu fallback — yüz çok kenarda / patch boşsa. */
const NEUTRAL_FALLBACK: readonly [number, number, number] = [200, 180, 165];

function toHex(r: number, g: number, b: number): ColorHex {
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Merkez (cx, cy) etrafında (w×h) piksel kutusunun RGB ortalaması.
 * Sınır dışı klipslenir; kutu boşsa nötr ton döner.
 * Port of Python `_sample_avg`.
 */
function sampleAvg(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
): readonly [number, number, number] {
  const x0 = Math.max(0, Math.floor(cx - w / 2));
  const y0 = Math.max(0, Math.floor(cy - h / 2));
  const x1 = Math.min(W, x0 + w);
  const y1 = Math.min(H, y0 + h);
  if (x1 <= x0 || y1 <= y0) return NEUTRAL_FALLBACK;

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    let idx = (y * W + x0) * 4;
    for (let x = x0; x < x1; x++) {
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      idx += 4;
      n++;
    }
  }
  if (n === 0) return NEUTRAL_FALLBACK;
  return [Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)];
}

/**
 * Yanak ten tonu — Python `sample_skin_tone` ile aynı ofsetler.
 * Yüz kutusunun sol-yanak bölgesinden örnekler.
 */
export function sampleSkinTone(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  bbox: NormBBox,
): ColorHex {
  const cx = Math.round((bbox.x + bbox.w * 0.35) * W);
  const cy = Math.round((bbox.y + bbox.h * 0.55) * H);
  const size = Math.max(8, Math.round(bbox.w * W * 0.06));
  const [r, g, b] = sampleAvg(data, W, H, cx, cy, size, size);
  return toHex(r, g, b);
}

/**
 * Saç bölgesi rengi — Python `sample_hair_color` ile aynı ofsetler.
 * Yüz kutusunun hemen üstünden (alın üstü / saç çizgisi) örnekler.
 */
export function sampleHairColor(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  bbox: NormBBox,
): ColorHex {
  const cx = Math.round((bbox.x + bbox.w * 0.5 - 0.05) * W);
  const cy = Math.max(0, Math.round((bbox.y - 0.05) * H));
  const sw = Math.max(8, Math.round(bbox.w * W * 0.06));
  const sh = Math.max(8, Math.min(sw, Math.round(bbox.h * H * 0.06)));
  const [r, g, b] = sampleAvg(data, W, H, cx, cy, sw, sh);
  return toHex(r, g, b);
}

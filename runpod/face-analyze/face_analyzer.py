"""
Caelinus AI — Face analyzer.

MediaPipe Tasks Vision (Apache 2.0) + saf NumPy renkler ile selfie'den:
  • 478 face landmark
  • Yüz şekli (oval / round / heart / square / long)
  • Yanak ten tonu (cheek skin tone)
  • Saç bölgesi rengi (forehead'in üstü)
  • Bbox + landmark count

Bu modül browser-side `lib/face.ts` + `lib/mediapipe-face.ts` mantığının
sunucu tarafı eşdeğeri. Aynı sözleşmeyi koruyor — runner'ın
SelfieAnalysis tipine bire bir map'leniyor.

KRİTİK kurallar:
  • Tamamen deterministic — aynı selfie için aynı sonuç (cache anlamlı).
  • Hiçbir model dosyası kod içinde gömülü değil; container build sırasında
    `face_landmarker.task` indirilir.
  • Hata olursa exception fırlatma — `{ "detected": False, "reason": ... }`
    döndür. Üst katman bunu user-friendly mesaja çevirir.
"""

from __future__ import annotations

import base64
import io
from dataclasses import dataclass
from typing import Any, Optional

import numpy as np
from PIL import Image

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

# ──────────────────────────────────────────────────────────────────────────
# Singleton FaceLandmarker — container start'ta bir kere yükle
# ──────────────────────────────────────────────────────────────────────────

_LANDMARKER: Optional[mp_vision.FaceLandmarker] = None
_MODEL_PATH = "/app/models/face_landmarker.task"


def _get_landmarker() -> mp_vision.FaceLandmarker:
    global _LANDMARKER
    if _LANDMARKER is None:
        base_options = mp_python.BaseOptions(model_asset_path=_MODEL_PATH)
        options = mp_vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            running_mode=mp_vision.RunningMode.IMAGE,
        )
        _LANDMARKER = mp_vision.FaceLandmarker.create_from_options(options)
    return _LANDMARKER


# ──────────────────────────────────────────────────────────────────────────
# Yardımcı tipler
# ──────────────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class BBox:
    x: float
    y: float
    w: float
    h: float


@dataclass(frozen=True)
class FaceMetrics:
    face_length: float
    face_width: float
    jaw_width: float
    forehead_width: float
    cheekbone_width: float


# ──────────────────────────────────────────────────────────────────────────
# Image decode
# ──────────────────────────────────────────────────────────────────────────


def decode_image(image_b64: str) -> np.ndarray:
    """Base64 (data URL veya çıplak) → RGB numpy array (H, W, 3) uint8."""
    if image_b64.startswith("data:"):
        # "data:image/png;base64,..." → ham base64
        _, _, image_b64 = image_b64.partition(",")
    raw = base64.b64decode(image_b64, validate=False)
    img = Image.open(io.BytesIO(raw))
    img = img.convert("RGB")
    return np.array(img, dtype=np.uint8)


# ──────────────────────────────────────────────────────────────────────────
# MediaPipe → bbox + metrics
# ──────────────────────────────────────────────────────────────────────────

# Face landmark indeksleri (MediaPipe Tasks Vision standardı):
#   • Çene ucu:    152
#   • Saç çizgisi: 10
#   • Sol şakak:   234
#   • Sağ şakak:   454
#   • Alın sol:    103
#   • Alın sağ:    332
#   • Çene sol:    172
#   • Çene sağ:    397
#   • Yanak sol:   116
#   • Yanak sağ:   345

_LANDMARK_IDX = {
    "chin": 152,
    "hairline": 10,
    "temple_left": 234,
    "temple_right": 454,
    "forehead_left": 103,
    "forehead_right": 332,
    "jaw_left": 172,
    "jaw_right": 397,
    "cheek_left": 116,
    "cheek_right": 345,
}


def _bbox_from_landmarks(landmarks: list[Any]) -> BBox:
    xs = [lm.x for lm in landmarks]
    ys = [lm.y for lm in landmarks]
    x0, x1 = min(xs), max(xs)
    y0, y1 = min(ys), max(ys)
    return BBox(x=x0, y=y0, w=max(0.0, x1 - x0), h=max(0.0, y1 - y0))


def _metrics_from_landmarks(landmarks: list[Any]) -> FaceMetrics:
    def pt(name: str) -> tuple[float, float]:
        idx = _LANDMARK_IDX[name]
        lm = landmarks[idx]
        return (lm.x, lm.y)

    chin = pt("chin")
    hairline = pt("hairline")
    tl = pt("temple_left")
    tr = pt("temple_right")
    fl = pt("forehead_left")
    fr = pt("forehead_right")
    jl = pt("jaw_left")
    jr = pt("jaw_right")
    cl = pt("cheek_left")
    cr = pt("cheek_right")

    face_length = abs(chin[1] - hairline[1])
    face_width = abs(tr[0] - tl[0])
    jaw_width = abs(jr[0] - jl[0])
    forehead_width = abs(fr[0] - fl[0])
    cheekbone_width = abs(cr[0] - cl[0])

    return FaceMetrics(
        face_length=face_length,
        face_width=face_width,
        jaw_width=jaw_width,
        forehead_width=forehead_width,
        cheekbone_width=cheekbone_width,
    )


# ──────────────────────────────────────────────────────────────────────────
# Face shape classifier — heuristic (tam aynı browser tarafı)
# ──────────────────────────────────────────────────────────────────────────


def classify_face_shape(metrics: FaceMetrics) -> str:
    """5 sınıf: oval / round / heart / square / long."""
    fl, fw = metrics.face_length, metrics.face_width
    if fl <= 0 or fw <= 0:
        return "oval"

    ratio = fl / fw  # uzun/yuvarlak ekseni
    forehead_to_jaw = (
        metrics.forehead_width / metrics.jaw_width
        if metrics.jaw_width > 0
        else 1.0
    )
    cheek_to_jaw = (
        metrics.cheekbone_width / metrics.jaw_width
        if metrics.jaw_width > 0
        else 1.0
    )

    if ratio > 1.45:
        return "long"
    if ratio < 1.12:
        # kare ile yuvarlak ayrımı: çenenin keskinliği
        if cheek_to_jaw < 1.05 and forehead_to_jaw < 1.05:
            return "square"
        return "round"
    # 1.12-1.45 arası: oval ya da heart
    if forehead_to_jaw > 1.18:
        return "heart"
    return "oval"


# ──────────────────────────────────────────────────────────────────────────
# Renk örnekleme — yanak ve saç bölgesi
# ──────────────────────────────────────────────────────────────────────────


def _to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def _sample_avg(
    img: np.ndarray, cx: int, cy: int, w: int, h: int
) -> tuple[int, int, int]:
    """Bbox merkezindeki piksel ortalamasını al, sınırlar dışını klipsle."""
    H, W, _ = img.shape
    x0 = max(0, cx - w // 2)
    y0 = max(0, cy - h // 2)
    x1 = min(W, x0 + w)
    y1 = min(H, y0 + h)
    if x1 <= x0 or y1 <= y0:
        return (200, 180, 165)  # nötr ten tonu fallback
    patch = img[y0:y1, x0:x1, :]
    avg = patch.reshape(-1, 3).mean(axis=0)
    return (int(avg[0]), int(avg[1]), int(avg[2]))


def sample_skin_tone(img: np.ndarray, bbox: BBox) -> str:
    H, W, _ = img.shape
    cx = int((bbox.x + bbox.w * 0.35) * W)
    cy = int((bbox.y + bbox.h * 0.55) * H)
    size = max(8, int(bbox.w * W * 0.06))
    return _to_hex(_sample_avg(img, cx, cy, size, size))


def sample_hair_color(img: np.ndarray, bbox: BBox) -> str:
    H, W, _ = img.shape
    cx = int((bbox.x + bbox.w * 0.5 - 0.05) * W)
    cy = max(0, int((bbox.y - 0.05) * H))
    sw = max(8, int(bbox.w * W * 0.06))
    sh = max(8, min(sw, int(bbox.h * H * 0.06)))
    return _to_hex(_sample_avg(img, cx, cy, sw, sh))


# ──────────────────────────────────────────────────────────────────────────
# Public API — RunPod handler buradan çağırır
# ──────────────────────────────────────────────────────────────────────────


def analyze(
    image_b64: str,
    *,
    sample_colors: bool = True,
) -> dict:
    """
    Tek seferlik selfie analizi.

    Dönen sözlük browser-side `SelfieAnalysis` tipiyle birebir uyumlu:
      {
        "detected": bool,
        "landmarkCount": int,
        "faceShape": "oval"|"round"|"heart"|"square"|"long",
        "estimatedSkinTone": "#rrggbb",
        "estimatedHairColor": "#rrggbb",
        "rawMetrics": { ... },
        "bbox": { "x":..,"y":..,"w":..,"h":.. }
      }

    Hata durumunda `{ "detected": False, "reason": "..." }` döner.
    """
    try:
        img = decode_image(image_b64)
    except Exception as e:
        return {"detected": False, "reason": f"image_decode_failed: {e}"}

    landmarker = _get_landmarker()
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)

    try:
        result = landmarker.detect(mp_image)
    except Exception as e:
        return {"detected": False, "reason": f"mediapipe_failed: {e}"}

    if not result.face_landmarks or len(result.face_landmarks) == 0:
        return {"detected": False, "reason": "no_face_detected"}

    landmarks = result.face_landmarks[0]
    if len(landmarks) < 100:
        return {"detected": False, "reason": "insufficient_landmarks"}

    bbox = _bbox_from_landmarks(landmarks)
    metrics = _metrics_from_landmarks(landmarks)
    face_shape = classify_face_shape(metrics)

    out: dict = {
        "detected": True,
        "landmarkCount": len(landmarks),
        "faceShape": face_shape,
        "rawMetrics": {
            "faceLength": metrics.face_length,
            "faceWidth": metrics.face_width,
            "jawWidth": metrics.jaw_width,
            "foreheadWidth": metrics.forehead_width,
            "cheekboneWidth": metrics.cheekbone_width,
        },
        "bbox": {"x": bbox.x, "y": bbox.y, "w": bbox.w, "h": bbox.h},
    }

    if sample_colors:
        out["estimatedSkinTone"] = sample_skin_tone(img, bbox)
        out["estimatedHairColor"] = sample_hair_color(img, bbox)

    return out

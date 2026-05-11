"""
Caelinus AI — RunPod Serverless handler entry point.

RunPod serverless container'ı her job için bu modülü çağırır:
  job = { "input": { "image_b64": "...", "options": {...} } }
  return = { ...analysis... } | { "error": "..." }

Cold start: ~3-6sn (model yükleme + ilk MediaPipe çağrısı)
Warm call:  ~0.3-0.8sn (saf inference)

Çağrı sözleşmesi (Node-side `runpod-client.ts` ile uyumlu):
  POST https://api.runpod.ai/v2/<endpoint-id>/runsync
    Authorization: Bearer <RUNPOD_API_KEY>
    {
      "input": {
        "image_b64": "data:image/jpeg;base64,...",
        "options": { "sample_colors": true }
      }
    }
"""

from __future__ import annotations

import time
import traceback
from typing import Any

import runpod  # type: ignore[import-not-found]

from face_analyzer import analyze


def handler(job: dict[str, Any]) -> dict[str, Any]:
    """RunPod serverless entry point."""
    started = time.time()
    job_input = job.get("input") or {}

    image_b64 = job_input.get("image_b64")
    if not isinstance(image_b64, str) or not image_b64:
        return {
            "error": "missing_input",
            "message": "input.image_b64 zorunlu (data URL veya çıplak base64).",
        }

    options = job_input.get("options") or {}
    sample_colors = bool(options.get("sample_colors", True))

    try:
        result = analyze(image_b64, sample_colors=sample_colors)
    except Exception as e:
        # Beklenmeyen hata — RunPod log'una stack trace bırak
        traceback.print_exc()
        return {
            "error": "analysis_failed",
            "message": str(e),
        }

    result["_meta"] = {
        "elapsed_ms": int((time.time() - started) * 1000),
        "version": "0.1.0",
        "engine": "mediapipe-tasks-vision",
    }
    return result


# RunPod serverless'ı modül düzeyinde başlat — RunPod'un GitHub scanner'ı
# bu çağrıyı static AST taraması ile bulabilsin. Container CMD bu modülü
# çalıştırdığında otomatik olarak event loop başlar.
runpod.serverless.start({"handler": handler})

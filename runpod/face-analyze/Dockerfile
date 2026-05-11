# ──────────────────────────────────────────────────────────────────────────
# Caelinus AI — RunPod face-analyze worker
# ──────────────────────────────────────────────────────────────────────────
# MediaPipe Tasks Vision CPU-only çalışır. RunPod serverless'da
# CPU5 / 2 vCPU / 4 GB RAM yeterli ($0.0000233/s ≈ saatte $0.08).
#
# Build context: runpod/face-analyze/  (sadece bu klasör — repo root değil!)
# RunPod GitHub auto-build bu Dockerfile'ı bulur ve image üretir.
# ──────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# Sistem bağımlılıkları:
#   • libgl1, libglib2.0-0, libsm6, libxext6, libxrender1 → MediaPipe runtime
#   • ca-certificates → HTTPS (urllib model indirme için)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Önce requirements'ı kopyala → Docker layer cache hit oranını artırır.
# pip install başarısız olursa logta net görünür.
COPY requirements.txt /app/requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip \
 && python -m pip install --no-cache-dir -r requirements.txt \
 && python -c "import runpod, mediapipe, PIL, numpy; print('deps ok')"

# MediaPipe face landmarker model dosyasını build sırasında indir.
# stdlib urllib ile — wget binary dependency yok, build daha hızlı.
# Apache 2.0 lisanslı resmi Google bucket.
RUN python -c "import urllib.request, os; \
    os.makedirs('/app/models', exist_ok=True); \
    url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'; \
    urllib.request.urlretrieve(url, '/app/models/face_landmarker.task'); \
    size = os.path.getsize('/app/models/face_landmarker.task'); \
    assert size > 1000000, f'model too small: {size} bytes'; \
    print(f'model downloaded: {size} bytes')"

# Uygulama kodu
COPY handler.py        /app/handler.py
COPY face_analyzer.py  /app/face_analyzer.py

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MEDIAPIPE_DISABLE_GPU=1

# RunPod serverless entry — modül düzeyinde runpod.serverless.start() var,
# Python başladığı an event loop kuruluyor.
CMD ["python", "-u", "/app/handler.py"]

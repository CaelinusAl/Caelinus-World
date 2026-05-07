# ──────────────────────────────────────────────────────────────────────────
# Caelinus AI — RunPod face-analyze worker
# ──────────────────────────────────────────────────────────────────────────
# MediaPipe sadece CPU kullanır — RunPod serverless'da en ucuz GPU instance
# (RTX 4000 Ada / A4000) yeterli, GPU idle kalır ama kabul edilebilir.
#
# Build context: caelinus/runpod/face-analyze/
# RunPod GitHub auto-build bu Dockerfile'ı bulur ve image üretir.
# ──────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# Sistem bağımlılıkları — Pillow JPG/PNG, MediaPipe (libgl, libglib)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Önce requirements'ı kopyala — Docker layer cache hit oranını artırır
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# MediaPipe model dosyasını build sırasında indir — runtime'da cold start
# uzamasın. Model checksum sabit; Apache 2.0 lisansla geliyor.
RUN mkdir -p /app/models \
 && wget -q -O /app/models/face_landmarker.task \
    https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task \
 && test -s /app/models/face_landmarker.task

# Uygulama kodu
COPY handler.py        /app/handler.py
COPY face_analyzer.py  /app/face_analyzer.py

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MEDIAPIPE_DISABLE_GPU=1

# RunPod serverless girişi
CMD ["python", "-u", "handler.py"]

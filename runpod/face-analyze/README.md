# Caelinus AI — RunPod Face-Analyze Worker

> Sprint S2 deliverable. MediaPipe Tasks Vision tabanlı serverless yüz analizi.

## Ne yapıyor?

Selfie (base64) alır, döndürür:

```json
{
  "detected": true,
  "landmarkCount": 478,
  "faceShape": "oval",
  "estimatedSkinTone": "#d4ad8a",
  "estimatedHairColor": "#1a1410",
  "rawMetrics": { "faceLength": 0.31, "faceWidth": 0.22, ... },
  "bbox": { "x": 0.21, "y": 0.18, "w": 0.58, "h": 0.64 },
  "_meta": { "elapsed_ms": 412, "engine": "mediapipe-tasks-vision", "version": "0.1.0" }
}
```

Ana platformdaki `lib/caelinus-ai/jobs/runner.ts` `analyzing-selfie` fazında bu endpoint'i çağırır. Env yoksa stub'a düşer — **bu deploy MVP için zorunlu değil**, ama gerçek selfie analizi için şart.

## Maliyet tahmini

- **Container**: en ucuz GPU (RTX 4000 Ada veya A4000) — MediaPipe CPU-only, GPU boş duruyor ama RunPod serverless GPU şart kılıyor
- **Cold start**: 3-6sn (model yükleme + Python boot)
- **Warm call**: 0.3-0.8sn
- **Birim maliyet**: ~$0.0006-0.0012 / call. $20 credit ≈ 16k-33k analiz.

## Deploy adımları

> ⚠️ Tüm dosyalar **`caelinus/runpod/face-analyze/`** klasöründe. RunPod build context bu klasör.

### 1. GitHub'a push (yapıldı sayılır — repoyu zaten bağladın)

Bu klasörün repoda commit'lenmiş olduğundan emin ol:

```bash
git add caelinus/runpod/face-analyze
git commit -m "feat(runpod): face-analyze worker (S2)"
git push
```

### 2. RunPod dashboard → Serverless

1. Sol menüden **Serverless** sekmesi → **+ New Endpoint**
2. **Custom Source** seç, sonra **GitHub** sekmesi
3. Repo: `caelinus/caelinus-word` (veya senin repo adın)
4. Branch: `main`
5. **Dockerfile path**: `caelinus/runpod/face-analyze/Dockerfile`
6. **Build context path**: `caelinus/runpod/face-analyze`

### 3. Worker config

| Alan | Değer | Neden |
|---|---|---|
| **Endpoint name** | `caelinus-face-analyze` | net brand |
| **GPU type** | **RTX 4000 Ada** (en ucuz) ya da **A4000** | MediaPipe CPU-only, küçük GPU yeter |
| **GPU count** | 1 | tek model, paralel gerek yok |
| **Active workers** | **0** | scale-to-zero, idle = $0 |
| **Max workers** | 3 | concurrent burst için |
| **Idle timeout** | 5sn | warm kalsın ama uzun değil |
| **Execution timeout** | 30sn | analiz max 5sn, buffer var |
| **FlashBoot** | **ON** | cold start'ı 6sn → 2sn'e indirir |
| **Network volume** | **Yok** | model image'da gömülü |
| **Container disk** | 5 GB | image ~3 GB |

### 4. İlk build

- Dashboard "Build & Deploy" der; **5-10 dakika** sürer (MediaPipe + model indirme).
- Build log'unda `Successfully built ... Successfully tagged ...` görmelisin.
- "Endpoint is active" yeşil etiketi gelene kadar bekle.

### 5. API key + endpoint id'yi al

1. Settings → API Keys → **+ Create API Key**
   - Name: `caelinus-server`
   - Permission: **Read & Write**
   - Kopyala (bir daha gösterilmiyor!)
2. Endpoint detay sayfasında **Endpoint ID** görünür — kopyala.

### 6. Caelinus monorepo'ya bağla

`caelinus/.env.local` dosyasına ekle:

```bash
# RunPod face-analyze worker
RUNPOD_API_KEY=<az önce kopyaladığın key>
RUNPOD_FACE_ANALYZE_ENDPOINT=<endpoint-id>

# Studio provider'ı aktifleştir
NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER=caelinus-ai-studio
```

Dev server'ı restart et:

```bash
npm run dev
```

### 7. Smoke test

Tarayıcıda `http://localhost:3000/caelinus-ai/avatar` aç, selfie yükle. Network tab'inde:

- `POST /api/caelinus/jobs` → 201
- `GET /api/caelinus/jobs/[id]/stream` → SSE event'leri
- Server log'unda: `[caelinus-ai/runner] RunPod face-analyze hit: detected=true faceShape=oval ...`

`detected=true` görünüyorsa S2 tamam.

## Lokal test (RunPod'a deploy etmeden)

Container'ı lokalde Docker ile çalıştırabilirsin (Docker Desktop gerekli):

```bash
cd caelinus/runpod/face-analyze
docker build -t caelinus-face-analyze .
docker run -p 8000:8000 caelinus-face-analyze
```

Ama RunPod's runpod SDK lokal mod ile websocket bekler — pratik değil. Daha kolayı: deploy edip RunPod log'undan debug et.

## Hata ayıklama

| Belirti | Sebep | Çözüm |
|---|---|---|
| Build failed: `Could not download face_landmarker.task` | Google CDN erişim sorunu | Build'i retry et |
| Cold start 30sn+ | FlashBoot kapalı | Endpoint settings → FlashBoot ON |
| `detected: false, reason: no_face_detected` | Selfie net değil / yüz yok | Normal — UI bunu kullanıcıya söyler |
| 401 Unauthorized | API key yanlış / expired | Yeni key oluştur, .env.local'e koy, dev server restart |
| 500 server error | Container içinde exception | RunPod log'una bak (`Logs` tab) |

## Versiyon notları

| Versiyon | Tarih | Notlar |
|---|---|---|
| 0.1.0 | 2026-05 | İlk sürüm — MediaPipe Tasks Vision FaceLandmarker, 478 landmark, 5 sınıf face shape, yanak/saç renk örnekleme |

## Sonraki sprintlerde değişebilir

- **S3** Wrap4D head topology hazır olunca: handler ek olarak landmark→blendshape weight vektörü döndürür.
- **S6** Hair preset matcher eklenince: handler hair texture/length classifier'ı çağırır.

İmza her zaman geriye uyumlu kalacak — Caelinus monorepo tarafı eski alanları okumaya devam eder.

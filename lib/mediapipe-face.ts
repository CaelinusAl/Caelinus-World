/**
 * Lazy-loaded MediaPipe FaceLandmarker — singleton.
 * WASM + model files are fetched from CDN on first use (~5 MB).
 * Runs entirely client-side (GPU-accelerated).
 */

export type FaceLandmark = { x: number; y: number; z: number };

export type FaceDetectionResult = {
  detected: boolean;
  /** Normalised bounding box (0-1, relative to image dimensions) */
  bbox: { x: number; y: number; w: number; h: number };
  /** 478 MediaPipe landmarks (normalised 0-1) */
  landmarks: FaceLandmark[];
};

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_CDN =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/**
 * Init timeout'ları — WASM + model (~5MB) CDN'den çekilir.
 *
 * GPU: bazı Windows + entegre GPU/sürücü kombinasyonlarında
 * `createFromOptions(delegate:"GPU")` ASLA dönmez (ölçüldü: 12sn+ asılı).
 * Sonsuz donmanın esas sebebi bu. Kısa cap koyup hızlıca CPU'ya düşeriz.
 *
 * CPU: güvenilir fallback ama ilk init XNNPACK derlemesi yüzünden yavaş
 * olabilir (ölçüldü: ~18sn). Bu TEK çalışan yol olduğu için cömert cap
 * veririz — fazla kısa cap fallback'i de kırar. Singleton olduğundan bu
 * bedel oturumda yalnızca bir kez ödenir (warmUpFace ile gizlenebilir).
 */
const GPU_INIT_TIMEOUT_MS = 8000;
const CPU_INIT_TIMEOUT_MS = 45000;

let instancePromise: Promise<InstanceType<any>> | null = null;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} ${ms}ms içinde tamamlanmadı`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function getLandmarker() {
  if (instancePromise) return instancePromise;

  instancePromise = (async () => {
    const { FaceLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );

    // MediaPipe WASM logs "INFO: Created TensorFlow Lite XNNPACK delegate"
    // via console.error — suppress it so Next.js dev overlay doesn't trigger.
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? "");
      if (msg.startsWith("INFO:")) return;
      origError.apply(console, args);
    };

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

      const create = (delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_CDN, delegate },
          runningMode: "IMAGE",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

      // GPU delegate (Windows + bazı entegre GPU/sürücülerde) takılabilir
      // ya da çökebilir — bu donmaların başlıca sebebi. GPU'yu dene; hata
      // ya da timeout olursa daha yavaş ama her cihazda çalışan CPU'ya düş.
      try {
        return await withTimeout(create("GPU"), GPU_INIT_TIMEOUT_MS, "GPU init");
      } catch (gpuErr) {
        console.warn(
          "[mediapipe-face] GPU delegate başarısız, CPU'ya düşülüyor:",
          gpuErr,
        );
        return await withTimeout(create("CPU"), CPU_INIT_TIMEOUT_MS, "CPU init");
      }
    } finally {
      console.error = origError;
    }
  })();

  // Reddedilen promise'i KALICI cache'leme — transient bir CDN/GPU hatası
  // yüz analizini sayfa yenilenene kadar bozmasın. Hata olursa cache'i
  // temizle ki bir sonraki deneme yeniden init etsin.
  instancePromise.catch(() => {
    instancePromise = null;
  });

  return instancePromise;
}

/**
 * Warm-up — landmarker init'ini (GPU dene → CPU fallback, ~8-26sn ilk
 * sefer) erkenden, arka planda tetikler. Selfie yüklenir yüklenmez
 * çağrılırsa kullanıcı stil seçerken init biter; "Avatarımı Oluştur"
 * anında detect hazır olur. Hata yutulur — gerçek init yine detectFace
 * içinde denenir. Idempotent (singleton promise).
 */
export function warmUpFace(): void {
  void getLandmarker().catch(() => {});
}

/**
 * Detect the primary face in an already-loaded HTMLImageElement.
 * Returns landmarks + bounding box (normalised 0-1).
 */
export async function detectFace(
  imageEl: HTMLImageElement
): Promise<FaceDetectionResult> {
  const EMPTY: FaceDetectionResult = {
    detected: false,
    bbox: { x: 0, y: 0, w: 0, h: 0 },
    landmarks: [],
  };

  try {
    const landmarker = await getLandmarker();
    const result = landmarker.detect(imageEl);

    if (!result.faceLandmarks?.length) return EMPTY;

    const lms: FaceLandmark[] = result.faceLandmarks[0].map(
      (lm: { x: number; y: number; z?: number }) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z ?? 0,
      })
    );

    let minX = 1,
      minY = 1,
      maxX = 0,
      maxY = 0;
    for (const l of lms) {
      if (l.x < minX) minX = l.x;
      if (l.y < minY) minY = l.y;
      if (l.x > maxX) maxX = l.x;
      if (l.y > maxY) maxY = l.y;
    }

    const padX = (maxX - minX) * 0.28;
    const padY = (maxY - minY) * 0.28;

    return {
      detected: true,
      bbox: {
        x: Math.max(0, minX - padX),
        y: Math.max(0, minY - padY),
        w: Math.min(1, maxX - minX + padX * 2),
        h: Math.min(1, maxY - minY + padY * 2),
      },
      landmarks: lms,
    };
  } catch {
    return EMPTY;
  }
}

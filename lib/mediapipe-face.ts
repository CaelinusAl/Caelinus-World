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

let instancePromise: Promise<InstanceType<any>> | null = null;

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

    let landmarker;
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_CDN,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    } finally {
      console.error = origError;
    }

    return landmarker;
  })();

  return instancePromise;
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

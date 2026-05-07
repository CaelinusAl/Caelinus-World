/**
 * Caelinus AI — RunPod serverless client.
 *
 * Server-side fetch wrapper around RunPod'un `/runsync` endpoint'i. Tek
 * sorumluluk: bir selfie'yi al, MediaPipe analizini geri döndür.
 *
 * Env:
 *   • RUNPOD_API_KEY               — RunPod hesabından alınmış API key
 *   • RUNPOD_FACE_ANALYZE_ENDPOINT — Endpoint id
 *   • RUNPOD_FACE_ANALYZE_TIMEOUT_MS (opsiyonel, default 25000)
 *   • RUNPOD_FACE_ANALYZE_BASE_URL  (opsiyonel, default api.runpod.ai)
 *
 * Bu modül `server-only` olmalı — API key client bundle'a sızdırılmamalı.
 *
 * S2'de tek endpoint var; S9'da SDXL endpoint'i için ayrı bir client
 * eklenir, paylaşılan retry/timeout/error mantığı buraya çıkacak.
 */

import "server-only";

import type { SelfieAnalysis } from "../types";

/* ────────── Public types ────────── */

export type RunPodAnalysis = SelfieAnalysis & {
  bbox?: { x: number; y: number; w: number; h: number };
  /** Worker tarafından eklenen metadata. Pipeline kullanmaz, log'a yazar. */
  _meta?: { elapsed_ms: number; version: string; engine: string };
};

export type FaceAnalyzeOptions = {
  /** Yanak/saç renk örnekleme yapılsın mı (false → daha hızlı, sadece geometri). */
  sampleColors?: boolean;
  /** Çağrı başına timeout (ms). Default env'den alır, yoksa 25000. */
  timeoutMs?: number;
  /** AbortSignal — caller iptal edebilsin. */
  signal?: AbortSignal;
};

export type FaceAnalyzeError = {
  /** RunPod kullanılmıyor (env eksik). */
  reason: "not_configured" | "http_error" | "worker_error" | "timeout" | "abort" | "invalid_response";
  message: string;
  status?: number;
  cause?: unknown;
};

export class RunPodConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunPodConfigError";
  }
}

/* ────────── Config ────────── */

function getConfig(): {
  apiKey: string;
  endpointId: string;
  baseUrl: string;
  timeoutMs: number;
} | null {
  const apiKey = process.env.RUNPOD_API_KEY;
  const endpointId = process.env.RUNPOD_FACE_ANALYZE_ENDPOINT;
  if (!apiKey || !endpointId) return null;
  const baseUrl =
    process.env.RUNPOD_FACE_ANALYZE_BASE_URL ?? "https://api.runpod.ai";
  const timeoutMs = Number(process.env.RUNPOD_FACE_ANALYZE_TIMEOUT_MS ?? 25000);
  return { apiKey, endpointId, baseUrl, timeoutMs };
}

export function isRunPodFaceAnalyzeConfigured(): boolean {
  return getConfig() !== null;
}

/* ────────── Public API ────────── */

/**
 * RunPod face-analyze endpoint'ini çağır. Senkron `/runsync` modunu
 * kullanıyoruz — kısa-süreli iş (1-3sn), polling gerektirmez.
 *
 * Hata durumunda exception fırlatmaz — `{ analysis: null, error }` döner;
 * runner stub'a düşebilsin.
 */
export async function runPodFaceAnalyze(
  imageDataUrl: string,
  options: FaceAnalyzeOptions = {},
): Promise<{ analysis: RunPodAnalysis | null; error?: FaceAnalyzeError }> {
  const cfg = getConfig();
  if (!cfg) {
    return {
      analysis: null,
      error: {
        reason: "not_configured",
        message:
          "RUNPOD_API_KEY veya RUNPOD_FACE_ANALYZE_ENDPOINT env değişkeni yok.",
      },
    };
  }

  const timeoutMs = options.timeoutMs ?? cfg.timeoutMs;
  const url = `${cfg.baseUrl}/v2/${cfg.endpointId}/runsync`;

  // Timeout + caller signal'ı kombine
  const ctrl = new AbortController();
  const timeoutHandle = setTimeout(() => ctrl.abort(new Error("timeout")), timeoutMs);
  const onCallerAbort = () => ctrl.abort(new Error("abort"));
  options.signal?.addEventListener("abort", onCallerAbort, { once: true });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        input: {
          image_b64: imageDataUrl,
          options: {
            sample_colors: options.sampleColors ?? true,
          },
        },
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        analysis: null,
        error: {
          reason: "http_error",
          status: res.status,
          message: `RunPod /runsync ${res.status}: ${text.slice(0, 200)}`,
        },
      };
    }

    const json = (await res.json()) as {
      status?: string;
      output?: RunPodAnalysis & { error?: string; message?: string };
      error?: string;
    };

    if (json.status && json.status !== "COMPLETED") {
      return {
        analysis: null,
        error: {
          reason: "worker_error",
          message: `RunPod status=${json.status}: ${json.error ?? "unknown"}`,
        },
      };
    }

    const out = json.output;
    if (!out || typeof out !== "object") {
      return {
        analysis: null,
        error: {
          reason: "invalid_response",
          message: "RunPod yanıtında output yok.",
        },
      };
    }

    if (out.error) {
      return {
        analysis: null,
        error: {
          reason: "worker_error",
          message: out.message ?? out.error,
        },
      };
    }

    return { analysis: out };
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    if (e?.message === "timeout") {
      return {
        analysis: null,
        error: {
          reason: "timeout",
          message: `RunPod ${timeoutMs}ms içinde yanıt vermedi.`,
        },
      };
    }
    if (e?.name === "AbortError" || e?.message === "abort") {
      return {
        analysis: null,
        error: { reason: "abort", message: "Çağrı iptal edildi." },
      };
    }
    return {
      analysis: null,
      error: {
        reason: "http_error",
        message: e?.message ?? "Bilinmeyen RunPod hatası.",
        cause: err,
      },
    };
  } finally {
    clearTimeout(timeoutHandle);
    options.signal?.removeEventListener("abort", onCallerAbort);
  }
}

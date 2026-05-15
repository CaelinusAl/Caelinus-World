/**
 * Caelinus AI — Mock provider.
 *
 * Bu provider gerçek bir AI backend YOKKEN, mevcut Caelinus
 * altyapısını (MediaPipe face detection + parametric face metrics +
 * body library + outfit binding) kullanarak "selfie → stilize avatar"
 * deneyiminin tamamını simüle eder. Kullanıcı için fark yok:
 *   • Selfie analiz ediliyor (gerçekten — MediaPipe 478 landmark)
 *   • Yüz şekli, ten tonu, göz/saç rengi tahmin ediliyor (gerçekten —
 *     pixel sampling ile)
 *   • Style profili + analiz → 6 farklı varyasyon ("AI Match Grid")
 *   • Caelinus reading üretiliyor (Style Identity + Energy + Mood)
 *   • Recommendation skoru veriliyor (heuristic — selfie metrikleri
 *     ile style profile arasındaki "uyum")
 *
 * Yarın gerçek bir AI bağlandığında (Caelinus AI Studio, Stability,
 * vs.) bu provider değişir, üst katman aynı kalır.
 */

import { detectFace } from "@/lib/mediapipe-face";
import { extractFaceMetrics, clampFaceMetrics } from "@/lib/face";
import { getBody, type BodyEntry } from "@/lib/avatar-bodies";

import {
  ARCHETYPES,
  buildReading,
  buildVariantStyle,
  pickBody,
  scoreMatch,
} from "../archetypes";
import { PHASE_MESSAGES, PHASE_PROGRESS } from "../phase-messages";
import type {
  AvatarProvider,
  GenerateInput,
  ProgressUpdate,
} from "../provider";
import type {
  AvatarMatch,
  ColorHex,
  GeneratedAvatar,
  OutfitMood,
  SelfieAnalysis,
  SelfieInput,
} from "../types";

/* ─────────────────────────────────────────────────────────
   Yardımcılar — selfie pixel sampling
   ───────────────────────────────────────────────────────── */

function rgbToHex(r: number, g: number, b: number): ColorHex {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}` as ColorHex;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function sampleAverageColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): ColorHex {
  const data = ctx.getImageData(x, y, w, h).data;
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  if (n === 0) return "#d4ad8a";
  return rgbToHex(r / n, g / n, b / n);
}

function classifyFaceShape(metrics: {
  faceLength: number;
  faceWidth: number;
  jawWidth: number;
}): "oval" | "round" | "heart" | "square" | "long" {
  const r = metrics.faceLength / metrics.faceWidth;
  const jawRatio = metrics.jawWidth / metrics.faceWidth;
  if (r > 1.5) return "long";
  if (r < 1.05) return "round";
  if (jawRatio > 0.92) return "square";
  if (jawRatio < 0.78) return "heart";
  return "oval";
}

/* ─────────────────────────────────────────────────────────
   Arketipler + skor + reading helper'ları artık server-safe ortak
   `lib/caelinus-ai/archetypes.ts` modülünde. Bu provider ve server-side
   `lib/caelinus-ai/jobs/runner` aynı kaynaktan okur.
   ───────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────
   Provider implementasyonu

   PHASE_MESSAGES + PHASE_PROGRESS artık `lib/caelinus-ai/phase-messages.ts`
   modülünden geliyor — studio runner ile single source of truth. UI
   parity garantili (mock vs. studio aynı text + aynı progress eğrisi).
   ───────────────────────────────────────────────────────── */

function emit(
  cb: ((u: ProgressUpdate) => void) | undefined,
  phase: ProgressUpdate["phase"],
  progress?: number,
): void {
  cb?.({
    phase,
    progress: progress ?? PHASE_PROGRESS[phase],
    message: PHASE_MESSAGES[phase],
  });
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

async function analyzeSelfieImpl(
  selfie: SelfieInput,
): Promise<SelfieAnalysis> {
  if (typeof window === "undefined") return { detected: false };
  try {
    const img = await loadImage(selfie.dataUrl);
    const detection = await detectFace(img);

    if (!detection.detected || detection.landmarks.length === 0) {
      return { detected: false };
    }

    const metrics = extractFaceMetrics(detection.landmarks);
    const clamped = metrics ? clampFaceMetrics(metrics) : null;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { detected: true, landmarkCount: detection.landmarks.length };
    }
    ctx.drawImage(img, 0, 0);

    const bbox = detection.bbox;
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    const cheekX = Math.round((bbox.x + bbox.w * 0.35) * W);
    const cheekY = Math.round((bbox.y + bbox.h * 0.55) * H);
    const sampleSize = Math.max(8, Math.round(bbox.w * W * 0.06));
    const skinTone = sampleAverageColor(
      ctx,
      cheekX,
      cheekY,
      sampleSize,
      sampleSize,
    );

    const hairX = Math.round((bbox.x + bbox.w * 0.5 - 0.05) * W);
    const hairY = Math.max(0, Math.round((bbox.y - 0.05) * H));
    const hairColor = sampleAverageColor(
      ctx,
      hairX,
      hairY,
      sampleSize,
      Math.min(sampleSize, Math.round(bbox.h * H * 0.06)),
    );

    let faceShape: SelfieAnalysis["faceShape"] | undefined;
    if (clamped) {
      const m = clamped as unknown as Record<string, number>;
      const faceLength = m.faceLength ?? m.face_length ?? 1;
      const faceWidth = m.faceWidth ?? m.face_width ?? 1;
      const jawWidth = m.jawWidth ?? m.jaw_width ?? 1;
      if (faceLength > 0 && faceWidth > 0) {
        faceShape = classifyFaceShape({ faceLength, faceWidth, jawWidth });
      }
    }

    return {
      detected: true,
      landmarkCount: detection.landmarks.length,
      faceShape,
      estimatedSkinTone: skinTone,
      estimatedHairColor: hairColor,
      rawMetrics: clamped as unknown as Record<string, number>,
    };
  } catch (err) {
    console.warn("[caelinus-ai/mock] analyzeSelfie failed:", err);
    return { detected: false };
  }
}

export const mockProvider: AvatarProvider = {
  id: "mock",
  label: "Caelinus Stüdyo · Mock",
  version: "0.2.0",
  supportsSelfie: true,
  estimatedLatencyMs: 4500,

  analyzeSelfie: analyzeSelfieImpl,

  async generateMatches(input: GenerateInput): Promise<AvatarMatch[]> {
    const { selfie, style, onProgress, signal } = input;

    // Progress değerleri PHASE_PROGRESS'ten alınıyor (canonical) —
    // emit() default'ları kullanır, studio runner'la birebir eşleşir.
    emit(onProgress, "preparing");
    await sleep(250, signal);

    let analysis: SelfieAnalysis | undefined;
    if (selfie) {
      emit(onProgress, "analyzing-selfie");
      analysis = await analyzeSelfieImpl(selfie);
      await sleep(450, signal);
    }

    emit(onProgress, "matching-archetype");
    await sleep(500, signal);

    emit(onProgress, "generating-variants");
    await sleep(700, signal);

    const faceShape = analysis?.faceShape ?? "oval";

    const matches: AvatarMatch[] = ARCHETYPES.map((arc, idx) => {
      const body = pickBody(arc.preferredBodies);
      const matchId = `${arc.identity.id}-${idx}`;
      const variantStyle = buildVariantStyle(style, arc);
      const reading = buildReading(arc, { faceShape, matchId });
      const score = scoreMatch(arc, style, analysis);

      return {
        id: matchId,
        glbUrl: body.url,
        thumbnailUrl: body.preview,
        styleProfile: variantStyle,
        reading,
        recommendationScore: score,
        sourceBodyId: body.id,
      };
    });

    // En yüksek skoru "recommended" olarak işaretle
    const topIdx = matches.reduce(
      (best, m, i) =>
        m.recommendationScore > matches[best].recommendationScore ? i : best,
      0,
    );
    matches[topIdx].isRecommended = true;

    emit(onProgress, "ready");
    return matches;
  },

  async finalizeMatch({
    match,
    selfie,
    onProgress,
    signal,
  }): Promise<GeneratedAvatar> {
    emit(onProgress, "rigging");
    await sleep(300, signal);
    emit(onProgress, "rendering");
    await sleep(500, signal);
    emit(onProgress, "polishing");
    await sleep(250, signal);

    let analysis: SelfieAnalysis | undefined;
    if (selfie) analysis = await analyzeSelfieImpl(selfie);

    const body = match.sourceBodyId
      ? getBody(match.sourceBodyId)
      : { url: match.glbUrl, supportsSkinToneOverride: false } as BodyEntry;

    const generated: GeneratedAvatar = {
      id: `caelinus-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      glbUrl: match.glbUrl,
      thumbnailUrl: match.thumbnailUrl,
      analysis,
      styleProfile: match.styleProfile,
      provider: "mock",
      providerVersion: "0.2.0",
      generatedAt: new Date().toISOString(),
      outfitBindingHints: {
        bindingScale: 1,
        isPhotorealistic: !body.supportsSkinToneOverride,
        supportsSkinToneOverride: body.supportsSkinToneOverride ?? false,
      },
      reading: match.reading,
      caelinusReading: match.reading.reading,
      matchId: match.id,
    };

    emit(onProgress, "ready");
    return generated;
  },

  /**
   * generate(): tek adımlı fallback — selfie + style → ilk
   * arketipten direkt finalize. UI normalde generateMatches +
   * finalizeMatch akışını kullanır; bu method sadece geriye
   * uyumluluk için.
   */
  async generate(input: GenerateInput): Promise<GeneratedAvatar> {
    const matches = await this.generateMatches!(input);
    const recommended = matches.find((m) => m.isRecommended) ?? matches[0];
    return this.finalizeMatch!({
      match: recommended,
      selfie: input.selfie,
      onProgress: input.onProgress,
      signal: input.signal,
    });
  },
};

// outfit mood'u type-narrowing'de kullanılabilir tutuyoruz
export type { OutfitMood };

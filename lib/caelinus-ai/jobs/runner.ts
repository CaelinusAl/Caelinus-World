/**
 * Caelinus AI Studio — Job runner.
 *
 * Server-side pipeline orchestrator. Bir job'ı kuyruktan alır, fazları
 * sırayla yürütür, her fazda store'u günceller (store da SSE consumer'lara
 * push eder).
 *
 * S1'de "GPU work" mock — gerçek pipeline yerine deterministic stub
 * üretiyor. ARAMA YERLERİ aşağıda `// S2:` / `// S3:` yorumlarıyla
 * işaretli; gerçek RunPod call'u o satırlara takılacak. Üst katman
 * (provider, UI) hiç değişmeyecek.
 *
 * KRİTİK: bu fonksiyon API route'larından *non-blocking* çağrılmalı —
 * yani route handler `runJob(id)` döndürmesini beklemeden response döner,
 * runner arka planda asenkron çalışmaya devam eder. Next.js'in single-
 * process Node runtime'ında bu güvenli; production'da BullMQ / Inngest
 * worker'ı bu rolü üstlenecek.
 */

import {
  ARCHETYPES,
  buildReading,
  buildVariantStyle,
  hashId,
  pickBody,
  scoreMatch,
} from "../archetypes";
import { getBody, type BodyEntry } from "../../avatar-bodies";
import type {
  AvatarMatch,
  GeneratedAvatar,
  SelfieAnalysis,
  SelfieInput,
} from "../types";

import {
  getCachedAnalysis,
  selfieHash,
  setCachedAnalysis,
} from "./analyze-cache";
import {
  isRunPodFaceAnalyzeConfigured,
  runPodFaceAnalyze,
} from "./runpod-client";
import { getJobStore } from "./store";
import type { JobRecord, JobStatus } from "./types";

/* ─────────────────────────────────────────────────────────
   Yardımcılar
   ───────────────────────────────────────────────────────── */

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * Job hâlâ aktif mi (cancelled / failed olmadı mı)? Worker her faza
 * geçmeden önce bunu kontrol eder, kullanıcı middle-of-pipeline iptal
 * ederse temiz çıkar.
 */
async function ensureNotTerminated(jobId: string): Promise<JobRecord | null> {
  const job = await getJobStore().get(jobId);
  if (!job) return null;
  if (
    job.status === "cancelled" ||
    job.status === "failed" ||
    job.status === "finalized"
  ) {
    return null;
  }
  return job;
}

/* ─────────────────────────────────────────────────────────
   Selfie analizi — 3-katmanlı strateji
     1. Selfie yoksa  → { detected: false }
     2. Cache hit     → cache'ten döndür
     3. RunPod env var → /runsync çağrı
     4. RunPod env yoksa veya hata → stub (deterministic)
   Üst katman bu fonksiyonun imzasına bağımlı; RunPod aktivasyonu UI'da
   tek bir çizgi bile değiştirmez.
   ───────────────────────────────────────────────────────── */

/**
 * Style profile + selfie hash kombinasyonundan deterministic bir
 * face shape türet — RunPod yokken UI'ın hâlâ "AI okuma yaptı" hissi
 * vermesi için.
 */
function deterministicStubAnalysis(
  selfie: SelfieInput,
  seed: number,
): SelfieAnalysis {
  const shapes: NonNullable<SelfieAnalysis["faceShape"]>[] = [
    "oval",
    "round",
    "heart",
    "square",
    "long",
  ];
  return {
    detected: true,
    landmarkCount: 478,
    faceShape: shapes[seed % shapes.length],
    estimatedSkinTone: undefined,
    estimatedHairColor: undefined,
    rawMetrics: { stub: 1 },
  };
}

async function resolveSelfieAnalysis(
  selfie: SelfieInput | undefined,
  styleHash: number,
  signal?: AbortSignal,
): Promise<SelfieAnalysis> {
  if (!selfie) return { detected: false };

  // Cache lookup — aynı selfie ikinci kez gelirse RunPod çağırmıyoruz
  const hash = selfieHash(selfie.dataUrl);
  const cached = getCachedAnalysis(hash);
  if (cached) {
    return cached;
  }

  // RunPod yapılandırılmış mı? Değilse hızlı yoldan stub.
  if (!isRunPodFaceAnalyzeConfigured()) {
    const stub = deterministicStubAnalysis(selfie, styleHash);
    setCachedAnalysis(hash, stub);
    return stub;
  }

  // RunPod /runsync — başarısızsa stub'a düş, pipeline kırılmasın
  const { analysis, error } = await runPodFaceAnalyze(selfie.dataUrl, {
    sampleColors: true,
    signal,
  });

  if (analysis && analysis.detected !== false) {
    if (analysis._meta) {
      console.info(
        `[caelinus-ai/runner] RunPod face-analyze hit: detected=${analysis.detected} faceShape=${analysis.faceShape ?? "n/a"} elapsed=${analysis._meta.elapsed_ms}ms`,
      );
    }
    setCachedAnalysis(hash, analysis);
    return analysis;
  }

  if (error) {
    console.warn(
      `[caelinus-ai/runner] RunPod face-analyze fail (${error.reason}): ${error.message} — stub'a düşülüyor.`,
    );
  } else if (analysis?.detected === false) {
    console.info(
      `[caelinus-ai/runner] RunPod face-analyze: yüz tespit edilmedi — stub'a düşülüyor.`,
    );
  }

  const fallback = deterministicStubAnalysis(selfie, styleHash);
  setCachedAnalysis(hash, fallback);
  return fallback;
}

/* ─────────────────────────────────────────────────────────
   Match grid üretimi — 6 arketip
   ───────────────────────────────────────────────────────── */

function buildMatches(
  job: JobRecord,
  analysis: SelfieAnalysis,
): AvatarMatch[] {
  const { style } = job.input;
  const faceShape = analysis.faceShape ?? "oval";

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

  // En yüksek skoru recommended olarak işaretle
  const topIdx = matches.reduce(
    (best, m, i) =>
      m.recommendationScore > matches[best].recommendationScore ? i : best,
    0,
  );
  matches[topIdx].isRecommended = true;
  return matches;
}

/* ─────────────────────────────────────────────────────────
   Pipeline: queued → matches-ready
   ───────────────────────────────────────────────────────── */

const PHASE_DELAY_MS: Partial<Record<JobStatus, number>> = {
  preparing: 250,
  "analyzing-selfie": 600,
  "matching-archetype": 500,
  "generating-variants": 700,
  rigging: 350,
  rendering: 500,
  polishing: 250,
};

/**
 * Job'ı match-ready'e kadar yürüt. UI tarafı SSE'den fazları izler;
 * "matches-ready" event'i geldiğinde kullanıcıya kart grid'i sunar.
 *
 * Hata olursa store.fail() çağrılır → SSE error event yayar → consumer
 * temiz disconnect olur.
 */
export async function runJob(jobId: string, signal?: AbortSignal): Promise<void> {
  const store = getJobStore();
  let job = await store.get(jobId);
  if (!job) {
    console.warn(`[caelinus-ai/runner] job ${jobId} bulunamadı`);
    return;
  }
  if (job.status !== "queued") {
    // Tekrar çalıştırma korumalı — idempotent.
    console.warn(
      `[caelinus-ai/runner] job ${jobId} zaten "${job.status}" — skip`,
    );
    return;
  }

  const styleHash = hashId(JSON.stringify(job.input.style));

  try {
    // 1. Preparing
    if (!(await ensureNotTerminated(jobId))) return;
    await store.update(jobId, { status: "preparing" });
    await sleep(PHASE_DELAY_MS.preparing!, signal);

    // 2. Analyze selfie — RunPod varsa gerçek MediaPipe; yoksa stub.
    if (!(await ensureNotTerminated(jobId))) return;
    await store.update(jobId, { status: "analyzing-selfie" });
    const analysis = await resolveSelfieAnalysis(
      job.input.selfie,
      styleHash,
      signal,
    );
    // RunPod 0.5-3sn aralığında dönüyor → ek sleep yok. Stub yolunda
    // pipeline çok hızlı bitmesin diye küçük bir nefes payı verelim.
    if (!isRunPodFaceAnalyzeConfigured()) {
      await sleep(PHASE_DELAY_MS["analyzing-selfie"]!, signal);
    }

    // 3. Match archetype
    if (!(await ensureNotTerminated(jobId))) return;
    await store.update(jobId, {
      status: "matching-archetype",
      output: { analysis },
    });
    await sleep(PHASE_DELAY_MS["matching-archetype"]!, signal);

    // 4. Generate 6 variants
    if (!(await ensureNotTerminated(jobId))) return;
    await store.update(jobId, { status: "generating-variants" });
    job = (await store.get(jobId)) as JobRecord;
    const matches = buildMatches(job, analysis);
    await sleep(PHASE_DELAY_MS["generating-variants"]!, signal);

    // 5. Matches-ready
    await store.update(jobId, {
      status: "matches-ready",
      output: { matches },
    });
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    if (e?.name === "AbortError") {
      await store.cancel(jobId);
      return;
    }
    console.error(`[caelinus-ai/runner] runJob ${jobId} failed:`, err);
    await store.fail(jobId, {
      code: "RUNNER_FAILURE",
      message: e?.message ?? "Bilinmeyen bir hata.",
      cause: String(err),
    });
  }
}

/* ─────────────────────────────────────────────────────────
   Finalize: matches-ready → finalized
   ───────────────────────────────────────────────────────── */

export async function runFinalize(
  jobId: string,
  matchId: string,
  signal?: AbortSignal,
): Promise<void> {
  const store = getJobStore();
  const job = await store.get(jobId);
  if (!job) {
    console.warn(`[caelinus-ai/runner] finalize: job ${jobId} bulunamadı`);
    return;
  }
  if (job.status !== "matches-ready") {
    console.warn(
      `[caelinus-ai/runner] finalize: job ${jobId} status="${job.status}" — beklenen "matches-ready"`,
    );
    return;
  }

  const matches = job.output.matches ?? [];
  const match = matches.find((m) => m.id === matchId);
  if (!match) {
    await store.fail(jobId, {
      code: "MATCH_NOT_FOUND",
      message: `Seçtiğin eşleşme bulunamadı (${matchId}).`,
    });
    return;
  }

  try {
    // Match seçimi kayıtlı kalsın
    await store.update(jobId, {
      output: { selectedMatchId: matchId },
    });

    // 1. Rigging
    if (!(await ensureNotTerminated(jobId))) return;
    await store.update(jobId, { status: "rigging" });
    await sleep(PHASE_DELAY_MS.rigging!, signal);

    // 2. Rendering
    if (!(await ensureNotTerminated(jobId))) return;
    await store.update(jobId, { status: "rendering" });
    await sleep(PHASE_DELAY_MS.rendering!, signal);

    // 3. Polishing
    if (!(await ensureNotTerminated(jobId))) return;
    await store.update(jobId, { status: "polishing" });
    await sleep(PHASE_DELAY_MS.polishing!, signal);

    // 4. Compose final GeneratedAvatar
    if (!(await ensureNotTerminated(jobId))) return;
    const body: BodyEntry = match.sourceBodyId
      ? getBody(match.sourceBodyId)
      : ({ url: match.glbUrl, supportsSkinToneOverride: false } as BodyEntry);

    const avatar: GeneratedAvatar = {
      id: `caelinus-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      glbUrl: match.glbUrl,
      thumbnailUrl: match.thumbnailUrl,
      analysis: job.output.analysis,
      styleProfile: match.styleProfile,
      provider: job.providerId,
      providerVersion: job.providerVersion,
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

    await store.update(jobId, {
      status: "finalized",
      output: { avatar },
    });
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    if (e?.name === "AbortError") {
      await store.cancel(jobId);
      return;
    }
    console.error(`[caelinus-ai/runner] finalize ${jobId} failed:`, err);
    await store.fail(jobId, {
      code: "FINALIZE_FAILURE",
      message: e?.message ?? "Avatar finalize edilemedi.",
      cause: String(err),
    });
  }
}

/**
 * Job'ı arka planda fire-and-forget şekilde başlat. API route handler
 * bunu çağırıp hemen response döner; runner kendi başına ilerler.
 *
 * Hata yakalanır ve console'a logger'a gider — process'i öldürmez.
 */
export function startJobInBackground(jobId: string, signal?: AbortSignal): void {
  void runJob(jobId, signal).catch((err) => {
    console.error(
      `[caelinus-ai/runner] background runJob unhandled error:`,
      err,
    );
  });
}

export function startFinalizeInBackground(
  jobId: string,
  matchId: string,
  signal?: AbortSignal,
): void {
  void runFinalize(jobId, matchId, signal).catch((err) => {
    console.error(
      `[caelinus-ai/runner] background runFinalize unhandled error:`,
      err,
    );
  });
}

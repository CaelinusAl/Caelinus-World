/**
 * Caelinus AI Studio — Avatar Provider (browser → backend bridge).
 *
 * Bu provider mock'tan farklı olarak SADECE HTTP üzerinden çalışır:
 *   • POST   /api/caelinus/jobs                  → job yarat
 *   • GET    /api/caelinus/jobs/[id]/stream      → SSE progress
 *   • POST   /api/caelinus/jobs/[id]/finalize    → match seç → final avatar
 *   • DELETE /api/caelinus/jobs/[id]             → iptal
 *
 * Backend faz mesajlarını (Türkçe poetic) ve progress yüzdesini taşır;
 * provider bunları olduğu gibi `onProgress` callback'ine geçer. UI bu
 * callback'i mevcut MediaPipe mock provider'la birebir aynı şekilde
 * tüketir — yani UI değişmeden gerçek backend'e geçilebilir.
 *
 * S1 — backend GPU work mocked; S2'de RunPod MediaPipe takılınca
 * provider arayüzünde TEK SATIR DEĞİŞMEZ.
 */

import type {
  AvatarProvider,
  GenerateInput,
  ProgressUpdate,
} from "../provider";
import type {
  AvatarMatch,
  GeneratedAvatar,
  SelfieAnalysis,
  SelfieInput,
} from "../types";
import { analyzeSelfie as analyzeSelfieInBrowser } from "../../face/analyze-selfie";

/* ────────── Backend event tipleri (server'la senkron) ────────── */

type ProviderPhase =
  | "queued"
  | "preparing"
  | "analyzing-selfie"
  | "matching-archetype"
  | "generating-variants"
  | "matches-ready"
  | "rigging"
  | "rendering"
  | "polishing"
  | "finalized"
  | "cancelled"
  | "failed";

type ProgressFrame = {
  type: "progress";
  jobId: string;
  status: ProviderPhase;
  progress: number;
  message: string;
  emittedAt: string;
};

type MatchesFrame = { type: "matches"; jobId: string; matches: AvatarMatch[] };
type FinalizedFrame = { type: "finalized"; jobId: string; avatar: GeneratedAvatar };
type ErrorFrame = { type: "error"; jobId: string; code: string; message: string };
type CancelledFrame = { type: "cancelled"; jobId: string };

type ServerFrame =
  | ProgressFrame
  | MatchesFrame
  | FinalizedFrame
  | ErrorFrame
  | CancelledFrame;

const PHASE_MAP: Partial<Record<ProviderPhase, ProgressUpdate["phase"]>> = {
  queued: "preparing",
  preparing: "preparing",
  "analyzing-selfie": "analyzing-selfie",
  "matching-archetype": "matching-archetype",
  "generating-variants": "generating-variants",
  "matches-ready": "ready",
  rigging: "rigging",
  rendering: "rendering",
  polishing: "polishing",
  finalized: "ready",
};

function toProgressUpdate(frame: ProgressFrame): ProgressUpdate | null {
  const phase = PHASE_MAP[frame.status];
  if (!phase) return null;
  return { phase, progress: frame.progress, message: frame.message };
}

function abortError(): Error {
  const e = new Error("İşlem iptal edildi.");
  e.name = "AbortError";
  return e;
}

/* ────────── SSE consumer — async iterator ────────── */

/**
 * EventSource'dan frame'leri pull eden async iterator. Stream terminal
 * event (finalized / cancelled / error) geldiğinde sonlanır. AbortSignal
 * verirse bağlantı manuel kapatılır.
 */
async function* subscribeJobStream(
  jobId: string,
  signal?: AbortSignal,
): AsyncIterableIterator<ServerFrame> {
  const url = `/api/caelinus/jobs/${encodeURIComponent(jobId)}/stream`;
  const source = new EventSource(url);

  const buffer: ServerFrame[] = [];
  let resolveWaiter: (() => void) | null = null;
  let closed = false;
  const wake = () => {
    resolveWaiter?.();
    resolveWaiter = null;
  };

  const handleFrame = (raw: MessageEvent) => {
    try {
      buffer.push(JSON.parse(raw.data) as ServerFrame);
      wake();
    } catch (err) {
      console.warn("[caelinus-ai/studio] malformed SSE frame:", err);
    }
  };

  source.addEventListener("progress", handleFrame as EventListener);
  source.addEventListener("matches", handleFrame as EventListener);
  source.addEventListener("finalized", handleFrame as EventListener);
  source.addEventListener("error", handleFrame as EventListener);
  source.addEventListener("cancelled", handleFrame as EventListener);

  source.onerror = () => {
    if (source.readyState === EventSource.CLOSED) {
      buffer.push({
        type: "error",
        jobId,
        code: "STREAM_DISCONNECTED",
        message: "Akış kesildi.",
      });
      closed = true;
      wake();
    }
  };

  const onAbort = () => {
    closed = true;
    source.close();
    wake();
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    while (!closed) {
      if (buffer.length > 0) {
        const frame = buffer.shift()!;
        yield frame;
        if (
          frame.type === "finalized" ||
          frame.type === "cancelled" ||
          frame.type === "error"
        ) {
          break;
        }
        continue;
      }
      await new Promise<void>((resolve) => {
        resolveWaiter = resolve;
      });
    }
  } finally {
    source.close();
    signal?.removeEventListener("abort", onAbort);
  }
}

/* ────────── Backend HTTP helpers ────────── */

async function createJob(
  input: GenerateInput,
  analysis: SelfieAnalysis | undefined,
): Promise<string> {
  const res = await fetch("/api/caelinus/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Selfie GÖRÜNTÜSÜ sunucuya gönderilmez — analiz tarayıcıda yapıldı,
      // görüntü cihazda kalır (KVKK). Yalnızca görüntü-içermeyen meta
      // (telemetri) + hesaplanmış analiz gider.
      selfieMeta: input.selfie
        ? {
            source: input.selfie.source,
            capturedAt: input.selfie.capturedAt,
            width: input.selfie.width,
            height: input.selfie.height,
          }
        : undefined,
      analysis,
      style: input.style,
      quality: "balanced",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Job oluşturulamadı (${res.status})`);
  }
  const data = (await res.json()) as { job: { id: string } };
  return data.job.id;
}

async function postFinalize(jobId: string, matchId: string): Promise<void> {
  const res = await fetch(
    `/api/caelinus/jobs/${encodeURIComponent(jobId)}/finalize`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    },
  );
  // 202 = accepted, runner started
  if (!res.ok && res.status !== 202) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Finalize başarısız (${res.status})`);
  }
}

async function cancelJob(jobId: string): Promise<void> {
  await fetch(`/api/caelinus/jobs/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
  }).catch(() => undefined);
}

/* ────────── jobId köprüsü (generateMatches → finalizeMatch) ────────── */

/**
 * UI tarafında kullanıcı önce generateMatches() çağırır, sonra bir match
 * seçip finalizeMatch() çağırır. AvatarMatch tipinde job referansı yok
 * (UI temiz kalsın diye), bu yüzden provider en son oluşturduğu jobId'yi
 * hatırlar. Tek tab / tek aktif akış varsayımı — şu an MVP için yeterli.
 *
 * Multi-job ihtiyacı doğarsa AvatarMatch'e opaque `studioToken` alanı
 * eklenir (Date.now-encoded, jobId'yi içerir). UI bunu görmez.
 */
let lastJobId: string | null = null;

/* ────────── Provider tanımı ────────── */

const STUDIO_PROVIDER_ID = "caelinus-ai-studio";
const STUDIO_PROVIDER_VERSION = "0.1.0";

export const caelinusStudioProvider: AvatarProvider = {
  id: STUDIO_PROVIDER_ID,
  label: "Caelinus AI Studio",
  version: STUDIO_PROVIDER_VERSION,
  supportsSelfie: true,
  /** Backend stub bugün ~2.7sn'de match-ready üretiyor; gerçek pipeline ~12-30sn olacak. */
  estimatedLatencyMs: 4500,

  /**
   * Selfie analizi — TARAYICIDA, MediaPipe ile. Selfie cihazdan çıkmaz.
   * `lib/face/analyze-selfie.ts` 478 landmark + yüz şekli + ten/saç rengi
   * üretir. Sonuç backend job'una iliştirilir (sunucu tarafı analiz yok).
   */
  async analyzeSelfie(selfie: SelfieInput): Promise<SelfieAnalysis> {
    return analyzeSelfieInBrowser(selfie);
  },

  async generateMatches(input: GenerateInput): Promise<AvatarMatch[]> {
    const { onProgress, signal } = input;

    // Yüz analizini tarayıcıda yap — selfie sunucuya analiz için gitmez.
    let analysis: SelfieAnalysis | undefined;
    if (input.selfie) {
      onProgress?.({
        phase: "analyzing-selfie",
        progress: 8,
        message: "Yüzünden bir frekans okuyoruz…",
      });
      try {
        analysis = await analyzeSelfieInBrowser(input.selfie);
      } catch (err) {
        // Analiz başarısızsa pipeline kırılmasın — backend fallback'e düşer.
        console.warn("[caelinus-ai/studio] tarayıcı selfie analizi başarısız:", err);
      }
    }

    const jobId = await createJob(input, analysis);
    lastJobId = jobId;

    const onAbort = () => void cancelJob(jobId);
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      for await (const frame of subscribeJobStream(jobId, signal)) {
        if (frame.type === "progress") {
          const update = toProgressUpdate(frame);
          if (update) onProgress?.(update);
        } else if (frame.type === "matches") {
          return frame.matches;
        } else if (frame.type === "error") {
          throw new Error(frame.message);
        } else if (frame.type === "cancelled") {
          throw abortError();
        }
      }
      throw new Error("Akış matches event'i göndermeden kapandı.");
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  },

  async finalizeMatch({ match, onProgress, signal }): Promise<GeneratedAvatar> {
    if (!lastJobId) {
      throw new Error(
        "Studio provider: önce generateMatches() çağrılmalı (jobId yok).",
      );
    }
    const jobId = lastJobId;

    await postFinalize(jobId, match.id);

    const onAbort = () => void cancelJob(jobId);
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      for await (const frame of subscribeJobStream(jobId, signal)) {
        if (frame.type === "progress") {
          const update = toProgressUpdate(frame);
          if (update) onProgress?.(update);
        } else if (frame.type === "finalized") {
          return frame.avatar;
        } else if (frame.type === "error") {
          throw new Error(frame.message);
        } else if (frame.type === "cancelled") {
          throw abortError();
        }
      }
      throw new Error("Akış finalized event'i göndermeden kapandı.");
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  },

  /**
   * Eski API: tek-shot generate. UI normalde generateMatches +
   * finalizeMatch kullanır; bu metod sadece geriye uyumluluk için.
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

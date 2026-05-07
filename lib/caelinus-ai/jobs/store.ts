/**
 * Caelinus AI Studio — Job storage abstraction.
 *
 * Bir job'ın server-side state'ini saklar ve SSE consumer'larına
 * (canlı progress dinleyenlere) push eder.
 *
 * İki implementasyon:
 *   • InMemoryJobStore — Node.js process-local Map + EventEmitter.
 *     Dev mode için ideal, hot-reload safe (`globalThis` cache'lenir).
 *   • SupabaseJobStore — Postgres tabloları + Supabase Realtime.
 *     S1 sonunda eklenecek; aynı interface, drop-in replacement.
 *
 * Dış dünya `getStore()` çağırır; env'e göre doğru store'u döner.
 *
 * KRİTİK: bu modül HEM API route handler'larında (Node.js runtime)
 * HEM job runner'da (aynı process) import edilir. Singleton şart —
 * yoksa runner ile API farklı Map'lere bakar. globalThis pattern
 * Next.js dev HMR'a karşı bunu koruyor.
 */

import { EventEmitter } from "node:events";

import {
  ACTIVE_JOB_STATUSES,
  JOB_PHASE_MESSAGES,
  JOB_PHASE_PROGRESS,
  TERMINAL_JOB_STATUSES,
  type JobEvent,
  type JobInput,
  type JobOutput,
  type JobRecord,
  type JobStatus,
} from "./types";
import type { AvatarMatch, GeneratedAvatar } from "../types";

/* ────────── Store interface'i ────────── */

export interface JobStore {
  create(input: JobInput, opts?: CreateJobOptions): Promise<JobRecord>;
  get(id: string): Promise<JobRecord | null>;
  /**
   * Job state'ini değiştir. Status / progress / message / output
   * verilirse Atomic update + JobEvent emit.
   */
  update(id: string, patch: JobUpdatePatch): Promise<JobRecord | null>;
  /**
   * Job'a bir event ekle ve subscribe'lara broadcast et. Status'u
   * değiştirmek istemiyorsan (örn. sadece progress text update)
   * burayı kullan.
   */
  emit(id: string, event: JobEvent): Promise<void>;
  /** Subscribe — async iterator. Stream kapanırsa otomatik unsubscribe. */
  subscribe(id: string, signal?: AbortSignal): AsyncIterableIterator<JobEvent>;
  cancel(id: string, reason?: string): Promise<JobRecord | null>;
  fail(id: string, error: { code: string; message: string; cause?: string }): Promise<JobRecord | null>;
}

export type CreateJobOptions = {
  providerId?: string;
  providerVersion?: string;
  userId?: string | null;
  clientHash?: string;
};

export type JobUpdatePatch = {
  status?: JobStatus;
  /** Override; verilmezse JOB_PHASE_PROGRESS'ten alınır. */
  progress?: number;
  /** Override; verilmezse JOB_PHASE_MESSAGES'ten alınır. */
  message?: string;
  output?: Partial<JobOutput>;
  error?: JobRecord["error"];
};

/* ────────── In-memory implementasyon ────────── */

type StoreState = {
  jobs: Map<string, JobRecord>;
  emitters: Map<string, EventEmitter>;
};

/** globalThis cache — Next.js dev HMR'da Map'in resetlenmesini engelliyor. */
function getState(): StoreState {
  const g = globalThis as { __caelinusJobStore?: StoreState };
  if (!g.__caelinusJobStore) {
    g.__caelinusJobStore = {
      jobs: new Map(),
      emitters: new Map(),
    };
  }
  return g.__caelinusJobStore;
}

function getOrCreateEmitter(id: string): EventEmitter {
  const state = getState();
  let emitter = state.emitters.get(id);
  if (!emitter) {
    emitter = new EventEmitter();
    // Çok sayıda SSE consumer'ı için warning'i kapat
    emitter.setMaxListeners(50);
    state.emitters.set(id, emitter);
  }
  return emitter;
}

function newJobId(): string {
  // crypto.randomUUID node'da var; deterministic prefix Caelinus brand
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `caij_${uuid.replace(/-/g, "").slice(0, 24)}`;
}

class InMemoryJobStore implements JobStore {
  async create(input: JobInput, opts: CreateJobOptions = {}): Promise<JobRecord> {
    const now = new Date().toISOString();
    const job: JobRecord = {
      id: newJobId(),
      providerId: opts.providerId ?? "caelinus-ai-studio-stub",
      providerVersion: opts.providerVersion ?? "0.1.0",
      userId: opts.userId ?? null,
      status: "queued",
      progress: JOB_PHASE_PROGRESS.queued,
      message: JOB_PHASE_MESSAGES.queued,
      input,
      output: {},
      createdAt: now,
      updatedAt: now,
      clientHash: opts.clientHash,
    };
    getState().jobs.set(job.id, job);
    return job;
  }

  async get(id: string): Promise<JobRecord | null> {
    return getState().jobs.get(id) ?? null;
  }

  async update(id: string, patch: JobUpdatePatch): Promise<JobRecord | null> {
    const state = getState();
    const job = state.jobs.get(id);
    if (!job) return null;
    if (TERMINAL_JOB_STATUSES.has(job.status) && patch.status) {
      // Bir job terminal'e geçmişse status değişikliğini yutuyoruz —
      // race condition'ları (eg. cancel sonrası geç gelen progress) güvene al.
      return job;
    }

    const nextStatus = patch.status ?? job.status;
    const nextProgress =
      patch.progress ??
      (patch.status ? JOB_PHASE_PROGRESS[patch.status] : job.progress);
    const nextMessage =
      patch.message ??
      (patch.status ? JOB_PHASE_MESSAGES[patch.status] : job.message);

    const updated: JobRecord = {
      ...job,
      status: nextStatus,
      progress: nextProgress,
      message: nextMessage,
      output: { ...job.output, ...(patch.output ?? {}) },
      error: patch.error ?? job.error,
      updatedAt: new Date().toISOString(),
    };
    state.jobs.set(id, updated);

    // Status değiştiyse veya progress hareket ettiyse SSE event yay
    if (
      patch.status ||
      patch.progress !== undefined ||
      patch.message !== undefined
    ) {
      await this.emit(id, {
        type: "progress",
        jobId: id,
        status: updated.status,
        progress: updated.progress,
        message: updated.message,
        emittedAt: updated.updatedAt,
      });
    }

    // Output diff'inden derive event'leri
    if (patch.output?.matches && !job.output.matches) {
      await this.emit(id, {
        type: "matches",
        jobId: id,
        matches: patch.output.matches as AvatarMatch[],
      });
    }
    if (patch.output?.avatar && !job.output.avatar) {
      await this.emit(id, {
        type: "finalized",
        jobId: id,
        avatar: patch.output.avatar as GeneratedAvatar,
      });
    }

    return updated;
  }

  async emit(id: string, event: JobEvent): Promise<void> {
    getOrCreateEmitter(id).emit("event", event);
  }

  async *subscribe(
    id: string,
    signal?: AbortSignal,
  ): AsyncIterableIterator<JobEvent> {
    const emitter = getOrCreateEmitter(id);
    const buffer: JobEvent[] = [];
    let resolveWaiter: (() => void) | null = null;
    let closed = false;

    const handler = (event: JobEvent) => {
      buffer.push(event);
      resolveWaiter?.();
      resolveWaiter = null;
    };
    const onAbort = () => {
      closed = true;
      resolveWaiter?.();
      resolveWaiter = null;
    };

    emitter.on("event", handler);
    signal?.addEventListener("abort", onAbort, { once: true });

    // Mevcut state'i ilk event olarak gönder — late subscriber'a "ne kaçırdın" özeti
    const job = await this.get(id);
    if (job) {
      yield {
        type: "progress",
        jobId: id,
        status: job.status,
        progress: job.progress,
        message: job.message,
        emittedAt: job.updatedAt,
      };
      // Eğer iş bitmişse ilgili final event'i de hemen ver
      if (job.output.matches) {
        yield { type: "matches", jobId: id, matches: job.output.matches };
      }
      if (job.output.avatar) {
        yield { type: "finalized", jobId: id, avatar: job.output.avatar };
      }
      if (job.status === "cancelled") {
        yield { type: "cancelled", jobId: id };
      }
      if (job.status === "failed" && job.error) {
        yield {
          type: "error",
          jobId: id,
          code: job.error.code,
          message: job.error.message,
        };
      }
    }

    try {
      while (!closed) {
        if (buffer.length > 0) {
          const ev = buffer.shift()!;
          yield ev;

          // Terminal event'lerde stream'i kapat — SSE consumer'ı disconnect'e zorla
          if (
            ev.type === "finalized" ||
            ev.type === "cancelled" ||
            ev.type === "error"
          ) {
            // Aynı event'in tekrar gelmemesi için kısa drain
            return;
          }
          continue;
        }
        await new Promise<void>((resolve) => {
          resolveWaiter = resolve;
        });
      }
    } finally {
      emitter.off("event", handler);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  async cancel(id: string): Promise<JobRecord | null> {
    const state = getState();
    const job = state.jobs.get(id);
    if (!job) return null;
    if (TERMINAL_JOB_STATUSES.has(job.status)) return job;
    const updated: JobRecord = {
      ...job,
      status: "cancelled",
      progress: 0,
      message: JOB_PHASE_MESSAGES.cancelled,
      updatedAt: new Date().toISOString(),
    };
    state.jobs.set(id, updated);
    await this.emit(id, { type: "cancelled", jobId: id });
    return updated;
  }

  async fail(
    id: string,
    error: { code: string; message: string; cause?: string },
  ): Promise<JobRecord | null> {
    const state = getState();
    const job = state.jobs.get(id);
    if (!job) return null;
    const updated: JobRecord = {
      ...job,
      status: "failed",
      progress: 0,
      message: JOB_PHASE_MESSAGES.failed,
      error,
      updatedAt: new Date().toISOString(),
    };
    state.jobs.set(id, updated);
    await this.emit(id, {
      type: "error",
      jobId: id,
      code: error.code,
      message: error.message,
    });
    return updated;
  }
}

/* ────────── Public factory ────────── */

let activeStore: JobStore | null = null;

/**
 * Aktif store'u env'e göre seç:
 *   • CAELINUS_AI_STUDIO_STORE=supabase + SUPABASE_SERVICE_ROLE_KEY varsa
 *     → SupabaseJobStore (persist Postgres'te, multi-instance ready)
 *   • Aksi durumda → InMemoryJobStore (Node.js process-local Map)
 *
 * SupabaseJobStore lazy-loaded: import "server-only" içerir, browser
 * bundle'a kaçmaz.
 */
export function getJobStore(): JobStore {
  if (!activeStore) {
    const wantsSupabase =
      process.env.CAELINUS_AI_STUDIO_STORE === "supabase" &&
      !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (wantsSupabase) {
      try {
        // Sync require — Next.js server bundle'da bu safe
        // (lazy load böylece InMemory mode supabase paketini tetiklemez)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require("./supabase-store") as {
          SupabaseJobStore: new () => JobStore;
        };
        activeStore = new mod.SupabaseJobStore();
        console.info("[caelinus-ai/jobs] SupabaseJobStore aktif.");
      } catch (err) {
        console.warn(
          "[caelinus-ai/jobs] SupabaseJobStore yüklenemedi, in-memory'ye düşülüyor:",
          err,
        );
        activeStore = new InMemoryJobStore();
      }
    } else {
      activeStore = new InMemoryJobStore();
    }
  }
  return activeStore;
}

/** Dev/test'te store'u manuel inject edebilmek için. */
export function _setJobStoreForTesting(store: JobStore): void {
  activeStore = store;
}

/** Aktif olan job sayısı — admin panel ve abuse guard için. */
export function getActiveJobCount(): number {
  const state = getState();
  let n = 0;
  for (const job of state.jobs.values()) {
    if (ACTIVE_JOB_STATUSES.has(job.status)) n++;
  }
  return n;
}

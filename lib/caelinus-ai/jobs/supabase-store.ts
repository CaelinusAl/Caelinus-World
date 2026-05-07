/**
 * Caelinus AI Studio — Supabase-backed JobStore.
 *
 * In-memory store ile aynı interface'i implement eder, ama state'i
 * Postgres'te (`caelinus_ai_jobs` + `caelinus_ai_job_events` tabloları)
 * tutar. Migration: supabase/migrations/0012_caelinus_ai_studio.sql.
 *
 * SSE event broadcasting:
 *   • Şu anda aynı Node.js process içinde çalışan runner ile paylaşılan
 *     EventEmitter kullanılıyor (in-memory pub-sub). Single-instance Next.js
 *     deploy'da bu yeterli — runner ile API route aynı process'te.
 *   • Multi-instance scale'a geçildiğinde (Vercel functions ↔ dedicated
 *     RunPod worker), `caelinus_ai_realtime` Postgres publication'ı
 *     üzerinden Supabase Realtime broadcast'a swap edilecek. SSE handler
 *     server-side websocket subscriber'a dönüşür.
 *
 * Env:
 *   • SUPABASE_SERVICE_ROLE_KEY ve NEXT_PUBLIC_SUPABASE_URL şart.
 *   • CAELINUS_AI_STUDIO_STORE="supabase" → bu store aktif olur.
 *
 * KRİTİK: bu modül `server-only` (admin client kullanıyor).
 */

import "server-only";

import { EventEmitter } from "node:events";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
import type {
  CreateJobOptions,
  JobStore,
  JobUpdatePatch,
} from "./store";
import type { AvatarMatch, GeneratedAvatar } from "../types";

/* ────────── Aynı process içinde paylaşılan emitter ────────── */

type EmitterState = { emitters: Map<string, EventEmitter> };

function getEmitterState(): EmitterState {
  const g = globalThis as { __caelinusJobEmitters?: EmitterState };
  if (!g.__caelinusJobEmitters) {
    g.__caelinusJobEmitters = { emitters: new Map() };
  }
  return g.__caelinusJobEmitters;
}

function getOrCreateEmitter(id: string): EventEmitter {
  const state = getEmitterState();
  let emitter = state.emitters.get(id);
  if (!emitter) {
    emitter = new EventEmitter();
    emitter.setMaxListeners(50);
    state.emitters.set(id, emitter);
  }
  return emitter;
}

/* ────────── Job id üretimi ────────── */

function newJobId(): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `caij_${uuid.replace(/-/g, "").slice(0, 24)}`;
}

/* ────────── DB row → JobRecord ────────── */

type CaelinusJobRow = {
  id: string;
  user_id: string | null;
  client_hash: string;
  selfie_id: string | null;
  provider_id: string;
  provider_version: string;
  status: JobStatus;
  progress: number;
  message: string | null;
  input: JobInput;
  output: JobOutput;
  error: JobRecord["error"] | null;
  input_hash: string | null;
  quality: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

function rowToRecord(row: CaelinusJobRow): JobRecord {
  return {
    id: row.id,
    providerId: row.provider_id,
    providerVersion: row.provider_version,
    userId: row.user_id,
    status: row.status,
    progress: row.progress,
    message: row.message ?? "",
    input: row.input,
    output: row.output ?? {},
    error: row.error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientHash: row.client_hash,
  };
}

/* ────────── Implementation ────────── */

export class SupabaseJobStore implements JobStore {
  // Untyped admin client — Database tipinde caelinus_ai_jobs henüz yok
  // (supabase gen types çalıştırılınca eklenir). Şimdilik runtime-safe.
  private get admin() {
    return createSupabaseAdminClient() as unknown as {
      from: (table: string) => {
        insert: (rows: unknown) => { select: () => { single: () => Promise<{ data: unknown; error: { message: string } | null }> } };
        update: (patch: unknown) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: unknown; error: { message: string } | null }> } } };
        select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: unknown; error: { message: string } | null }> } };
      };
    };
  }

  async create(input: JobInput, opts: CreateJobOptions = {}): Promise<JobRecord> {
    const id = newJobId();
    const now = new Date().toISOString();
    const row: Partial<CaelinusJobRow> = {
      id,
      user_id: opts.userId ?? null,
      client_hash: opts.clientHash ?? "anonymous",
      selfie_id: null,
      provider_id: opts.providerId ?? "caelinus-ai-studio",
      provider_version: opts.providerVersion ?? "0.1.0",
      status: "queued",
      progress: JOB_PHASE_PROGRESS.queued,
      message: JOB_PHASE_MESSAGES.queued,
      input,
      output: {},
      input_hash: input.inputHash ?? null,
      quality: input.quality ?? "balanced",
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.admin
      .from("caelinus_ai_jobs")
      .insert(row)
      .select()
      .single();
    if (error) {
      throw new Error(`[caelinus-ai/supabase-store] create failed: ${error.message}`);
    }
    return rowToRecord(data as CaelinusJobRow);
  }

  async get(id: string): Promise<JobRecord | null> {
    const { data, error } = await this.admin
      .from("caelinus_ai_jobs")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      // single() returns error when no rows — treat as not found
      return null;
    }
    return rowToRecord(data as CaelinusJobRow);
  }

  async update(id: string, patch: JobUpdatePatch): Promise<JobRecord | null> {
    const current = await this.get(id);
    if (!current) return null;
    if (TERMINAL_JOB_STATUSES.has(current.status) && patch.status) {
      return current;
    }

    const nextStatus: JobStatus = patch.status ?? current.status;
    const nextProgress =
      patch.progress ??
      (patch.status ? JOB_PHASE_PROGRESS[patch.status] : current.progress);
    const nextMessage =
      patch.message ??
      (patch.status ? JOB_PHASE_MESSAGES[patch.status] : current.message);

    const mergedOutput: JobOutput = {
      ...current.output,
      ...(patch.output ?? {}),
    };

    const { data, error } = await this.admin
      .from("caelinus_ai_jobs")
      .update({
        status: nextStatus,
        progress: nextProgress,
        message: nextMessage,
        output: mergedOutput,
        error: patch.error ?? current.error ?? null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new Error(`[caelinus-ai/supabase-store] update failed: ${error.message}`);
    }
    const updated = rowToRecord(data as CaelinusJobRow);

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

    if (patch.output?.matches && !current.output.matches) {
      await this.emit(id, {
        type: "matches",
        jobId: id,
        matches: patch.output.matches as AvatarMatch[],
      });
    }
    if (patch.output?.avatar && !current.output.avatar) {
      await this.emit(id, {
        type: "finalized",
        jobId: id,
        avatar: patch.output.avatar as GeneratedAvatar,
      });
    }

    return updated;
  }

  async emit(id: string, event: JobEvent): Promise<void> {
    // 1. Append to event log (audit + multi-instance Realtime kanalı)
    try {
      await this.admin.from("caelinus_ai_job_events").insert({
        job_id: id,
        event_type: event.type,
        status: "status" in event ? event.status : null,
        progress: "progress" in event ? event.progress : null,
        message: "message" in event ? event.message : null,
        payload: event,
      } as unknown as Parameters<typeof this.admin.from>[0]);
    } catch (err) {
      // Event log yazımı pipeline'ı bloklamasın — best-effort
      console.warn(
        `[caelinus-ai/supabase-store] emit log failed for ${id}:`,
        err,
      );
    }
    // 2. In-process broadcast — SSE handler'lar dinler
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
    const wake = () => {
      resolveWaiter?.();
      resolveWaiter = null;
    };

    const handler = (event: JobEvent) => {
      buffer.push(event);
      wake();
    };
    const onAbort = () => {
      closed = true;
      wake();
    };
    emitter.on("event", handler);
    signal?.addEventListener("abort", onAbort, { once: true });

    // Late subscriber: mevcut state'i ilk event olarak ver
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
          if (
            ev.type === "finalized" ||
            ev.type === "cancelled" ||
            ev.type === "error"
          ) {
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
    const current = await this.get(id);
    if (!current) return null;
    if (TERMINAL_JOB_STATUSES.has(current.status)) return current;

    const { data, error } = await this.admin
      .from("caelinus_ai_jobs")
      .update({
        status: "cancelled",
        progress: 0,
        message: JOB_PHASE_MESSAGES.cancelled,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw new Error(`[caelinus-ai/supabase-store] cancel failed: ${error.message}`);
    }
    await this.emit(id, { type: "cancelled", jobId: id });
    return rowToRecord(data as CaelinusJobRow);
  }

  async fail(
    id: string,
    error: { code: string; message: string; cause?: string },
  ): Promise<JobRecord | null> {
    const current = await this.get(id);
    if (!current) return null;

    const { data, error: dbErr } = await this.admin
      .from("caelinus_ai_jobs")
      .update({
        status: "failed",
        progress: 0,
        message: JOB_PHASE_MESSAGES.failed,
        error,
      })
      .eq("id", id)
      .select()
      .single();
    if (dbErr) {
      throw new Error(`[caelinus-ai/supabase-store] fail failed: ${dbErr.message}`);
    }
    await this.emit(id, {
      type: "error",
      jobId: id,
      code: error.code,
      message: error.message,
    });
    return rowToRecord(data as CaelinusJobRow);
  }
}

/* ────────── Active job sayma helper'ı ────────── */

export async function countActiveJobsInSupabase(): Promise<number> {
  const admin = createSupabaseAdminClient();
  const { count } = await (admin
    .from("caelinus_ai_jobs" as never) as unknown as {
      select: (col: string, opts?: unknown) => { in: (col: string, vals: string[]) => Promise<{ count: number | null }> };
    })
    .select("id", { count: "exact", head: true })
    .in("status", Array.from(ACTIVE_JOB_STATUSES));
  return count ?? 0;
}

/**
 * Play studio — in-memory hourly cost guard.
 *
 * Counts fresh AI renders (cache misses) per client IP using a simple
 * sliding 1-hour window. This is **per-instance** memory: on serverless
 * each cold start gets a clean counter, and a multi-instance deployment
 * effectively raises the budget by N. That's intentional for now —
 * a credible MVP guard with zero external dependency. Replace with
 * Upstash Redis (or Supabase counter) the day we go viral.
 *
 * Counts are written *after* the provider succeeds. Failed renders
 * don't punish the user (we don't bill for them anyway).
 */

import "server-only";

import { serverEnv } from "@/lib/env";

const WINDOW_MS = 60 * 60 * 1000;

const buckets = new Map<string, number[]>();

export type QuotaResult = {
  ok: boolean;
  /** How many fresh renders this client has in the trailing hour. */
  used: number;
  /** Configured ceiling. */
  limit: number;
  /** ms until at least one slot frees up. 0 if not throttled. */
  retryAfterMs: number;
};

function trim(now: number, slots: number[]): number[] {
  const cutoff = now - WINDOW_MS;
  let i = 0;
  while (i < slots.length && slots[i] < cutoff) i++;
  return i === 0 ? slots : slots.slice(i);
}

/** Returns the current quota state without touching the counter. */
export function checkQuota(clientKey: string): QuotaResult {
  const limit = serverEnv.PLAY_AI_HOURLY_BUDGET ?? 60;
  const now = Date.now();
  const fresh = trim(now, buckets.get(clientKey) ?? []);
  buckets.set(clientKey, fresh);
  const used = fresh.length;
  if (used < limit) {
    return { ok: true, used, limit, retryAfterMs: 0 };
  }
  // Oldest slot tells us when the window slides enough to free one.
  const retryAfterMs = Math.max(0, fresh[0] + WINDOW_MS - now);
  return { ok: false, used, limit, retryAfterMs };
}

/** Record one successful fresh render. Call only on cache miss + provider success. */
export function recordRender(clientKey: string): void {
  const now = Date.now();
  const fresh = trim(now, buckets.get(clientKey) ?? []);
  fresh.push(now);
  buckets.set(clientKey, fresh);
}

/**
 * Best-effort client identifier. We use the leftmost address from
 * `x-forwarded-for` (Vercel's proxy adds this), then fall back to the
 * `x-real-ip` header, and finally a constant — which is fine because
 * a single shared key just makes the guard global instead of per-IP.
 */
export function clientKeyFromHeaders(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim() || "anon";
  const xri = h.get("x-real-ip");
  if (xri) return xri.trim();
  return "anon";
}

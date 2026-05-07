/**
 * Caelinus Avatar Core — Session Store.
 *
 * In-memory Map, `globalThis` üzerinde singleton tutuluyor. Bu sayede
 * Next.js dev server hot-reload'larında map kaybolmaz, ve aynı dev
 * process'te route'lar arası paylaşılır.
 *
 * ⚠ PROD UYARISI:
 * Vercel gibi multi-instance serverless ortamlarda farklı function
 * instance'ları farklı bir Map görür — yani QR akışı koparılır.
 * Production için bunu Redis (Upstash) veya Supabase tablosuna
 * (`caelinus_avatar_session` tablosu) port etmek gerekir. Schema:
 *
 *   create table caelinus_avatar_session (
 *     id text primary key,
 *     status text not null,
 *     created_at timestamptz not null default now(),
 *     expires_at timestamptz not null,
 *     mobile_url text not null,
 *     selfie jsonb,
 *     avatar jsonb,
 *     error_message text,
 *     publisher_id text
 *   );
 *
 * SessionStore arayüzü pluggable — implementasyon yarın değişebilir,
 * çağıranlar dokunulmaz.
 */

import { randomBytes } from "node:crypto";

import type { AvatarSession, SessionStatus } from "./types";

/* ────────── Konfig ────────── */

/** Session TTL — 10 dakika. */
const SESSION_TTL_MS = 10 * 60 * 1000;

/** Cleanup periyodu — her N ms'de expired session'ları sil. */
const CLEANUP_INTERVAL_MS = 60 * 1000;

/* ────────── ID üretimi ────────── */

/**
 * 10 karakter URL-safe base32 id. Güvenlik için RNG; QR'a girecek
 * uzunlukta optimize.
 */
function generateSessionId(): string {
  const bytes = randomBytes(8);
  // Base32 alphabet (RFC 4648, no padding)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "";
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += alphabet[(value << (5 - bits)) & 31];
  }
  return out.slice(0, 10);
}

/* ────────── Singleton in-memory store ────────── */

type StoreShape = {
  sessions: Map<string, AvatarSession>;
  cleanupHandle: NodeJS.Timeout | null;
};

const GLOBAL_KEY = "__caelinus_avatar_session_store__";

function getStore(): StoreShape {
  const g = globalThis as unknown as Record<string, StoreShape | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      sessions: new Map(),
      cleanupHandle: null,
    };
  }
  return g[GLOBAL_KEY]!;
}

/* ────────── Cleanup ────────── */

function cleanup(): void {
  const store = getStore();
  const now = Date.now();
  for (const [id, s] of store.sessions) {
    if (Date.parse(s.expiresAt) < now) {
      store.sessions.delete(id);
    }
  }
}

function ensureCleanupTimer(): void {
  const store = getStore();
  if (store.cleanupHandle) return;
  store.cleanupHandle = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  // Process exit'te leak olmasın
  if (typeof store.cleanupHandle === "object" && store.cleanupHandle && "unref" in store.cleanupHandle) {
    (store.cleanupHandle as { unref?: () => void }).unref?.();
  }
}

/* ────────── Public API ────────── */

export type CreateOptions = {
  /** Mobile sayfanın absolute URL'i — request host'undan üretilir. */
  mobileUrl: string;
  ttlMs?: number;
};

export function createSession({
  mobileUrl,
  ttlMs = SESSION_TTL_MS,
}: CreateOptions): AvatarSession {
  ensureCleanupTimer();
  cleanup();

  const id = generateSessionId();
  const now = new Date();
  const session: AvatarSession = {
    id,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    mobileUrl: mobileUrl.replace("{id}", id),
  };
  getStore().sessions.set(id, session);
  return session;
}

export function getSession(id: string): AvatarSession | null {
  const store = getStore();
  const s = store.sessions.get(id);
  if (!s) return null;
  if (Date.parse(s.expiresAt) < Date.now()) {
    store.sessions.delete(id);
    return null;
  }
  return s;
}

export function patchSession(
  id: string,
  patch: Partial<AvatarSession>,
): AvatarSession | null {
  const store = getStore();
  const cur = store.sessions.get(id);
  if (!cur) return null;
  if (Date.parse(cur.expiresAt) < Date.now()) {
    store.sessions.delete(id);
    return null;
  }
  const next: AvatarSession = { ...cur, ...patch };
  store.sessions.set(id, next);
  return next;
}

export function setStatus(
  id: string,
  status: SessionStatus,
  extra?: Partial<AvatarSession>,
): AvatarSession | null {
  return patchSession(id, { ...extra, status });
}

export function deleteSession(id: string): boolean {
  return getStore().sessions.delete(id);
}

/** Debug — açık session sayısı. */
export function activeSessionCount(): number {
  return getStore().sessions.size;
}

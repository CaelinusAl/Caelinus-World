/**
 * Caelinus Avatar Core — Session Store (pluggable scaffold).
 *
 * S2 değişikliği özetle:
 *   • Eski sync public API (`createSession`, `getSession`, `patchSession`,
 *     `setStatus`, `deleteSession`, `activeSessionCount`) **birebir
 *     korundu** — geriye dönük uyumlu, tek satır caller değişmedi.
 *     Bu API InMemory map'i doğrudan kullanır (sync, hızlı).
 *
 *   • Yeni `sessionStoreAsync` namespace eklendi — Promise döndüren
 *     versiyonlar. Production deploy için (Vercel multi-instance) bu
 *     namespace üzerinden Supabase backend'e geçiş yapılır:
 *       1. Migration 0014 uygulanır
 *       2. CAELINUS_AVATAR_SESSION_STORE=supabase env eklenir
 *       3. Route handler'lar (`app/api/avatar/session/...`) sync API'den
 *          async API'ye taşınır (5-7 dosya, her biri 1-2 satır)
 *       4. UI bir satır değişmez
 *
 *   • SupabaseSessionStore lazy-required (sadece env aktifse yüklenir);
 *     InMemory mode'da Supabase paketi tetiklenmez.
 *
 * ⚠ NOT — bu modül `node:crypto` import ediyor; **server-only**, browser
 * bundle'a kaçmaz. Avatar Core public surface (`index.ts`) sadece
 * server-side route'lardan tüketildiği için bu safe.
 *
 * Schema (Supabase) — `supabase/migrations/0014_caelinus_avatar_session.sql`
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

/* ────────── In-memory singleton ────────── */

type InMemoryShape = {
  sessions: Map<string, AvatarSession>;
  cleanupHandle: NodeJS.Timeout | null;
};

const GLOBAL_KEY = "__caelinus_avatar_session_store__";

function getInMemoryShape(): InMemoryShape {
  const g = globalThis as unknown as Record<string, InMemoryShape | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      sessions: new Map(),
      cleanupHandle: null,
    };
  }
  return g[GLOBAL_KEY]!;
}

function purgeInMemoryExpired(): void {
  const shape = getInMemoryShape();
  const now = Date.now();
  for (const [id, s] of shape.sessions) {
    if (Date.parse(s.expiresAt) < now) {
      shape.sessions.delete(id);
    }
  }
}

function ensureCleanupTimer(): void {
  const shape = getInMemoryShape();
  if (shape.cleanupHandle) return;
  shape.cleanupHandle = setInterval(purgeInMemoryExpired, CLEANUP_INTERVAL_MS);
  if (
    typeof shape.cleanupHandle === "object" &&
    shape.cleanupHandle &&
    "unref" in shape.cleanupHandle
  ) {
    (shape.cleanupHandle as { unref?: () => void }).unref?.();
  }
}

/* ────────── Public sync API (backward-compat) ────────── */

export type CreateOptions = {
  /** Mobile sayfanın absolute URL'i — request host'undan üretilir.
   *  Substring "{id}" varsa generated id ile replace edilir. */
  mobileUrl: string;
  ttlMs?: number;
};

export function createSession({
  mobileUrl,
  ttlMs = SESSION_TTL_MS,
}: CreateOptions): AvatarSession {
  ensureCleanupTimer();
  purgeInMemoryExpired();

  const id = generateSessionId();
  const now = new Date();
  const session: AvatarSession = {
    id,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    mobileUrl: mobileUrl.replace("{id}", id),
  };
  getInMemoryShape().sessions.set(id, session);
  return session;
}

export function getSession(id: string): AvatarSession | null {
  const shape = getInMemoryShape();
  const s = shape.sessions.get(id);
  if (!s) return null;
  if (Date.parse(s.expiresAt) < Date.now()) {
    shape.sessions.delete(id);
    return null;
  }
  return s;
}

export function patchSession(
  id: string,
  patch: Partial<AvatarSession>,
): AvatarSession | null {
  const shape = getInMemoryShape();
  const cur = shape.sessions.get(id);
  if (!cur) return null;
  if (Date.parse(cur.expiresAt) < Date.now()) {
    shape.sessions.delete(id);
    return null;
  }
  const next: AvatarSession = { ...cur, ...patch };
  shape.sessions.set(id, next);
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
  return getInMemoryShape().sessions.delete(id);
}

/** Debug — açık session sayısı. */
export function activeSessionCount(): number {
  return getInMemoryShape().sessions.size;
}

/* ────────── Async pluggable interface ────────── */

/**
 * SessionStore — async backend interface. Bu arayüz Supabase store
 * gibi I/O-bound implementation'lar için zorunlu olan async signature'ı
 * tutar. InMemoryAsyncSessionStore yukarıdaki sync API'leri Promise'a
 * sarar — Supabase aktif olmadığında default budur.
 */
export interface SessionStore {
  create(opts: CreateOptions): Promise<AvatarSession>;
  get(id: string): Promise<AvatarSession | null>;
  patch(id: string, patch: Partial<AvatarSession>): Promise<AvatarSession | null>;
  delete(id: string): Promise<boolean>;
  activeCount(): Promise<number>;
}

class InMemoryAsyncSessionStore implements SessionStore {
  async create(opts: CreateOptions): Promise<AvatarSession> {
    return createSession(opts);
  }
  async get(id: string): Promise<AvatarSession | null> {
    return getSession(id);
  }
  async patch(
    id: string,
    patch: Partial<AvatarSession>,
  ): Promise<AvatarSession | null> {
    return patchSession(id, patch);
  }
  async delete(id: string): Promise<boolean> {
    return deleteSession(id);
  }
  async activeCount(): Promise<number> {
    return activeSessionCount();
  }
}

/* ────────── Pluggable factory ────────── */

let activeStore: SessionStore | null = null;

/**
 * Aktif async store'u env'e göre seç. İlk çağrıda lazily karar verilir,
 * sonraki çağrılar cache'lenmiş instance'ı döner.
 *
 * Şu an default → InMemoryAsyncSessionStore (sync API'leri sarar).
 * Production deploy gate'i:
 *   • CAELINUS_AVATAR_SESSION_STORE=supabase
 *   • SUPABASE_SERVICE_ROLE_KEY
 *   • Migration 0014 uygulanmış olmalı
 *
 * Yükleme başarısız olursa graceful fallback (in-memory). Production'da
 * fallback log'da görünüyorsa deploy eksik demektir.
 */
function getStoreInstance(): SessionStore {
  if (activeStore) return activeStore;

  const wantsSupabase =
    process.env.CAELINUS_AVATAR_SESSION_STORE === "supabase" &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (wantsSupabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("./session-store.supabase") as {
        SupabaseSessionStore: new () => SessionStore;
      };
      activeStore = new mod.SupabaseSessionStore();
      console.info(
        "[caelinus-avatar/session-store] SupabaseSessionStore aktif.",
      );
      return activeStore;
    } catch (err) {
      console.warn(
        "[caelinus-avatar/session-store] SupabaseSessionStore yüklenemedi, in-memory'ye düşülüyor:",
        err,
      );
    }
  }

  activeStore = new InMemoryAsyncSessionStore();
  return activeStore;
}

/**
 * Async-aware namespace — production deploy'da Supabase'e geçildiğinde
 * route handler'lar bu namespace üzerinden çağırır. InMemory mode
 * aktifken sync sürümle aynı semantiği taşır (Promise.resolve sarmalı).
 *
 * Kullanım:
 *   ```ts
 *   import { sessionStoreAsync } from "@/lib/caelinus-avatar-core";
 *   const session = await sessionStoreAsync.create({ mobileUrl });
 *   ```
 */
export const sessionStoreAsync = {
  create: (opts: CreateOptions) => getStoreInstance().create(opts),
  get: (id: string) => getStoreInstance().get(id),
  patch: (id: string, patch: Partial<AvatarSession>) =>
    getStoreInstance().patch(id, patch),
  setStatus: (id: string, status: SessionStatus, extra?: Partial<AvatarSession>) =>
    getStoreInstance().patch(id, { ...extra, status }),
  delete: (id: string) => getStoreInstance().delete(id),
  activeCount: () => getStoreInstance().activeCount(),
};

/** Test/dev'de async store'u manuel inject edebilmek için. */
export function _setSessionStoreForTesting(store: SessionStore | null): void {
  activeStore = store;
}

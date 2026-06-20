/**
 * Caelinus Avatar Core — Supabase-backed SessionStore.
 *
 * In-memory session-store ile aynı interface'i (SessionStore) implement
 * eder, ama state'i Postgres'te (`caelinus_avatar_session` tablosu)
 * tutar. Migration: `supabase/migrations/0014_caelinus_avatar_session.sql`.
 *
 * Multi-instance Vercel deploy'da QR akışı bu sayede koparılmıyor:
 *   • Desktop function instance A → POST /api/avatar/session
 *     → caelinus_avatar_session.insert(...)
 *   • Mobile function instance B → POST /api/avatar/session/{id}/selfie
 *     → caelinus_avatar_session.update(selfie=...) where id=...
 *   • Desktop polling instance C → GET /api/avatar/session/{id}
 *     → caelinus_avatar_session.select() where id=...
 *
 * Activation:
 *   • CAELINUS_AVATAR_SESSION_STORE=supabase
 *   • SUPABASE_SERVICE_ROLE_KEY (admin write erişimi şart)
 *   • Migration 0014 uygulanmış olmalı
 *
 * Route handler'lar `sessionStoreAsync` namespace'i üzerinden await'li
 * çağırır (app/api/avatar/session/**). Env supabase'e çekilince bu store
 * devreye girer; aksi halde in-memory'ye düşülür.
 *
 * KRİTİK: bu modül `server-only` (admin client kullanıyor).
 */

import "server-only";

import { randomBytes } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { CreateOptions, SessionStore } from "./session-store";
import type { AvatarSession, SessionStatus } from "./types";

const SESSION_TTL_MS = 10 * 60 * 1000;

const TABLE = "caelinus_avatar_session" as const;

/* ────────── Row mapping ────────── */

type SessionRow = {
  id: string;
  status: SessionStatus;
  mobile_url: string;
  selfie: AvatarSession["selfie"] | null;
  avatar: AvatarSession["avatar"] | null;
  error_message: string | null;
  publisher_id: string | null;
  created_at: string;
  expires_at: string;
};

function rowToSession(row: SessionRow): AvatarSession {
  const out: AvatarSession = {
    id: row.id,
    status: row.status,
    mobileUrl: row.mobile_url,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
  if (row.selfie) out.selfie = row.selfie;
  if (row.avatar) out.avatar = row.avatar;
  if (row.error_message) out.errorMessage = row.error_message;
  if (row.publisher_id) out.publisherId = row.publisher_id;
  return out;
}

function patchToRow(
  patch: Partial<AvatarSession>,
): Partial<Omit<SessionRow, "id" | "created_at" | "expires_at">> {
  const out: Partial<Omit<SessionRow, "id" | "created_at" | "expires_at">> = {};
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.mobileUrl !== undefined) out.mobile_url = patch.mobileUrl;
  if (patch.selfie !== undefined) out.selfie = patch.selfie ?? null;
  if (patch.avatar !== undefined) out.avatar = patch.avatar ?? null;
  if (patch.errorMessage !== undefined) out.error_message = patch.errorMessage ?? null;
  if (patch.publisherId !== undefined) out.publisher_id = patch.publisherId ?? null;
  return out;
}

/* ────────── ID üretimi (sync API'deki ile birebir aynı) ────────── */

function generateSessionId(): string {
  const bytes = randomBytes(8);
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

/* ────────── Implementation ────────── */

/**
 * Supabase admin client'ın `Database` tipi `caelinus_avatar_session`'ı
 * içermiyor (henüz `supabase gen types` çalıştırılmadı). Untyped erişim
 * ile devam ediyoruz; runtime-safe.
 */
type AdminFromBuilder = {
  insert: (rows: unknown) => {
    select: () => {
      single: () => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
  update: (patch: unknown) => {
    eq: (col: string, val: string) => {
      select: () => {
        single: () => Promise<{
          data: unknown;
          error: { message: string; code?: string } | null;
        }>;
      };
    };
  };
  select: (cols: string, opts?: unknown) => {
    eq: (col: string, val: string) => {
      maybeSingle: () => Promise<{
        data: unknown;
        error: { message: string; code?: string } | null;
      }>;
    };
    gt?: (col: string, val: string) => Promise<{ count: number | null }>;
  };
  delete: () => {
    eq: (col: string, val: string) => Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  };
};

export class SupabaseSessionStore implements SessionStore {
  private get admin() {
    return createSupabaseAdminClient() as unknown as {
      from: (table: string) => AdminFromBuilder;
    };
  }

  async create({
    mobileUrl,
    ttlMs = SESSION_TTL_MS,
  }: CreateOptions): Promise<AvatarSession> {
    const id = generateSessionId();
    const now = new Date();
    const row = {
      id,
      status: "pending" as SessionStatus,
      mobile_url: mobileUrl.replace("{id}", id),
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
    };

    const { data, error } = await this.admin
      .from(TABLE)
      .insert(row)
      .select()
      .single();
    if (error) {
      throw new Error(
        `[caelinus-avatar/session-store] create failed: ${error.message}`,
      );
    }
    return rowToSession(data as SessionRow);
  }

  async get(id: string): Promise<AvatarSession | null> {
    const { data, error } = await this.admin
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.warn(
        `[caelinus-avatar/session-store] get failed: ${error.message}`,
      );
      return null;
    }
    if (!data) return null;
    const row = data as SessionRow;
    if (Date.parse(row.expires_at) < Date.now()) {
      // Lazy expire — silmesini cron / GC fonksiyonuna bırak, burada
      // null dön. (race-condition güvenli; getter side-effect yapmasın)
      return null;
    }
    return rowToSession(row);
  }

  async patch(
    id: string,
    patch: Partial<AvatarSession>,
  ): Promise<AvatarSession | null> {
    const updates = patchToRow(patch);
    if (Object.keys(updates).length === 0) {
      return this.get(id);
    }
    const { data, error } = await this.admin
      .from(TABLE)
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      // PGRST116 = "row not found" — caller bunu null bekliyor
      if (error.code === "PGRST116") return null;
      console.warn(
        `[caelinus-avatar/session-store] patch failed: ${error.message}`,
      );
      return null;
    }
    return rowToSession(data as SessionRow);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.admin
      .from(TABLE)
      .delete()
      .eq("id", id);
    if (error) {
      console.warn(
        `[caelinus-avatar/session-store] delete failed: ${error.message}`,
      );
      return false;
    }
    return true;
  }

  async activeCount(): Promise<number> {
    // Active = expires_at > now() (henüz süresi dolmamış)
    const builder = this.admin
      .from(TABLE)
      .select("id", { count: "exact", head: true });
    const gtFn = builder.gt;
    if (!gtFn) {
      // Fallback — supabase-js v2'de gt her zaman var; tip narrowing için
      console.warn(
        "[caelinus-avatar/session-store] activeCount: gt() bulunamadı, 0 döndürülüyor.",
      );
      return 0;
    }
    const { count } = await gtFn.call(builder, "expires_at", new Date().toISOString());
    return count ?? 0;
  }
}

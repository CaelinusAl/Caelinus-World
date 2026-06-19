/**
 * CAELINUS — Sanri kimlik köprüsü (server)
 *
 * Tek hesap: Supabase. Sanri tarafında kullanıcı, Supabase user UUID'si
 * `X-User-Id` (Sanri `external_id`) olarak geçirilerek temsil edilir.
 * JWT veya secret paylaşımı yok; backend'e dokunmadan birleşik kimlik.
 *
 * Anonim kullanıcı için header gönderilmez → Sanri misafir (0) gibi davranır.
 */

import "server-only";
import { getServerUser } from "@/lib/supabase/server";

/** Giriş yapan kullanıcının Sanri X-User-Id değeri (Supabase UUID) veya null. */
export async function resolveSanriUserId(): Promise<string | null> {
  try {
    const user = await getServerUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** Sanri isteklerine eklenecek kimlik header'ları. */
export async function sanriIdentityHeaders(): Promise<Record<string, string>> {
  const id = await resolveSanriUserId();
  return id ? { "X-User-Id": id } : {};
}

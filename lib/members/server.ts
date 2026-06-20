/**
 * CAELINUS — Frekans Ağı · sunucu okuyucuları (Faz 0)
 *
 * Tüm okumalar RLS-bağlı server client üzerinden yapılır:
 *   • kendi profilin       → profiles (RLS: yalnız sahibi)
 *   • public dizin / profil → public_members view (yalnız güvenli kolonlar)
 *
 * Yazımlar `actions.ts`'te (server action) — RLS `profiles_update_self`
 * sahibin yalnız kendi satırını değiştirmesini garanti eder.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow, PublicMemberRow } from "@/lib/supabase/types";

import {
  mapProfileRow,
  mapPublicMemberRow,
  type MemberFilter,
  type MemberProfile,
  type PublicMember,
} from "./types";

/** Geçerli kullanıcının tam kimliği (private alanlar dahil) veya null. */
export async function getMyMemberProfile(): Promise<MemberProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfileRow(data as ProfileRow);
}

/** handle'a göre public profil (dizin / /u/<handle>) veya null. */
export async function getPublicMember(
  handle: string,
): Promise<PublicMember | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_members")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return mapPublicMemberRow(data as PublicMemberRow);
}

/** Frekans ağı dizini — role / element / yuva-koduna göre filtreli. */
export async function listMembers(
  filter: MemberFilter = {},
): Promise<PublicMember[]> {
  const supabase = await createSupabaseServerClient();
  const limit = Math.min(Math.max(filter.limit ?? 48, 1), 100);
  const offset = Math.max(filter.offset ?? 0, 0);

  let q = supabase.from("public_members").select("*");

  if (filter.role) q = q.contains("roles", [filter.role]);
  if (filter.element) q = q.eq("element", filter.element);
  if (typeof filter.homeCode === "number") q = q.eq("home_code", filter.homeCode);
  if (filter.query && filter.query.trim()) {
    const term = filter.query.trim().replace(/[%,]/g, "");
    q = q.or(
      `display_name.ilike.%${term}%,handle.ilike.%${term}%,headline.ilike.%${term}%`,
    );
  }

  const { data, error } = await q
    .order("network_joined_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];
  return (data as PublicMemberRow[]).map(mapPublicMemberRow);
}

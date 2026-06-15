/**
 * CAELINUS — Ortak Üretim · sunucu okuyucuları (Faz 2)
 *
 * Public akış / profil katkıları → public_contributions view (yayımlanmış
 * + güvenli yazar bilgisi). Kendi katkıların (taslak dahil) → contributions
 * (RLS owner).
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContributionRow,
  PublicContributionRow,
} from "@/lib/supabase/types";

import {
  mapContributionRow,
  mapPublicContributionRow,
  type Contribution,
  type ContributionFilter,
  type PublicContribution,
} from "./types";

/** Public katkı akışı — kind / kod / yazar handle filtreli. */
export async function listContributions(
  filter: ContributionFilter = {},
): Promise<PublicContribution[]> {
  const supabase = await createSupabaseServerClient();
  const limit = Math.min(Math.max(filter.limit ?? 40, 1), 100);
  const offset = Math.max(filter.offset ?? 0, 0);

  let q = supabase.from("public_contributions").select("*");
  if (filter.kind) q = q.eq("kind", filter.kind);
  if (typeof filter.code === "number") q = q.eq("code", filter.code);
  if (filter.authorHandle) q = q.eq("author_handle", filter.authorHandle.toLowerCase());

  const { data, error } = await q
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];
  return (data as PublicContributionRow[]).map(mapPublicContributionRow);
}

/** Tek bir yayımlanmış katkı (detay sayfası). */
export async function getPublicContribution(
  id: string,
): Promise<PublicContribution | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_contributions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapPublicContributionRow(data as PublicContributionRow);
}

/** Bir üyenin (handle) yayımlanmış katkıları — profil sayfası için. */
export async function getMemberContributions(
  handle: string,
  limit = 12,
): Promise<PublicContribution[]> {
  return listContributions({ authorHandle: handle, limit });
}

/** Geçerli kullanıcının tüm katkıları (taslak dahil) — yönetim. */
export async function getMyContributions(): Promise<Contribution[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("author_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContributionRow[]).map(mapContributionRow);
}

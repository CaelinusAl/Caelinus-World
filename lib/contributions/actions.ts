"use server";

/**
 * CAELINUS — Ortak Üretim · server action'lar (Faz 2)
 *
 * Üye katkı ekler/günceller/siler. Hepsi RLS-bağlı server client kullanır;
 * yazar yalnız kendi 'community' katkılarını yönetebilir (kanona yükseltme
 * admin işi).
 */

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import type { ContributionRow } from "@/lib/supabase/types";

import {
  CONTRIBUTION_KIND_META,
  CONTRIBUTION_KINDS,
  mapContributionRow,
  type Contribution,
  type ContributionInput,
} from "./types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function validate(input: ContributionInput): string | null {
  if (!CONTRIBUTION_KINDS.includes(input.kind)) return "Geçersiz katkı türü.";
  const title = (input.title ?? "").trim();
  if (title.length < 1 || title.length > 160) {
    return "Başlık 1–160 karakter olmalı.";
  }
  const meta = CONTRIBUTION_KIND_META[input.kind];
  if (meta.needsBody && !(input.body ?? "").trim()) {
    return "Bu tür için bir metin gerekli.";
  }
  if (meta.needsMedia && !(input.mediaUrl ?? "").trim()) {
    return "Bu tür için bir görsel bağlantısı gerekli.";
  }
  if (
    typeof input.code === "number" &&
    (input.code < 1 || input.code > 81)
  ) {
    return "Kod 1–81 aralığında olmalı.";
  }
  return null;
}

function normalize(input: ContributionInput) {
  return {
    kind: input.kind,
    title: input.title.trim(),
    body: input.body?.trim() ? input.body.trim() : null,
    media_url: input.mediaUrl?.trim() ? input.mediaUrl.trim() : null,
    code:
      typeof input.code === "number" && input.code >= 1 && input.code <= 81
        ? input.code
        : null,
  };
}

export async function createContribution(
  input: ContributionInput,
): Promise<ActionResult<Contribution>> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const payload = {
    ...normalize(input),
    author_user_id: user.id,
    status: "published" as const,
    tier: "community" as const,
    published_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("contributions")
    // payload tip-kontrollü; postgrest write-arg çıkarımı için devirde cast.
    .insert(payload as never)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Katkı kaydedilemedi." };

  revalidatePath("/network/akis");
  return { ok: true, data: mapContributionRow(data as ContributionRow) };
}

export async function updateContribution(
  id: string,
  input: ContributionInput,
): Promise<ActionResult<Contribution>> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { data, error } = await supabase
    .from("contributions")
    .update(normalize(input) as never)
    .eq("id", id)
    .eq("author_user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Katkı bulunamadı." };

  revalidatePath("/network/akis");
  revalidatePath(`/katki/${id}`);
  return { ok: true, data: mapContributionRow(data as ContributionRow) };
}

export async function deleteContribution(
  id: string,
): Promise<ActionResult> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("contributions")
    .delete()
    .eq("id", id)
    .eq("author_user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/network/akis");
  return { ok: true, data: undefined };
}

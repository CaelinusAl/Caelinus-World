"use server";

/**
 * CAELINUS — Atelier moderation: server actions.
 *
 * Three actions:
 *   • approveAtelier  — pending|rejected → approved (sets approved_at)
 *   • rejectAtelier   — pending|approved → rejected (requires reason)
 *   • revertAtelier   — approved|rejected → pending (clears reason)
 *
 * All three pass through the same gate (`requireAdmin`) and use the
 * service-role client so env-only admins (CAELINUS_ADMIN_EMAILS) can
 * moderate even if their email isn't in the `caelinus_admins` table.
 *
 * Each action revalidates `/atelier/admin` and the public atelier slug
 * so the moderation list and the public preview reflect the new state
 * without a full page reload.
 */

import { revalidatePath } from "next/cache";

import { AdminGateError, requireAdmin } from "@/lib/atelier/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AtelierRow, AtelierStatus } from "@/lib/supabase/types";

export type ActionResult =
  | { ok: true; status: AtelierStatus }
  | { ok: false; error: string };

const REJECT_REASON_MAX = 600;

/** Translate gate failures into shapes the client can render directly. */
function gateError(err: unknown): ActionResult {
  if (err instanceof AdminGateError) {
    if (err.reason === "unauthenticated") {
      return { ok: false, error: "Önce Caelinus'a giriş yap." };
    }
    return { ok: false, error: "Bu işlemi yalnızca Caelinus moderatörleri yapabilir." };
  }
  return { ok: false, error: "Bilinmeyen bir hata oluştu." };
}

async function fetchAtelierSlug(id: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("ateliers")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const row = data as Pick<AtelierRow, "slug"> | null;
  return row?.slug ?? null;
}

function bumpCaches(slug: string | null) {
  revalidatePath("/atelier/admin");
  if (slug) revalidatePath(`/atelier/${slug}`);
}

/* ─── approveAtelier ────────────────────────────────────────── */

export async function approveAtelier(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return gateError(err);
  }

  if (!id || typeof id !== "string") {
    return { ok: false, error: "Geçersiz atelier kimliği." };
  }

  const supabase = createSupabaseAdminClient();
  const update: Partial<AtelierRow> = {
    status: "approved",
    approved_at: new Date().toISOString(),
    rejected_reason: null,
  };

  const { data, error } = await supabase
    .from("ateliers")
    // Cast to never to satisfy supabase-js v2.104+ overly-strict update
    // generic; runtime payload is unchanged.
    .update(update as never)
    .eq("id", id)
    .select("status, slug")
    .single();

  if (error) return { ok: false, error: error.message };

  const row = data as Pick<AtelierRow, "status" | "slug"> | null;
  bumpCaches(row?.slug ?? null);
  return { ok: true, status: row?.status ?? "approved" };
}

/* ─── rejectAtelier ─────────────────────────────────────────── */

export async function rejectAtelier(
  id: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return gateError(err);
  }

  if (!id || typeof id !== "string") {
    return { ok: false, error: "Geçersiz atelier kimliği." };
  }
  const trimmed = (reason ?? "").trim();
  if (trimmed.length < 10) {
    return {
      ok: false,
      error: "Geri bildirim en az 10 karakter olmalı — üretici bunu aynen okuyacak.",
    };
  }
  if (trimmed.length > REJECT_REASON_MAX) {
    return {
      ok: false,
      error: `Geri bildirim en fazla ${REJECT_REASON_MAX} karakter olabilir.`,
    };
  }

  const supabase = createSupabaseAdminClient();
  const update: Partial<AtelierRow> = {
    status: "rejected",
    rejected_reason: trimmed,
    approved_at: null,
  };

  const { data, error } = await supabase
    .from("ateliers")
    .update(update as never)
    .eq("id", id)
    .select("status, slug")
    .single();

  if (error) return { ok: false, error: error.message };

  const row = data as Pick<AtelierRow, "status" | "slug"> | null;
  bumpCaches(row?.slug ?? null);
  return { ok: true, status: row?.status ?? "rejected" };
}

/* ─── revertAtelier ─────────────────────────────────────────── */

export async function revertAtelier(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return gateError(err);
  }
  if (!id || typeof id !== "string") {
    return { ok: false, error: "Geçersiz atelier kimliği." };
  }

  const supabase = createSupabaseAdminClient();
  const slug = await fetchAtelierSlug(id);

  const update: Partial<AtelierRow> = {
    status: "pending",
    approved_at: null,
    rejected_reason: null,
  };

  const { data, error } = await supabase
    .from("ateliers")
    .update(update as never)
    .eq("id", id)
    .select("status")
    .single();

  if (error) return { ok: false, error: error.message };

  const row = data as Pick<AtelierRow, "status"> | null;
  bumpCaches(slug);
  return { ok: true, status: row?.status ?? "pending" };
}

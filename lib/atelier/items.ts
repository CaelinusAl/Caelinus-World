/**
 * CAELINUS — Atelier item helpers (server-only).
 *
 * Read paths only — the actual writes happen client-side through the
 * RLS-bound browser client (see `EditAtelierBody` for the established
 * pattern). The helpers here exist so server components can fetch
 * "items for this atelier" with a single, consistent shape.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierItemRow } from "@/lib/supabase/types";

/**
 * Owner-side list. RLS already restricts reads to rows the caller
 * owns + admin overrides, so we just `select *` ordered by position.
 *
 * Returns an empty array on any DB error (the UI shows a generic alert)
 * rather than throwing, so the dashboard never 500s on a transient blip.
 */
export async function listOwnerItems(
  atelierId: string,
): Promise<AtelierItemRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("atelier_items")
    .select(
      [
        "id",
        "atelier_id",
        "collection_id",
        "slug",
        "title_tr",
        "title_en",
        "description_tr",
        "description_en",
        "currency",
        "price_amount",
        "frequency_hz",
        "moods",
        "intent",
        "plant_ids",
        "images",
        "story_tr",
        "story_en",
        "status",
        "position",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("atelier_id", atelierId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as AtelierItemRow[];
}

/**
 * Public showcase list — only items that are publicly visible. RLS
 * already enforces this, but we add the filter explicitly so the query
 * stays readable and so admin sessions don't accidentally surface
 * drafts on the public page.
 */
export async function listPublicItems(
  atelierId: string,
): Promise<AtelierItemRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("atelier_items")
    .select(
      [
        "id",
        "atelier_id",
        "collection_id",
        "slug",
        "title_tr",
        "title_en",
        "description_tr",
        "description_en",
        "currency",
        "price_amount",
        "moods",
        "intent",
        "plant_ids",
        "images",
        "story_tr",
        "story_en",
        "status",
        "position",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("atelier_id", atelierId)
    .in("status", ["published", "sold-out"])
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as AtelierItemRow[];
}

/**
 * Fetch a single item the current user owns. Returns `null` if it
 * doesn't exist, or if the row belongs to a different atelier — RLS
 * collapses both cases into "not found" from the caller's view.
 */
export async function getOwnerItem(
  atelierId: string,
  itemId: string,
): Promise<AtelierItemRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("atelier_items")
    .select("*")
    .eq("atelier_id", atelierId)
    .eq("id", itemId)
    .maybeSingle();
  return (data as AtelierItemRow | null) ?? null;
}

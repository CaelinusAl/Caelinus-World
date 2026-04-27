/**
 * Atelier discovery — `/atelier/kesfet`.
 *
 * Server component that fetches the *full* approved-atelier directory
 * with three filter axes:
 *
 *   • q        — fuzzy name search (case-insensitive ILIKE)
 *   • kind     — atelier_kind enum (cooperative, farmer, artisan, …)
 *   • region   — gaia region id (ege, akdeniz, …)
 *   • province — province slug (only meaningful with a region)
 *
 * Filters live in the URL so they're shareable, indexable, and the
 * back button does the right thing. The `<form>` in `KesfetBody` posts
 * to this same route via GET, so the page works with or without JS.
 *
 * Pagination is offset-based (`?page=N`) at 24 cards per page — small
 * enough that the grid still feels curated, big enough that we don't
 * scroll endlessly on mobile.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AtelierKind } from "@/lib/supabase/types";
import { ATELIER_KINDS } from "@/lib/atelier/validation";
import { PROVINCE_REGIONS, PROVINCES } from "@/data/provinces";

import KesfetBody, { type DiscoveryAtelier } from "./KesfetBody";

export const metadata = {
  title: "Atelier · Keşfet · Caelinus",
  description:
    "Caelinus Atelier dizini — açık tezgâhları zanaat türü, bölge ve isimle keşfedin.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

const VALID_KINDS = new Set<string>(ATELIER_KINDS as readonly string[]);
const VALID_REGIONS = new Set<string>(PROVINCE_REGIONS.map((r) => r.id));
const VALID_PROVINCES = new Set<string>(PROVINCES.map((p) => p.id));

type SearchParams = Record<string, string | string[] | undefined>;

function pickString(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function parsePage(v: string | string[] | undefined): number {
  const s = pickString(v);
  if (!s) return 1;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 200);
}

export default async function KesfetPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const qRaw = pickString(sp.q)?.trim() ?? "";
  const q = qRaw.slice(0, 64);

  const kindRaw = pickString(sp.kind);
  const kind =
    kindRaw && VALID_KINDS.has(kindRaw) ? (kindRaw as AtelierKind) : null;

  const regionRaw = pickString(sp.region);
  const region = regionRaw && VALID_REGIONS.has(regionRaw) ? regionRaw : null;

  const provinceRaw = pickString(sp.province);
  const province =
    provinceRaw && VALID_PROVINCES.has(provinceRaw) ? provinceRaw : null;

  const page = parsePage(sp.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerClient();

  // Build the query progressively. RLS already restricts public reads
  // to status = 'approved', but we re-state it so an accidental policy
  // loosening doesn't surface drafts to the directory.
  let query = supabase
    .from("ateliers")
    .select(
      "slug, name, kind, region, province, cover_image_url, avatar_image_url, bio_tr, bio_en, approved_at",
      { count: "exact" },
    )
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .range(from, to);

  if (kind) query = query.eq("kind", kind);
  if (region) query = query.eq("region", region);
  if (province) query = query.eq("province", province);
  if (q) {
    // Postgres ILIKE — escape the % and _ wildcards so a search for
    // "100%" doesn't match every row. Supabase doesn't expose pg_escape
    // so we sanitise inline.
    const safe = q.replace(/[\\%_]/g, (m) => `\\${m}`);
    query = query.ilike("name", `%${safe}%`);
  }

  const { data, count } = await query;
  const ateliers = (data ?? []) as DiscoveryAtelier[];
  const total = count ?? ateliers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <KesfetBody
      ateliers={ateliers}
      filters={{ q, kind, region, province }}
      page={page}
      totalPages={totalPages}
      total={total}
    />
  );
}

export type { DiscoveryAtelier } from "./KesfetBody";

/**
 * GET /api/play/avatar-previews
 *
 * Returns the warmed avatar matrix — one row per (archetype × zodiac)
 * combo where `scene = "preview"`. The Play dashboard fetches this once
 * on mount and uses each URL as a thumbnail in:
 *   • the zodiac ring pips (active when an archetype is selected),
 *   • the archetype tile photos (signature zodiac per archetype).
 *
 * Reply shape (flat key-value for cheap lookup):
 *   {
 *     ok: true,
 *     count: 84,
 *     previews: { "light-aries": "https://...", "golden-leo": "https://...", ... }
 *   }
 *
 * Cache headers: `s-maxage=86400, stale-while-revalidate=604800`. The
 * matrix is one-shot warmed and rarely changes, so we let Vercel's edge
 * cache hold it for a day. New entries (e.g. a re-warm) become visible
 * within a single SWR cycle.
 *
 * Anonymous-readable — RLS on `play_renders` already exposes a public
 * select policy, so we use the SSR client (anon key is enough).
 */

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PreviewRow = {
  cache_key: string;
  archetype: string;
  zodiac: string;
  url: string;
};

export async function GET() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "supabase init failed" },
      { status: 503 },
    );
  }

  // `cache_key` ends with `-preview` for warmed matrix rows. We filter
  // on the scene column rather than the suffix so a custom-brief entry
  // (which gets a `-b<hash>` tail) can never accidentally show up here.
  const res = await supabase
    .from("play_renders")
    .select("cache_key,archetype,zodiac,url")
    .eq("scene", "preview");

  if (res.error) {
    return NextResponse.json(
      { ok: false, error: res.error.message },
      { status: 500 },
    );
  }

  const rows = (res.data ?? []) as PreviewRow[];

  // Build `archetype-zodiac` → url map. The dashboard uses this exact
  // shape with no further parsing, so we drop the cache_key suffix here
  // (variant / brief tails should already be filtered out by scene=preview).
  const previews: Record<string, string> = {};
  for (const row of rows) {
    if (!row.archetype || !row.zodiac || !row.url) continue;
    const key = `${row.archetype}-${row.zodiac}`;
    previews[key] = row.url;
  }

  return NextResponse.json(
    { ok: true, count: Object.keys(previews).length, previews },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}

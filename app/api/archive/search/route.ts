import { NextResponse } from "next/server";

import { searchCanonicalCodex } from "@/lib/codex/chapter-adapter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json(
      { query, results: [] },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }
  const results = await searchCanonicalCodex(query);
  return NextResponse.json(
    { query, results },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } },
  );
}

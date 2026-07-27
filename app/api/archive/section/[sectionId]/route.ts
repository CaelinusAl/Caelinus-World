import { NextResponse } from "next/server";

import { loadArchiveSection } from "@/lib/codex/archive-data";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sectionId: string }> },
) {
  const { sectionId } = await context.params;
  const section = await loadArchiveSection(sectionId);
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }
  return NextResponse.json(section, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}

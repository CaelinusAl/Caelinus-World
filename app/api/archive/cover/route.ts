import { archiveAssetResponse } from "@/lib/codex/archive-asset-response";
import { resolveArchiveCover } from "@/lib/codex/archive-data";

export const runtime = "nodejs";

export async function GET() {
  const cover = await resolveArchiveCover();
  if (!cover) {
    return Response.json({ error: "Codex cover unavailable" }, { status: 404 });
  }
  return archiveAssetResponse(cover);
}

import { archiveAssetResponse } from "@/lib/codex/archive-asset-response";
import { resolvePublicCodexPage } from "@/lib/codex/archive-data";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ page: string }> },
) {
  const { page } = await context.params;
  const asset = await resolvePublicCodexPage(Number(page));
  if (!asset) {
    return Response.json({ error: "Codex page unavailable" }, { status: 404 });
  }
  return archiveAssetResponse(asset);
}

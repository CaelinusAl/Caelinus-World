import { archiveAssetResponse } from "@/lib/codex/archive-asset-response";
import { resolveArchiveAsset } from "@/lib/codex/archive-data";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await context.params;
  const asset = await resolveArchiveAsset(assetId);
  if (!asset) {
    return Response.json(
      { error: "Archive asset unavailable", assetId },
      { status: 404 },
    );
  }
  return archiveAssetResponse(asset);
}

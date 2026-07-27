import { archiveAssetResponse } from "@/lib/codex/archive-asset-response";
import {
  resolveArchiveAsset,
  resolveGenesisVisualReference,
} from "@/lib/codex/archive-data";

export const runtime = "nodejs";

export async function GET() {
  const reference =
    (await resolveGenesisVisualReference()) ??
    (await resolveArchiveAsset("IMG-CAEL-0050"));
  if (!reference) {
    return Response.json(
      { error: "Genesis visual reference unavailable" },
      { status: 404 },
    );
  }
  return archiveAssetResponse(reference);
}

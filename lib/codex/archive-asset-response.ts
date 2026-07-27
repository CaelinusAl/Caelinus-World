import fs from "node:fs/promises";

import type { ResolvedArchiveAsset } from "./archive-data";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function archiveAssetResponse(asset: ResolvedArchiveAsset) {
  if (asset.source === "remote") {
    return new Response(null, {
      status: 307,
      headers: {
        "Cache-Control": CACHE_CONTROL,
        Location: asset.url,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const body = await fs.readFile(asset.file);
  return new Response(new Uint8Array(body), {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Length": String(asset.bytes),
      "Content-Type": asset.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

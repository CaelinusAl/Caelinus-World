/**
 * scripts/purge-stub-renders.ts — wipes stub-cached /play renders.
 *
 * Why: when the dev server (or prod with no AI key) falls back to the
 * stub provider, `play_renders` rows get persisted with `provider='stub'`
 * and a Storage object that's just a deterministic SVG poster. Once the
 * real provider is configured we want those rows gone so the next
 * generate call actually hits the AI and replaces them with real art.
 *
 * What this script does:
 *   1. Find every `play_renders` row with `provider = 'stub'`.
 *   2. Delete the underlying Storage object from the `play-renders` bucket.
 *   3. Delete the DB row.
 *
 * Safe by default — runs in dry-run mode unless `--apply` is passed.
 *
 * Usage:
 *   npx tsx scripts/purge-stub-renders.ts            # dry run
 *   npx tsx scripts/purge-stub-renders.ts --apply    # actually delete
 *
 * Env: same as warm-play-cache.ts (loads .env.local + .env).
 */

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

function loadDotenv(path: string) {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotenv(".env.local");
loadDotenv(".env");

const APPLY = process.argv.includes("--apply");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "play-renders";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Pulls the Storage object path out of a public bucket URL like
 * `https://<proj>.supabase.co/storage/v1/object/public/play-renders/<path>`.
 * Returns null if the URL doesn't match the expected shape (defensive — we
 * never want to delete the wrong object).
 */
function objectPathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function main() {
  const { data: rows, error } = await admin
    .from("play_renders")
    .select("id, cache_key, url, provider")
    .eq("provider", "stub");

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  const stubRows = rows ?? [];
  console.log(
    `Found ${stubRows.length} stub-cached render row(s) in play_renders.`,
  );
  if (!stubRows.length) return;

  for (const row of stubRows) {
    console.log(`  • ${row.cache_key}`);
  }

  if (!APPLY) {
    console.log("\nDry run — pass --apply to actually delete.");
    return;
  }

  console.log("\nApplying...");

  // Storage objects first; even if these fail, blowing away the row is
  // still useful because `play_renders.cache_key` is the primary lookup.
  const objectPaths = stubRows
    .map((r) => objectPathFromPublicUrl(r.url))
    .filter((p): p is string => p !== null);

  if (objectPaths.length) {
    const { error: storageErr } = await admin.storage
      .from(BUCKET)
      .remove(objectPaths);
    if (storageErr) {
      console.warn(
        `Storage cleanup warning: ${storageErr.message} (rows still removed below)`,
      );
    } else {
      console.log(`  · Removed ${objectPaths.length} storage object(s).`);
    }
  }

  const ids = stubRows.map((r) => r.id);
  const { error: deleteErr } = await admin
    .from("play_renders")
    .delete()
    .in("id", ids);

  if (deleteErr) {
    console.error("Row delete failed:", deleteErr.message);
    process.exit(1);
  }

  console.log(`  · Removed ${ids.length} play_renders row(s).`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

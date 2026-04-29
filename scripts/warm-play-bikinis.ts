/**
 * scripts/warm-play-bikinis.ts — pre-warm the 12 zodiac bikinis.
 *
 * Phase-1 cost-control strategy: rather than spending FASHN credit
 * every time a visitor clicks a bikini tile, we ship the studio with
 * the 12 signature looks already cached in Supabase. After this
 * script runs once, every subsequent click → 0 ms cache hit, 0 cost.
 *
 * What this script does:
 *   1. Pick a fixed canonical render preset:
 *        archetype = "dark"      ← signature CG-figurine pipeline
 *        scene     = "beach"     ← matches the shop hero shots
 *        variant   = 1           ← canonical (non-reroll) seed
 *   2. For each zodiac, find that zodiac's signature bikini (the one
 *      tagged `zodiac: <sign>` in `data/play-outfits.ts`).
 *   3. POST {archetype, zodiac, scene, outfit} to the live render
 *      route — same path a real visitor's browser would hit. The
 *      route handles bare-avatar prerender → FASHN VTON → Supabase
 *      upload → cache row insert in one shot. We just trigger it.
 *
 * Why HTTP and not direct provider calls:
 *   • The route handler already orchestrates: cache lookup → bare
 *     avatar fallback → FASHN dispatch → fallback chain → Supabase
 *     upload → cache row upsert. Replicating that logic in this
 *     script would mean keeping two implementations in sync forever.
 *   • Cache hits resolve instantly with `cached: true` in the body,
 *     so re-running is cheap and idempotent.
 *
 * Usage:
 *   npm run warm-cache:bikinis                  # default (localhost:3000)
 *   BASE_URL=https://your-domain npm run warm-cache:bikinis
 *   npm run warm-cache:bikinis -- --dry-run     # plan only, no calls
 *
 * Required env:
 *   • The TARGET deployment (BASE_URL) must already have FAL_KEY,
 *     OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *     configured. This script doesn't talk to AI providers directly —
 *     it just triggers the render route, which has all the keys.
 *
 * Cost estimate (assuming none of the 12 are cached yet):
 *   • 12 bare avatars (gpt-image-1, default quality): 12 × $0.04 = $0.48
 *   • 12 FASHN VTON transfers (fal-ai/fashn/tryon/v1.6): 12 × $0.075 = $0.90
 *   • Total: $1.38 one-time. After that the gallery is free forever.
 */

import { readFileSync } from "node:fs";

import { PLAY_OUTFITS } from "../data/play-outfits";
import { ZODIACS } from "../data/play-assets";
import type { ZodiacId } from "../data/play-assets";

/* ─── env loader (zero-dep .env / .env.local parser) ─────────── */

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

/* ─── CLI flags + config ─────────────────────────────────────── */

const DRY_RUN = process.argv.includes("--dry-run");
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/* Canonical preset for the warmed gallery. Keep these stable — the
   stylist panel resolves outfit cache keys against this same
   triple, so any change here misses every previously warmed row. */
const ARCHETYPE = "dark" as const;
const SCENE = "beach" as const;
const VARIANT = 1;

/* ─── main ───────────────────────────────────────────────────── */

type Plan = {
  zodiac: ZodiacId;
  outfitId: string;
  outfitName: string;
  imageUrl: string;
};

function planBikinis(): Plan[] {
  const plans: Plan[] = [];
  for (const z of ZODIACS) {
    const bikini = PLAY_OUTFITS.find(
      (o) => o.category === "bikini" && o.zodiac === z.id,
    );
    if (!bikini) {
      console.warn(
        `  ! no signature bikini found for zodiac="${z.id}" — skipping`,
      );
      continue;
    }
    plans.push({
      zodiac: z.id,
      outfitId: bikini.id,
      outfitName: bikini.name,
      imageUrl: bikini.imageUrl,
    });
  }
  return plans;
}

async function triggerRender(plan: Plan, idx: number, total: number) {
  const tag = `[${String(idx + 1).padStart(2, "0")}/${total}] ${plan.zodiac.padEnd(11)} ${plan.outfitId.padEnd(3)}`;

  if (DRY_RUN) {
    console.log(`${tag}  · ${plan.outfitName}  →  would render`);
    return { status: "dry-run" as const };
  }

  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/play/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archetype: ARCHETYPE,
        zodiac: plan.zodiac,
        scene: SCENE,
        variant: VARIANT,
        outfit: plan.outfitId,
        lang: "en",
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${tag}  ✗ network error: ${msg}`);
    return { status: "network-error" as const, msg };
  }

  const dt = Date.now() - t0;
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(
      `${tag}  ✗ ${res.status} (${dt}ms)  ${txt.slice(0, 160)}`,
    );
    return { status: "error" as const, status_code: res.status };
  }

  const j = (await res.json().catch(() => ({}))) as {
    url?: string;
    cached?: boolean;
  };
  if (!j.url) {
    console.error(`${tag}  ✗ no url in response (${dt}ms)`);
    return { status: "no-url" as const };
  }

  const verb = j.cached ? "cached" : "rendered";
  console.log(`${tag}  · ${plan.outfitName.padEnd(28)}  ${verb} (${dt}ms)`);
  return { status: j.cached ? "cached" : "rendered" } as const;
}

async function main() {
  const plans = planBikinis();

  console.log("─── Caelinus bikini warm-up ─────────────────────────");
  console.log(`  base url     : ${BASE_URL}`);
  console.log(`  preset       : archetype=${ARCHETYPE} scene=${SCENE} v${VARIANT}`);
  console.log(`  bikinis      : ${plans.length} / 12 zodiacs`);
  console.log(`  est /call    : ~$0.115 (bare $0.04 + FASHN $0.075)`);
  console.log(`  est total    : ~$${(plans.length * 0.115).toFixed(2)} max (less with cache hits)`);
  console.log(`  dry-run      : ${DRY_RUN}`);
  console.log("─────────────────────────────────────────────────────\n");

  if (plans.length === 0) {
    console.error("✗ No bikinis to warm. Check data/play-outfits.ts.");
    process.exit(1);
  }

  // Smoke-test the target before kicking off paid renders. Catches
  // typos in BASE_URL or a deployment sleeping behind a cold start.
  if (!DRY_RUN) {
    try {
      const probe = await fetch(`${BASE_URL}/api/play/health`);
      if (!probe.ok) {
        console.warn(
          `  ! /api/play/health returned ${probe.status} — proceeding anyway`,
        );
      }
    } catch (err) {
      console.error(
        `✗ Cannot reach ${BASE_URL}. Is dev server running? ` +
          `(${err instanceof Error ? err.message : String(err)})`,
      );
      process.exit(1);
    }
  }

  const t0Total = Date.now();
  const stats = { cached: 0, rendered: 0, errored: 0, dry: 0 };

  for (let i = 0; i < plans.length; i++) {
    const result = await triggerRender(plans[i], i, plans.length);
    if (result.status === "cached") stats.cached++;
    else if (result.status === "rendered") stats.rendered++;
    else if (result.status === "dry-run") stats.dry++;
    else stats.errored++;
  }

  const totalMin = ((Date.now() - t0Total) / 60_000).toFixed(1);
  console.log("\n─── done ────────────────────────────────────────────");
  console.log(`  cached   : ${stats.cached}`);
  console.log(`  rendered : ${stats.rendered}  (~$${(stats.rendered * 0.115).toFixed(2)})`);
  console.log(`  errored  : ${stats.errored}`);
  if (DRY_RUN) console.log(`  dry-run  : ${stats.dry}`);
  console.log(`  elapsed  : ${totalMin} min`);
  console.log("─────────────────────────────────────────────────────\n");

  if (stats.errored > 0 && !DRY_RUN) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("✗ Unhandled error:", err);
  process.exit(1);
});

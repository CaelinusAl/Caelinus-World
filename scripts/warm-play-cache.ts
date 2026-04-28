/**
 * scripts/warm-play-cache.ts — Caelinus avatar matrix warmer.
 *
 * One-shot warmer that pre-renders the 7 × 12 archetype × zodiac matrix
 * (84 portraits) using `scene = "preview"` and seeds the Supabase
 * `play_renders` cache + `play-renders` Storage bucket. Subsequent /play
 * visits get instant thumbnails for the zodiac ring & archetype tiles
 * because the public render endpoint resolves these by `cache_key`.
 *
 * Usage:
 *   npx tsx scripts/warm-play-cache.ts                      # default (replicate)
 *   npx tsx scripts/warm-play-cache.ts --provider=openai    # use gpt-image-1
 *   npx tsx scripts/warm-play-cache.ts --quality=low        # OpenAI quality tier
 *   npx tsx scripts/warm-play-cache.ts --dry-run            # plan only
 *   npx tsx scripts/warm-play-cache.ts --force              # re-render all
 *
 * Required env (loaded from `.env.local`, then `.env`):
 *   NEXT_PUBLIC_SUPABASE_URL    — Supabase project URL (always)
 *   SUPABASE_SERVICE_ROLE_KEY   — service-role key (always)
 *
 *   For --provider=replicate (default):
 *     PLAY_AI_API_KEY           — Replicate API token (`r8_…`)
 *     PLAY_AI_REPLICATE_MODEL   — optional override (default SDXL pinned hash)
 *
 *   For --provider=openai:
 *     OPENAI_API_KEY            — OpenAI API key (`sk-…`)
 *                                 Falls back to PLAY_AI_FALLBACK_API_KEY if
 *                                 OPENAI_API_KEY isn't set.
 *
 * Cost estimate (per call):
 *   Replicate SDXL  : ~$0.04   → 84 × $0.04 = ~$3.40
 *   OpenAI gpt-image-1
 *     quality=low   : ~$0.02   → 84 × $0.02 = ~$1.68
 *     quality=medium: ~$0.07   → 84 × $0.07 = ~$5.88
 *     quality=high  : ~$0.19   → 84 × $0.19 = ~$15.96
 *
 * Idempotent — re-running without `--force` skips rows already in cache.
 */

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { ARCHETYPES, ZODIACS, lookCacheKey } from "../data/play-assets";
import type { ArchetypeId, ZodiacId } from "../data/play-assets";
import { buildPlayPrompt } from "../prompts/play";

/* ─── env loader (zero-dependency .env / .env.local parser) ───── */

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

/* ─── CLI flags ─────────────────────────────────────────────── */

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

function flagValue(name: string, fallback: string): string {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : fallback;
}

type ProviderName = "replicate" | "openai";
type OpenAIQuality = "low" | "medium" | "high" | "auto";

const PROVIDER = flagValue("provider", "replicate") as ProviderName;
const OPENAI_QUALITY = flagValue("quality", "medium") as OpenAIQuality;

if (PROVIDER !== "replicate" && PROVIDER !== "openai") {
  console.error(`✗ Unknown --provider="${PROVIDER}" (use replicate | openai)`);
  process.exit(1);
}
if (
  PROVIDER === "openai" &&
  !["low", "medium", "high", "auto"].includes(OPENAI_QUALITY)
) {
  console.error(
    `✗ Unknown --quality="${OPENAI_QUALITY}" (use low | medium | high | auto)`,
  );
  process.exit(1);
}

const STORAGE_BUCKET = "play-renders";
const SCENE = "preview" as const;

/* ─── env validation ────────────────────────────────────────── */

const REPLICATE_TOKEN = process.env.PLAY_AI_API_KEY;
const REPLICATE_MODEL =
  process.env.PLAY_AI_REPLICATE_MODEL ??
  "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
// OpenAI key: prefer the dedicated env, fall back to the fallback-provider
// slot (used when Vercel has Replicate as primary and OpenAI as backup).
const OPENAI_TOKEN =
  process.env.OPENAI_API_KEY ?? process.env.PLAY_AI_FALLBACK_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY_RUN) {
  if (PROVIDER === "replicate" && !REPLICATE_TOKEN) {
    console.error("✗ Missing PLAY_AI_API_KEY (Replicate token) in .env.local");
    process.exit(1);
  }
  if (PROVIDER === "openai" && !OPENAI_TOKEN) {
    console.error(
      "✗ Missing OPENAI_API_KEY (or PLAY_AI_FALLBACK_API_KEY) in .env.local",
    );
    process.exit(1);
  }
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

/* ─── Provider dispatchers (mirror lib/play/provider.ts) ────── */

type RenderBytes = {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
  /** Which provider actually answered — used in the cache row. */
  provider: ProviderName;
};

/**
 * Top-level dispatch — picks the right backend based on the CLI flag
 * resolved at startup. Each branch stays self-contained (own auth, own
 * shape) so retries and error logs read cleanly.
 */
async function callProvider(prompt: {
  prompt: string;
  negativePrompt: string;
  seed: number;
}): Promise<RenderBytes> {
  if (PROVIDER === "openai") return callOpenAI(prompt);
  return callReplicate(prompt);
}

async function callReplicate(prompt: {
  prompt: string;
  negativePrompt: string;
  seed: number;
}): Promise<RenderBytes> {
  const colonIdx = REPLICATE_MODEL.indexOf(":");
  const version = colonIdx >= 0 ? REPLICATE_MODEL.slice(colonIdx + 1) : "";
  if (!version) {
    throw new Error(
      "PLAY_AI_REPLICATE_MODEL must include a `:<version>` suffix (model SHA)",
    );
  }

  const startRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        prompt: prompt.prompt,
        negative_prompt: prompt.negativePrompt,
        seed: prompt.seed,
        width: 768,
        height: 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 32,
        guidance_scale: 7,
      },
    }),
  });
  if (!startRes.ok) {
    const txt = await startRes.text().catch(() => "");
    throw new Error(
      `Replicate start ${startRes.status}: ${txt.slice(0, 200)}`,
    );
  }
  const startJson = (await startRes.json()) as {
    urls: { get: string };
    status: string;
  };

  type Prediction = {
    status: string;
    output?: string[] | string;
    error?: string | null;
  };

  const deadline = Date.now() + 90_000;
  let prediction: Prediction | null = null;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch(startJson.urls.get, {
      headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
    });
    if (!pollRes.ok) continue;
    prediction = (await pollRes.json()) as Prediction;
    if (
      prediction.status === "succeeded" ||
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      break;
    }
  }
  if (!prediction || prediction.status !== "succeeded") {
    throw new Error(
      `Replicate ${prediction?.status ?? "timeout"}: ${prediction?.error ?? ""}`,
    );
  }
  const url = Array.isArray(prediction.output)
    ? prediction.output[0]
    : prediction.output;
  if (!url) throw new Error("Replicate returned no output URL");

  const imgRes = await fetch(url);
  if (!imgRes.ok) {
    throw new Error(`Replicate output fetch ${imgRes.status}`);
  }
  const buf = new Uint8Array(await imgRes.arrayBuffer());
  const ct = imgRes.headers.get("content-type") ?? "image/png";
  const ext = ct.includes("webp") ? "webp" : ct.includes("jpeg") ? "jpg" : "png";
  return { bytes: buf, contentType: ct, extension: ext, provider: "replicate" };
}

/* ─── OpenAI gpt-image-1 dispatcher ──────────────────────────── */

async function callOpenAI(prompt: {
  prompt: string;
  negativePrompt: string;
  seed: number;
}): Promise<RenderBytes> {
  // gpt-image-1 doesn't take negative prompts the way SDXL does, but the
  // API accepts a free-form prompt string, so we fold the negatives
  // back in as an "avoid:" clause — sticky enough for the model to
  // honour without exploding token usage.
  const finalPrompt =
    `${prompt.prompt}\n\nAvoid: ${prompt.negativePrompt.slice(0, 600)}`.slice(
      0,
      4000,
    );

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: finalPrompt,
      // Portrait so the warmed thumbnail crops the same as the SDXL
      // 768×1024 originals — keeps `object-position: 50% 28%` correct
      // for face placement in the dashboard.
      size: "1024x1536",
      n: 1,
      quality: OPENAI_QUALITY,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 200)}`);
  }
  const j = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image data");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return {
    bytes,
    contentType: "image/png",
    extension: "png",
    provider: "openai",
  };
}

/* ─── main loop ─────────────────────────────────────────────── */

type Combo = { archetype: ArchetypeId; zodiac: ZodiacId };

async function main() {
  const combos: Combo[] = [];
  for (const a of ARCHETYPES) {
    for (const z of ZODIACS) {
      combos.push({ archetype: a.id, zodiac: z.id });
    }
  }

  const modelLabel =
    PROVIDER === "openai"
      ? `openai gpt-image-1 (quality=${OPENAI_QUALITY})`
      : `replicate ${REPLICATE_MODEL.split(":")[0]}`;
  const perCallEstimate =
    PROVIDER === "openai"
      ? OPENAI_QUALITY === "low"
        ? 0.02
        : OPENAI_QUALITY === "high"
          ? 0.19
          : 0.07
      : 0.04;

  console.log("─── Caelinus avatar matrix warmer ───────────────────");
  console.log(`  combinations : ${combos.length}  (${ARCHETYPES.length} × ${ZODIACS.length})`);
  console.log(`  scene        : ${SCENE}`);
  console.log(`  bucket       : ${STORAGE_BUCKET}`);
  console.log(`  provider     : ${PROVIDER}`);
  console.log(`  model        : ${modelLabel}`);
  console.log(`  est /call    : $${perCallEstimate.toFixed(2)}`);
  console.log(`  est total    : $${(perCallEstimate * combos.length).toFixed(2)}`);
  console.log(`  dry-run      : ${DRY_RUN}`);
  console.log(`  force        : ${FORCE}`);
  console.log("─────────────────────────────────────────────────────\n");

  let rendered = 0;
  let skipped = 0;
  let failed = 0;
  const t0Total = Date.now();

  for (let i = 0; i < combos.length; i++) {
    const { archetype, zodiac } = combos[i];
    const cacheKey = lookCacheKey(archetype, zodiac, SCENE);
    const tag = `[${String(i + 1).padStart(2, "0")}/${combos.length}] ${cacheKey.padEnd(28)}`;

    if (!FORCE) {
      const existing = await supabase
        .from("play_renders")
        .select("url")
        .eq("cache_key", cacheKey)
        .maybeSingle();
      if (existing.data?.url) {
        console.log(`${tag}  · cached`);
        skipped++;
        continue;
      }
    }

    if (DRY_RUN) {
      console.log(`${tag}  · would render`);
      continue;
    }

    const t0 = Date.now();
    try {
      const prompt = buildPlayPrompt({ archetype, zodiac, scene: SCENE });
      const render = await callProvider(prompt);
      const objectPath = `${cacheKey}.${render.extension}`;

      const upload = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, render.bytes, {
          contentType: render.contentType,
          upsert: true,
        });
      if (upload.error) throw new Error(`Storage: ${upload.error.message}`);

      const { data: pub } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(objectPath);

      const insert = await supabase
        .from("play_renders")
        .upsert(
          {
            cache_key: cacheKey,
            archetype,
            zodiac,
            scene: SCENE,
            url: pub.publicUrl,
            prompt: prompt.prompt,
            seed: prompt.seed,
            provider: render.provider,
          } as never,
          { onConflict: "cache_key" },
        );
      if (insert.error) throw new Error(`DB: ${insert.error.message}`);

      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`${tag}  · ok ${dt}s`);
      rendered++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${tag}  · FAIL ${msg}`);
      failed++;
    }
  }

  const minutes = ((Date.now() - t0Total) / 60_000).toFixed(1);
  const cost = (rendered * perCallEstimate).toFixed(2);
  console.log("\n─── summary ─────────────────────────────────────────");
  console.log(`  rendered : ${rendered}`);
  console.log(`  skipped  : ${skipped}`);
  console.log(`  failed   : ${failed}`);
  console.log(`  elapsed  : ${minutes} min`);
  console.log(`  est cost : $${cost}`);
  console.log("─────────────────────────────────────────────────────");

  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

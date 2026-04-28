/**
 * Play studio — AI render provider abstraction.
 *
 * Handles the actual call to whichever generator is configured via
 * `PLAY_AI_PROVIDER`. Returns the rendered image as raw bytes plus
 * the content-type so the route handler can stream it into Supabase
 * Storage and persist a public URL.
 *
 * Three providers:
 *
 *   • "replicate" — production default. Uses the Replicate REST API
 *     with SDXL by default (configurable via PLAY_AI_REPLICATE_MODEL).
 *
 *   • "openai" — gpt-image-1, slightly more expensive but no polling.
 *
 *   • "stub" — local fallback. Generates a deterministic SVG placeholder
 *     so the dev server works without any AI credentials. Useful for
 *     UI-only iteration.
 *
 * F2c — When `PLAY_AI_FALLBACK_PROVIDER` is configured, the orchestrator
 * retries once with the secondary provider on any primary failure.
 * Replicate ↔ OpenAI auth tokens differ, so the fallback ships with its
 * own API key (`PLAY_AI_FALLBACK_API_KEY`).
 */

import "server-only";

import { serverEnv } from "@/lib/env";

export type ProviderName = "replicate" | "openai" | "stub";

export type RenderResult = {
  bytes: Uint8Array;
  /** MIME type of the produced image. */
  contentType: string;
  /** Filename extension without dot — used as the storage object suffix. */
  extension: string;
  /** Which provider actually answered (handy for analytics + the cache row). */
  provider: ProviderName;
};

type RenderInput = {
  prompt: string;
  negativePrompt: string;
  seed: number;
  cacheKey: string;
  /**
   * Stylist Caelinus AI — image-edit / virtual try-on mode.
   *
   * When set, the OpenAI provider switches from `/v1/images/generations`
   * (text-to-image) to `/v1/images/edits` (multi-image edit). The model
   * receives the canonical avatar image as the first reference and the
   * real shop product photo as the second reference, and is asked to
   * paint the actual garment onto the goddess while preserving her
   * face, pose, lighting and background scene.
   *
   *   • `avatarUrl`   — public URL of the bare (no-outfit) render that
   *                     was already produced for this triple. Server
   *                     fetches it as bytes for the multipart upload.
   *
   *   • `outfitImagePath` — path UNDER `public/` for the shop hero shot
   *                     (e.g. "/play/shop/taurus-look.jpg"). Read off
   *                     local disk so prod doesn't have to round-trip
   *                     through its own CDN to itself.
   *
   *   • `editPrompt`  — the surgical edit instruction built by
   *                     `buildPlayEditPrompt` in `prompts/play.ts`.
   *                     Different from `input.prompt` (text-to-image),
   *                     which is too verbose for the edit endpoint.
   *
   * Other providers (Replicate, stub) ignore this field and behave as
   * before — falls back to the text-to-image path with the regular
   * prompt + outfit fragment baked in.
   */
  editReferences?: {
    avatarUrl: string;
    outfitImagePath: string;
    editPrompt: string;
  };
};

/**
 * Top-level orchestrator. Picks the configured primary provider, and
 * — when `PLAY_AI_FALLBACK_PROVIDER` is also set — retries once with
 * the secondary on failure.
 *
 * Order of decisions:
 *   1. If primary is `stub` (or no API key), short-circuit to stub.
 *      The fallback config is ignored — there's nothing to fall back
 *      from.
 *   2. Try primary. If it succeeds, return.
 *   3. If a fallback is configured AND its credentials are usable AND
 *      it's not the same provider as primary (would just retry the
 *      same upstream), call it. Stub fallback is allowed because it
 *      never fails and keeps dev sessions visually intact.
 *   4. Otherwise rethrow the primary error so the route surfaces it.
 */
/**
 * Resolves the API key for a given provider. We allow two sources so a
 * single Vercel/local env can keep the auth tokens for both upstreams
 * cleanly separated:
 *
 *   • `PLAY_AI_API_KEY`   — generic slot. Whatever the *primary* provider
 *                            expects. For prod this is usually the only
 *                            key set.
 *   • `OPENAI_API_KEY`    — provider-specific override for OpenAI. Lets a
 *                            local dev keep `PLAY_AI_API_KEY=r8_…` for
 *                            Replicate while still having `OPENAI_API_KEY`
 *                            sit in the same `.env.local`.
 *
 * Replicate has no equivalent override today (no widely-shared token name),
 * so it always reads from `PLAY_AI_API_KEY` (and `PLAY_AI_FALLBACK_API_KEY`
 * when used as a fallback).
 */
function resolveProviderKey(
  provider: ProviderName,
  primarySlot: string | undefined,
): string | undefined {
  if (provider === "openai") {
    return process.env.OPENAI_API_KEY ?? primarySlot;
  }
  return primarySlot;
}

export async function renderPlayImage(input: RenderInput): Promise<RenderResult> {
  const primary = (serverEnv.PLAY_AI_PROVIDER ?? "stub") as ProviderName;
  const primaryKey = resolveProviderKey(primary, serverEnv.PLAY_AI_API_KEY);
  const fallback = serverEnv.PLAY_AI_FALLBACK_PROVIDER as
    | ProviderName
    | undefined;
  const fallbackKey = fallback
    ? resolveProviderKey(fallback, serverEnv.PLAY_AI_FALLBACK_API_KEY)
    : undefined;

  // No real provider possible — stub straight away.
  if (primary === "stub" || !primaryKey) {
    return renderStub(input);
  }

  // Structured timing log so Vercel Logs can be grep'd by cacheKey or
  // outcome. We log start, then either done (with provider + duration)
  // or fail (with the upstream error). Fallback retries log their own
  // start/done so the chain is fully visible.
  const startedAt = Date.now();
  console.log(
    `[play.provider] start provider=${primary} cacheKey=${input.cacheKey} ts=${new Date(
      startedAt,
    ).toISOString()}`,
  );

  try {
    const result = await callProvider(primary, primaryKey!, input);
    console.log(
      `[play.provider] done provider=${result.provider} cacheKey=${input.cacheKey} durationMs=${
        Date.now() - startedAt
      } bytes=${result.bytes.length} contentType=${result.contentType}`,
    );
    return result;
  } catch (primaryErr) {
    const primaryDuration = Date.now() - startedAt;
    const primaryMsg =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.error(
      `[play.provider] fail provider=${primary} cacheKey=${input.cacheKey} durationMs=${primaryDuration} msg=${primaryMsg}`,
    );

    // Decide whether the fallback can actually help.
    const sameProvider = fallback === primary;
    const fallbackUsable =
      fallback === "stub" || (!!fallback && !!fallbackKey);
    if (!fallback || sameProvider || !fallbackUsable) {
      throw primaryErr;
    }

    const fallbackStart = Date.now();
    console.warn(
      `[play.provider] fallback start provider=${fallback} cacheKey=${input.cacheKey} ts=${new Date(
        fallbackStart,
      ).toISOString()} reason=primary_failed`,
    );

    try {
      const fallbackResult = await callProvider(
        fallback,
        fallbackKey ?? "",
        input,
      );
      console.log(
        `[play.provider] fallback done provider=${fallbackResult.provider} cacheKey=${input.cacheKey} durationMs=${
          Date.now() - fallbackStart
        } bytes=${fallbackResult.bytes.length}`,
      );
      return fallbackResult;
    } catch (fallbackErr) {
      // Surface the primary error — that's the one the user originally
      // tried. Log the fallback chain so ops can see both arms blew up.
      console.error(
        `[play.provider] fallback fail provider=${fallback} cacheKey=${input.cacheKey} durationMs=${
          Date.now() - fallbackStart
        } msg=${
          fallbackErr instanceof Error
            ? fallbackErr.message
            : String(fallbackErr)
        }`,
      );
      throw primaryErr;
    }
  }
}

/**
 * Single dispatch point. Each branch is responsible for its own auth
 * and shape — keeping the shared orchestrator boring and testable.
 */
async function callProvider(
  provider: ProviderName,
  token: string,
  input: RenderInput,
): Promise<RenderResult> {
  if (provider === "replicate") return renderReplicate(token, input);
  if (provider === "openai") return renderOpenAI(token, input);
  return renderStub(input);
}

/* ── Replicate ───────────────────────────────────────────────── */

async function renderReplicate(
  token: string,
  input: RenderInput,
): Promise<RenderResult> {
  const model =
    serverEnv.PLAY_AI_REPLICATE_MODEL ??
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

  // Replicate's `predictions` API takes a `version` (the SHA after the
  // colon). `model` slugs without a version aren't accepted by the
  // stable endpoint — split if a version was provided.
  const colonIdx = model.indexOf(":");
  const version = colonIdx >= 0 ? model.slice(colonIdx + 1) : undefined;
  if (!version) {
    throw new Error(
      "[play.provider] PLAY_AI_REPLICATE_MODEL must include a `:<version>` suffix",
    );
  }

  const startRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        prompt: input.prompt,
        negative_prompt: input.negativePrompt,
        seed: input.seed,
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
    throw new Error(`Replicate start failed: ${startRes.status} ${txt.slice(0, 200)}`);
  }

  const startJson = (await startRes.json()) as {
    id: string;
    urls: { get: string };
    status: string;
  };

  // Poll until the prediction succeeds, fails, or we hit our timeout.
  // SDXL usually completes in ~10–25s. We poll every 1.5s up to 60s.
  type Prediction = {
    status: string;
    output?: string[] | string;
    error?: string | null;
  };

  const deadline = Date.now() + 60_000;
  let prediction: Prediction | null = null;

  while (Date.now() < deadline) {
    await sleep(1500);
    const pollRes = await fetch(startJson.urls.get, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) continue;
    const next = (await pollRes.json()) as Prediction;
    prediction = next;
    if (
      next.status === "succeeded" ||
      next.status === "failed" ||
      next.status === "canceled"
    ) {
      break;
    }
  }

  if (!prediction || prediction.status !== "succeeded") {
    throw new Error(
      `Replicate prediction did not succeed (status=${prediction?.status ?? "timeout"}): ${
        prediction?.error ?? ""
      }`,
    );
  }

  const outputUrl = Array.isArray(prediction.output)
    ? prediction.output[0]
    : prediction.output;
  if (!outputUrl) {
    throw new Error("Replicate succeeded but returned no output URL");
  }

  const imgRes = await fetch(outputUrl);
  if (!imgRes.ok) {
    throw new Error(`Replicate output fetch failed: ${imgRes.status}`);
  }
  const buf = new Uint8Array(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get("content-type") ?? "image/png";
  return {
    bytes: buf,
    contentType,
    extension: contentType.includes("webp")
      ? "webp"
      : contentType.includes("jpeg")
        ? "jpg"
        : "png",
    provider: "replicate",
  };
}

/* ── OpenAI gpt-image-1 ──────────────────────────────────────── */

async function renderOpenAI(
  token: string,
  input: RenderInput,
): Promise<RenderResult> {
  // Two pathways:
  //   • editReferences set → multi-image image-edit endpoint (Stylist
  //     Caelinus AI virtual try-on — the AI paints the actual shop
  //     garment onto the existing avatar render).
  //   • otherwise → vanilla text-to-image generation.
  if (input.editReferences) {
    return renderOpenAIEdit(token, input);
  }
  return renderOpenAIGenerate(token, input);
}

async function renderOpenAIGenerate(
  token: string,
  input: RenderInput,
): Promise<RenderResult> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: input.prompt,
      size: "1024x1024",
      n: 1,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI image failed: ${res.status} ${txt.slice(0, 200)}`);
  }
  const j = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image data");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return { bytes, contentType: "image/png", extension: "png", provider: "openai" };
}

/**
 * Stylist Caelinus AI virtual try-on. Posts both reference images
 * (avatar + shop product hero shot) to gpt-image-1's image-edit
 * endpoint as a single multipart form. The model treats the first
 * image as the subject and the second as the source garment, and
 * paints the goddess wearing it.
 *
 * Why two paths and not just always use edit:
 *   • Generations costs ~$0.04/image; edits are ~$0.15. Reserving the
 *     edit endpoint for "the user actively asked to dress the goddess"
 *     keeps the per-session bill under control.
 *   • The edit endpoint requires us to already have a bare avatar
 *     render online — the route handler arranges that ahead of time.
 */
async function renderOpenAIEdit(
  token: string,
  input: RenderInput,
): Promise<RenderResult> {
  const refs = input.editReferences!;

  // Avatar lives in Supabase Storage — fetch over the network.
  const avatarRes = await fetch(refs.avatarUrl);
  if (!avatarRes.ok) {
    throw new Error(
      `OpenAI edit: avatar fetch failed ${avatarRes.status} ${refs.avatarUrl}`,
    );
  }
  const avatarBuf = new Uint8Array(await avatarRes.arrayBuffer());
  const avatarType = avatarRes.headers.get("content-type") ?? "image/png";

  // Outfit reference is a static asset under `public/` — read off the
  // local filesystem so we don't make the server round-trip back through
  // its own CDN to itself (slower + counts against the same budget).
  // Lazy-imported to keep the cold path of the orchestrator small.
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const cleanPath = refs.outfitImagePath.replace(/^\/+/, "");
  const absPath = path.join(process.cwd(), "public", cleanPath);
  let outfitBuf: Buffer;
  try {
    outfitBuf = await fs.readFile(absPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `OpenAI edit: outfit reference missing on disk path=${absPath} err=${msg}`,
    );
  }
  const outfitType = guessImageMime(refs.outfitImagePath);

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", refs.editPrompt);
  form.append("size", "1024x1024");
  form.append("n", "1");
  // gpt-image-1 accepts multiple images under the same `image` key —
  // the first is treated as the subject, subsequent files as visual
  // references the model can pull garment / accessory geometry from.
  form.append(
    "image",
    new Blob([avatarBuf as BlobPart], { type: avatarType }),
    "avatar.png",
  );
  form.append(
    "image",
    new Blob([outfitBuf as BlobPart], { type: outfitType }),
    `outfit.${extFromMime(outfitType)}`,
  );

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // No Content-Type — let fetch set the multipart boundary.
    },
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `OpenAI image-edit failed: ${res.status} ${txt.slice(0, 240)}`,
    );
  }
  const j = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image-edit returned no image data");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return {
    bytes,
    contentType: "image/png",
    extension: "png",
    provider: "openai",
  };
}

function guessImageMime(filename: string): string {
  const f = filename.toLowerCase();
  if (f.endsWith(".jpg") || f.endsWith(".jpeg")) return "image/jpeg";
  if (f.endsWith(".webp")) return "image/webp";
  if (f.endsWith(".gif")) return "image/gif";
  return "image/png";
}

function extFromMime(mime: string): string {
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "png";
}

/* ── Stub (no API key) ───────────────────────────────────────── */

/**
 * Generates a deterministic SVG poster from the prompt's metadata so
 * dev environments without API keys still get *something* visual on
 * screen. This keeps the studio walkable end-to-end during demos.
 */
async function renderStub(input: RenderInput): Promise<RenderResult> {
  // Pick two HSL colours from the cache key so each triple produces a
  // distinct gradient. Same triple → same output (deterministic).
  const h = hash(input.cacheKey);
  const a = (h % 360 + 360) % 360;
  const b = ((h >> 8) % 360 + 360) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 1024" width="768" height="1024">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="hsl(${a}, 80%, 70%)" />
      <stop offset="55%" stop-color="hsl(${b}, 65%, 28%)" />
      <stop offset="100%" stop-color="#0a0816" />
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="40%" r="38%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.45)" />
      <stop offset="40%" stop-color="rgba(255,255,255,0.05)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <circle cx="384" cy="420" r="180" fill="url(#halo)" />
  <circle cx="384" cy="420" r="170" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1" />
  <text x="50%" y="78%" text-anchor="middle" fill="rgba(255,255,255,0.82)" font-family="serif" font-size="42" font-weight="500">${escapeXml(input.cacheKey)}</text>
  <text x="50%" y="84%" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="monospace" font-size="11" letter-spacing="3">CAELINUS · STUB RENDER</text>
</svg>`;

  return {
    bytes: new TextEncoder().encode(svg),
    contentType: "image/svg+xml",
    extension: "svg",
    provider: "stub",
  };
}

/* ── small utilities ─────────────────────────────────────────── */

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

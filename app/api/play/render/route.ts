/**
 * POST /api/play/render
 *
 * Body: { archetype: ArchetypeId, zodiac: ZodiacId, scene: SceneId }
 * Reply: { url: string; cached: boolean }
 *
 * Cache strategy:
 *   1. lookup `play_renders` by `cache_key` — if hit, return immediately,
 *   2. otherwise call the configured AI provider, upload bytes to the
 *      `play-renders` Storage bucket, and persist the cache row.
 *
 * Open to anonymous visitors so the studio works without sign-in. Save
 * + share are gated separately.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ArchetypeId,
  lookCacheKey,
  SceneId,
  ZodiacId,
  ARCHETYPES,
  SCENES,
  ZODIACS,
} from "@/data/play-assets";
import { briefHash, BRIEF_MAX_LENGTH, sanitizeBrief } from "@/lib/play/brief";
import { checkBrief, moderationMessage } from "@/lib/play/moderation";
import { renderPlayImage } from "@/lib/play/provider";
import {
  checkQuota,
  clientKeyFromHeaders,
  recordRender,
} from "@/lib/play/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlayRenderRow } from "@/lib/supabase/types";
import { buildPlayPrompt } from "@/prompts/play";

export const runtime = "nodejs";
// Replicate's polling can stretch close to 60s — opt out of static
// inference and let the route stream while we poll.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ARCHETYPE_IDS = ARCHETYPES.map((a) => a.id) as [ArchetypeId, ...ArchetypeId[]];
const ZODIAC_IDS = ZODIACS.map((z) => z.id) as [ZodiacId, ...ZodiacId[]];
const SCENE_IDS = SCENES.map((s) => s.id) as [SceneId, ...SceneId[]];

const RenderRequestSchema = z.object({
  archetype: z.enum(ARCHETYPE_IDS),
  zodiac: z.enum(ZODIAC_IDS),
  scene: z.enum(SCENE_IDS),
  /**
   * F2a — re-roll index. `1` (default) = canonical render shared
   * across the gallery. Higher values create distinct cache rows
   * keyed `<triple>-v<N>` so users can request a fresh take without
   * polluting the canonical entry.
   *
   * Capped at 8 so a stray client can't farm cents with `?variant=999`.
   */
  variant: z.coerce.number().int().min(1).max(8).optional().default(1),
  /**
   * F2b — optional one-line user brief. Authenticated only; the route
   * sanitises + moderates the value, hashes it into the cache key,
   * and folds it into the AI prompt as a "personal brief" clause.
   * Anonymous requests with a non-empty brief get a 401.
   */
  brief: z.string().max(BRIEF_MAX_LENGTH * 2).optional(),
  /** UI language hint — only used to pick the rejection-message
   *  language when moderation triggers. Defaults to EN. */
  lang: z.enum(["tr", "en"]).optional().default("en"),
});

const STORAGE_BUCKET = "play-renders";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = RenderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { archetype, zodiac, scene, variant, lang } = parsed.data;

  // ── Brief: sanitise → auth → moderate ──────────────────────
  // Anonymous users get the canonical (no-brief) render path. A brief
  // that survives sanitisation but the user isn't signed in → 401 so
  // the client can redirect to /atelier/giris with a `?next` param.
  const cleanBrief = sanitizeBrief(parsed.data.brief);
  if (cleanBrief) {
    const userClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "auth_required", message: "Sign in to use a custom brief." },
        { status: 401 },
      );
    }
    const moderation = checkBrief(cleanBrief);
    if (!moderation.ok) {
      return NextResponse.json(
        {
          error: "moderation_blocked",
          reason: moderation.reason,
          message: moderationMessage(moderation.reason, lang),
        },
        { status: 400 },
      );
    }
  }

  const briefDigest = cleanBrief ? briefHash(cleanBrief) : "";
  const cacheKey = lookCacheKey(archetype, zodiac, scene, variant, briefDigest);

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (err) {
    // No service-role key — we can't read the cache or upload. The
    // client will surface the error and let the user retry once env
    // is wired up.
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Supabase admin client unavailable",
      },
      { status: 503 },
    );
  }

  // 1) Cache hit?
  const cached = await supabase
    .from("play_renders")
    .select("url")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  const cachedRow = cached.data as Pick<PlayRenderRow, "url"> | null;
  if (cachedRow?.url) {
    return NextResponse.json({ url: cachedRow.url, cached: true });
  }

  // Cache miss — every render from here on is a real provider call.
  // Apply the per-IP hourly budget BEFORE we spend any cents.
  const clientKey = clientKeyFromHeaders(req.headers);
  const quota = checkQuota(clientKey);
  if (!quota.ok) {
    const retrySeconds = Math.ceil(quota.retryAfterMs / 1000);
    return NextResponse.json(
      {
        error: "quota_exceeded",
        message:
          `Saatlik render limitine ulaştın (${quota.used}/${quota.limit}). ` +
          `${Math.ceil(retrySeconds / 60)} dakika sonra tekrar dene.`,
        used: quota.used,
        limit: quota.limit,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retrySeconds) },
      },
    );
  }

  // 2) Build prompt + render fresh.
  let prompt;
  try {
    prompt = buildPlayPrompt({
      archetype,
      zodiac,
      scene,
      variant,
      brief: cleanBrief || undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Prompt build failed" },
      { status: 400 },
    );
  }

  let render;
  try {
    render = await renderPlayImage({
      prompt: prompt.prompt,
      negativePrompt: prompt.negativePrompt,
      seed: prompt.seed,
      cacheKey,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI render failed unexpectedly",
      },
      { status: 502 },
    );
  }

  // 3) Upload to Storage. Filename is the cache key — overwrite-safe
  //    so even if two requests race we end up with one canonical file.
  const objectPath = `${cacheKey}.${render.extension}`;
  const upload = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, render.bytes, {
      contentType: render.contentType,
      upsert: true,
    });
  if (upload.error) {
    return NextResponse.json(
      { error: `Storage upload failed: ${upload.error.message}` },
      { status: 502 },
    );
  }

  const { data: pub } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(objectPath);
  const publicUrl = pub.publicUrl;

  // 4) Persist the cache row. If two requests raced, the unique
  //    constraint on `cache_key` will let us treat the conflict as a
  //    no-op and just read the existing row.
  const insert = await supabase
    .from("play_renders")
    .upsert(
      {
        cache_key: cacheKey,
        archetype,
        zodiac,
        scene,
        url: publicUrl,
        prompt: prompt.prompt,
        seed: prompt.seed,
        provider: render.provider,
      } as never,
      { onConflict: "cache_key" },
    )
    .select("url")
    .single();

  const insertedRow = insert.data as Pick<PlayRenderRow, "url"> | null;
  const finalUrl = insertedRow?.url ?? publicUrl;

  // Only count successful, billed renders. Stub renders are free, so
  // skip them — keeps the dev experience friction-free.
  if (render.provider !== "stub") {
    recordRender(clientKey);
  }

  return NextResponse.json({ url: finalUrl, cached: false });
}

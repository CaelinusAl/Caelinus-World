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
import { renderPlayImage } from "@/lib/play/provider";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const { archetype, zodiac, scene } = parsed.data;
  const cacheKey = lookCacheKey(archetype, zodiac, scene);

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

  // 2) Build prompt + render fresh.
  let prompt;
  try {
    prompt = buildPlayPrompt({ archetype, zodiac, scene });
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

  return NextResponse.json({ url: finalUrl, cached: false });
}

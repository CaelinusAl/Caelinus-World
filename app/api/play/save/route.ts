/**
 * POST /api/play/save
 *
 * Body: { archetype, zodiac, scene, renderUrl, cacheKey }
 * Reply: { ok: true, lookId: string } | { error: string }
 *
 * Auth-gated: returns 401 when the caller has no Supabase session.
 * Looks up the existing `play_renders` row (the render route created
 * it earlier) and writes a `user_play_looks` row tied to the user.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ARCHETYPES,
  ArchetypeId,
  SCENES,
  SceneId,
  ZODIACS,
  ZodiacId,
  lookCacheKey,
} from "@/data/play-assets";
import { PLAY_OUTFITS } from "@/data/play-outfits";
import { briefHash, BRIEF_MAX_LENGTH, sanitizeBrief } from "@/lib/play/brief";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlayRenderRow, UserPlayLookRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARCHETYPE_IDS = ARCHETYPES.map((a) => a.id) as [ArchetypeId, ...ArchetypeId[]];
const ZODIAC_IDS = ZODIACS.map((z) => z.id) as [ZodiacId, ...ZodiacId[]];
const SCENE_IDS = SCENES.map((s) => s.id) as [SceneId, ...SceneId[]];
// Mirror the render route's outfit enum so save-then-render paths
// validate consistently. Sentinel guards against an empty catalogue
// (impossible in practice — we ship 27 products).
const OUTFIT_IDS = (PLAY_OUTFITS.length > 0
  ? (PLAY_OUTFITS.map((o) => o.id) as [string, ...string[]])
  : ["__no_outfit__"]) as [string, ...string[]];

const SaveSchema = z.object({
  archetype: z.enum(ARCHETYPE_IDS),
  zodiac: z.enum(ZODIAC_IDS),
  scene: z.enum(SCENE_IDS),
  renderUrl: z.string().url(),
  cacheKey: z.string().min(3).max(96),
  // F2a — when the user saves a re-roll (v2+), the cacheKey carries
  // the suffix; we accept the variant explicitly so server can verify
  // the suffix matches without parsing it back out.
  variant: z.coerce.number().int().min(1).max(8).optional().default(1),
  // F2b — the brief that produced the render, if any. We re-sanitise
  // and re-hash here so the cacheKey verification stays the single
  // source of truth (we don't trust a client-supplied brief hash).
  brief: z.string().max(BRIEF_MAX_LENGTH * 2).optional(),
  // F2c — Stylist Caelinus AI outfit overlay. Optional product id
  // from the live shop catalogue (b1, pr2, j3, …). Folded into the
  // cache key verification so a saved outfit-on look points at the
  // correct play_renders row.
  outfit: z.enum(OUTFIT_IDS).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { archetype, zodiac, scene, renderUrl, cacheKey, variant, outfit } =
    parsed.data;
  const cleanBrief = sanitizeBrief(parsed.data.brief);
  const briefDigest = cleanBrief ? briefHash(cleanBrief) : "";

  // Re-derive the cache key server-side and double-check it matches
  // — keeps clients honest about which triple+variant+brief+outfit
  // they're saving (we recompute briefHash from the brief string to
  // avoid trusting a client-supplied hash; the outfit id is enum-
  // validated above so trusting it is safe).
  if (
    lookCacheKey(archetype, zodiac, scene, variant, briefDigest, outfit ?? "") !==
    cacheKey
  ) {
    return NextResponse.json(
      { error: "Cache key mismatch" },
      { status: 400 },
    );
  }

  // Auth check via the regular server client (RLS-bound). If there's
  // no session, bail out with 401 so the client can route to /atelier/giris.
  const userClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Look up (or — if the cache row somehow vanished — create) the
  // render row. We use the admin client here so we don't have to mess
  // with RLS for a read that's already public.
  const admin = createSupabaseAdminClient();

  const renderLookup = await admin
    .from("play_renders")
    .select("id, url")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  let render = renderLookup.data as Pick<PlayRenderRow, "id" | "url"> | null;

  if (!render) {
    // Persist a minimal cache row so the foreign key holds. This is
    // unusual (the render route always inserts) but keeps SAVE robust
    // against cache eviction or manual deletes.
    const inserted = await admin
      .from("play_renders")
      .insert({
        cache_key: cacheKey,
        archetype,
        zodiac,
        scene,
        url: renderUrl,
      } as never)
      .select("id, url")
      .single();
    if (inserted.error) {
      return NextResponse.json(
        { error: `Could not register render: ${inserted.error.message}` },
        { status: 502 },
      );
    }
    render = inserted.data as Pick<PlayRenderRow, "id" | "url">;
  }

  const insertLook = await admin
    .from("user_play_looks")
    .insert({
      user_id: user.id,
      render_id: render.id,
      archetype,
      zodiac,
      scene,
      render_url: render.url,
    } as never)
    .select("id")
    .single();

  if (insertLook.error) {
    return NextResponse.json(
      { error: `Could not save look: ${insertLook.error.message}` },
      { status: 502 },
    );
  }

  const lookRow = insertLook.data as Pick<UserPlayLookRow, "id"> | null;
  return NextResponse.json({ ok: true, lookId: lookRow?.id ?? null });
}

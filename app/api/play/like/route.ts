/**
 * POST /api/play/like
 *
 * Body: { renderId: uuid }
 * Reply: { ok: true; liked: boolean; count: number } | { error: string }
 *
 * Toggle-like: if the caller has already liked this render, the row is
 * removed and the denormalised counter ticks down via the DB trigger;
 * otherwise we insert and tick up.
 *
 * Auth-gated. Anonymous callers get 401 so the client can bounce them
 * to `/atelier/giris?next=/play/galeri`.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlayLikeRow, PlayRenderRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LikeSchema = z.object({
  renderId: z.string().uuid(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = LikeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { renderId } = parsed.data;

  // Auth check via the RLS-bound client. The admin client is only used
  // afterwards to bypass the read policy on play_renders for the count
  // refresh — actual like writes go through user-bound RLS.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Have they already liked it?
  const existing = await supabase
    .from("play_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("render_id", renderId)
    .maybeSingle();

  if (existing.error) {
    console.warn("[play.like] lookup failed:", existing.error.message);
    return NextResponse.json(
      { error: "Could not read like state" },
      { status: 502 },
    );
  }

  const existingRow = existing.data as Pick<PlayLikeRow, "id"> | null;
  let liked: boolean;

  if (existingRow) {
    // Unlike — DB trigger decrements likes_count.
    const del = await supabase
      .from("play_likes")
      .delete()
      .eq("id", existingRow.id);
    if (del.error) {
      console.warn("[play.like] delete failed:", del.error.message);
      return NextResponse.json(
        { error: "Could not unlike" },
        { status: 502 },
      );
    }
    liked = false;
  } else {
    // Like — DB trigger increments likes_count. Unique constraint
    // (user_id, render_id) protects against double-clicks racing.
    const ins = await supabase
      .from("play_likes")
      .insert({ user_id: user.id, render_id: renderId } as never);
    if (ins.error) {
      console.warn("[play.like] insert failed:", ins.error.message);
      return NextResponse.json(
        { error: "Could not like" },
        { status: 502 },
      );
    }
    liked = true;
  }

  // Read the up-to-date counter. Use the admin client only because
  // play_renders SELECT is `using (true)` anyway — no RLS bypass risk.
  let count = 0;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("play_renders")
      .select("likes_count")
      .eq("id", renderId)
      .maybeSingle();
    const row = data as Pick<PlayRenderRow, "likes_count"> | null;
    count = row?.likes_count ?? 0;
  } catch {
    // No service-role key — best-effort fall back to the regular client.
    const { data } = await supabase
      .from("play_renders")
      .select("likes_count")
      .eq("id", renderId)
      .maybeSingle();
    const row = data as Pick<PlayRenderRow, "likes_count"> | null;
    count = row?.likes_count ?? 0;
  }

  return NextResponse.json({ ok: true, liked, count });
}

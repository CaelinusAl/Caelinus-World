/**
 * POST /api/avatar-test
 *
 * Avatar Testi sonucunu + "% kaç anlattı" verisini kaydeder
 * (avatar_test_results, migration 0018). Anonim doldurulabilir; yazma
 * service-role admin client ile yapılır.
 *
 * Best-effort: Supabase env yoksa veya yazım başarısızsa akış KIRILMAZ —
 * { ok:false } döner, kullanıcı yine sonucunu görür (kart client'ta hesaplanır).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { AVATAR_DISTRICT_ORDER, type AvatarDistrictId } from "@/data/avatar-districts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISTRICTS = AVATAR_DISTRICT_ORDER as [AvatarDistrictId, ...AvatarDistrictId[]];

const BodySchema = z.object({
  primary: z.enum(DISTRICTS),
  secondary: z.enum(DISTRICTS).optional(),
  shadow: z.enum(DISTRICTS),
  gate: z.enum(DISTRICTS),
  calling: z.string().max(80).optional(),
  lightScores: z.record(z.number()).optional(),
  shadowScores: z.record(z.number()).optional(),
  accuracy: z.number().int().min(0).max(100).optional(),
  sessionKey: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("avatar_test_results")
      .insert({
        primary_district: d.primary,
        secondary_district: d.secondary ?? null,
        shadow_district: d.shadow,
        gate_district: d.gate,
        calling: d.calling ?? null,
        light_scores: d.lightScores ?? null,
        shadow_scores: d.shadowScores ?? null,
        accuracy: d.accuracy ?? null,
        session_key: d.sessionKey ?? null,
      } as never)
      .select("id")
      .maybeSingle();

    if (error) {
      // Best-effort: tabloyu/migration'ı yoksa veya RLS engelliyorsa akışı bozma.
      return NextResponse.json({ ok: false, error: "db", detail: error.message });
    }
    return NextResponse.json({ ok: true, id: (data as { id?: string } | null)?.id ?? null });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: "env",
      detail: err instanceof Error ? err.message : "unknown",
    });
  }
}

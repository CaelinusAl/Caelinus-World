/**
 * POST /api/dwell
 *
 * Gaia sahnesi "dwell" (oturum süresi) telemetrisi — başarı metriği:
 * "Gaia'ya giren kullanıcı 30 sn'den fazla kalıyor mu?".
 *
 * İZOLE tablo: public.gaia_dwell (Gaia projesi). Üretim/pilot tablolarına
 * dokunulmaz. Anonim; yazma service-role admin client ile (RLS bypass).
 *
 * Best-effort: gövde bozuksa / DB yoksa akış kırılmaz, { ok:false } döner.
 * navigator.sendBeacon gövdeyi text/blob olarak yollayabildiği için gövde
 * req.text() ile okunup defansif parse edilir.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  scene: z.string().max(40).optional(),
  variant: z.string().max(40).optional(),
  sessionKey: z.string().max(64).optional(),
  dwellMs: z.number().int().min(0).max(86_400_000).optional(),
  interactions: z.number().int().min(0).max(1_000_000).optional(),
  reason: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const d = parsed.data;

  try {
    // gaia_dwell generated Database tiplerinde yok → gevşek client ile yaz.
    const admin = createSupabaseAdminClient() as unknown as SupabaseClient;
    const { error } = await admin.from("gaia_dwell").insert({
      scene: d.scene ?? "gaia",
      variant: d.variant ?? "baseline",
      session_key: d.sessionKey ?? null,
      dwell_ms: d.dwellMs ?? null,
      interactions: d.interactions ?? 0,
      reason: d.reason ?? null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: "db", detail: error.message });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: "env",
      detail: err instanceof Error ? err.message : "unknown",
    });
  }
}

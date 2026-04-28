/**
 * GET /api/play/health
 *
 * Lightweight diagnostics endpoint for the /play studio. Returns the
 * provider configuration (without leaking the actual API keys), whether
 * the Supabase admin client is reachable, and the count of renders that
 * landed in the cache during the last hour.
 *
 * Use cases:
 *   • Pre-demo check: investor / ops opens this URL and instantly
 *     confirms Replicate is wired up before clicking around /play.
 *   • Production probe: poll this from an external uptime monitor.
 *   • Cold-start sanity: surfaces missing env vars / RLS issues before
 *     the first user-triggered render burns provider credits.
 *
 * Response is intentionally read-only and idempotent — no rate limit,
 * no cache, no auth. The body never contains secret material; it only
 * reports presence + length-based "looks like a real key" booleans so
 * that screenshots from this endpoint are safe to share.
 */

import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthResponse = {
  ok: boolean;
  provider: "replicate" | "openai" | "stub";
  primaryKeyConfigured: boolean;
  fallback: "replicate" | "openai" | "stub" | null;
  fallbackKeyConfigured: boolean;
  supabaseOk: boolean;
  recentRenderCount: number | null;
  hourlyBudget: number;
  timestamp: string;
};

export async function GET() {
  const provider = (serverEnv.PLAY_AI_PROVIDER ?? "stub") as
    | "replicate"
    | "openai"
    | "stub";
  const fallback = (serverEnv.PLAY_AI_FALLBACK_PROVIDER ?? null) as
    | "replicate"
    | "openai"
    | "stub"
    | null;

  // Provider-specific key resolution mirrors lib/play/provider.ts so the
  // health probe matches what the actual render path will use. OpenAI
  // accepts an OPENAI_API_KEY override; everything else uses the generic
  // PLAY_AI_API_KEY slot.
  const primaryKeySource =
    provider === "openai"
      ? (process.env.OPENAI_API_KEY ?? serverEnv.PLAY_AI_API_KEY)
      : serverEnv.PLAY_AI_API_KEY;
  const fallbackKeySource =
    fallback === "openai"
      ? (process.env.OPENAI_API_KEY ?? serverEnv.PLAY_AI_FALLBACK_API_KEY)
      : serverEnv.PLAY_AI_FALLBACK_API_KEY;

  // Stub never needs a key; for the real providers we call anything
  // ≥10 chars "looks like a key". Replicate tokens start with `r8_`
  // and OpenAI with `sk-` — both comfortably above the threshold.
  const primaryKeyConfigured =
    provider === "stub" ? true : !!primaryKeySource && primaryKeySource.length > 10;
  const fallbackKeyConfigured =
    !fallback || fallback === "stub"
      ? true
      : !!fallbackKeySource && fallbackKeySource.length > 10;

  // Probe Supabase via the admin client — if the service-role key is
  // missing or the project URL is wrong, the count call below will
  // throw and we'll surface that as supabaseOk=false.
  let supabaseOk = false;
  let recentRenderCount: number | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const since = new Date(Date.now() - 3_600_000).toISOString();
    const { count, error } = await admin
      .from("play_renders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if (!error) {
      supabaseOk = true;
      recentRenderCount = count ?? 0;
    }
  } catch {
    // Service-role missing or network blip — leave supabaseOk=false
    // so the probe fails loudly without crashing the route.
  }

  const ok = primaryKeyConfigured && supabaseOk;

  const body: HealthResponse = {
    ok,
    provider,
    primaryKeyConfigured,
    fallback,
    fallbackKeyConfigured,
    supabaseOk,
    recentRenderCount,
    hourlyBudget: serverEnv.PLAY_AI_HOURLY_BUDGET,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

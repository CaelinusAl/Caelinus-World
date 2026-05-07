/**
 * POST /api/caelinus/jobs/[id]/finalize
 *
 * Kullanıcı match grid'den birini seçtiğinde çağrılır. Body:
 *   { matchId: string }
 *
 * Sunucu finalize pipeline'ını arka planda başlatır (rigging → rendering
 * → polishing → finalized). Client SSE stream'ini açık tutarsa final
 * GeneratedAvatar event olarak gelir.
 *
 * Response:
 *   202 → { job }   — finalize tetiklendi, SSE'yi izle
 *   400 → matchId eksik
 *   404 → job veya match yok
 *   409 → job "matches-ready" durumunda değil
 */

import { NextRequest, NextResponse } from "next/server";

import {
  getJobStore,
  startFinalizeInBackground,
  type JobRecord,
} from "@/lib/caelinus-ai/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

type FinalizeBody = { matchId?: string };

export async function POST(
  req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<{ job: JobRecord } | { error: string }>> {
  const { id } = await params;

  let body: FinalizeBody;
  try {
    body = (await req.json()) as FinalizeBody;
  } catch {
    return NextResponse.json(
      { error: "Geçerli bir JSON gövdesi gönder." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const matchId = body.matchId?.trim();
  if (!matchId) {
    return NextResponse.json(
      { error: "matchId zorunlu." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const store = getJobStore();
  const job = await store.get(id);
  if (!job) {
    return NextResponse.json(
      { error: "Job bulunamadı." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (job.status !== "matches-ready") {
    return NextResponse.json(
      {
        error: `Job henüz finalize için hazır değil (status="${job.status}").`,
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }
  const matchExists = (job.output.matches ?? []).some((m) => m.id === matchId);
  if (!matchExists) {
    return NextResponse.json(
      { error: `Eşleşme bulunamadı: ${matchId}` },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  startFinalizeInBackground(id, matchId);

  return NextResponse.json(
    { job },
    {
      status: 202,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

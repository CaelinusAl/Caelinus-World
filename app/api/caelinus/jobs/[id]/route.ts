/**
 * GET    /api/caelinus/jobs/[id]
 *   Job state'inin tek-seferlik snapshot'ını döner. Polling fallback
 *   olarak kullanılabilir; gerçek "live" deneyim için /stream SSE'yi
 *   kullan.
 *
 * DELETE /api/caelinus/jobs/[id]
 *   Job'u iptal eder. SSE consumer'larına `cancelled` event yayar.
 *   İptal terminaldir — geri alınamaz.
 */

import { NextRequest, NextResponse } from "next/server";

import { getJobStore, type JobRecord } from "@/lib/caelinus-ai/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<{ job: JobRecord } | { error: string }>> {
  const { id } = await params;
  const job = await getJobStore().get(id);
  if (!job) {
    return NextResponse.json(
      { error: "Job bulunamadı veya süresi doldu." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { job },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(
  _req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<{ job: JobRecord } | { error: string }>> {
  const { id } = await params;
  const job = await getJobStore().cancel(id);
  if (!job) {
    return NextResponse.json(
      { error: "Job bulunamadı." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { job },
    { headers: { "Cache-Control": "no-store" } },
  );
}

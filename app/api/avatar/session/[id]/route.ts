/**
 * GET /api/avatar/session/[id]
 *
 * Polling endpoint — desktop her 1.5sn'de bir session state'ini çeker.
 * Mobile selfie yüklediğinde status değişir, desktop bunu görür.
 *
 * Response:
 *   200 → { session }
 *   404 → expired veya yok
 *
 * DELETE /api/avatar/session/[id]
 *   Session'ı manuel sonlandır (kullanıcı vazgeçti).
 */

import { NextRequest, NextResponse } from "next/server";

import { deleteSession, getSession } from "@/lib/caelinus-avatar-core/session-store";
import type { SessionResponse } from "@/lib/caelinus-avatar-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<SessionResponse | { error: string }>> {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json(
      { error: "Session bulunamadı veya süresi doldu." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { session },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(
  _req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<{ ok: boolean }>> {
  const { id } = await params;
  const ok = deleteSession(id);
  return NextResponse.json(
    { ok },
    { headers: { "Cache-Control": "no-store" } },
  );
}

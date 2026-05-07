/**
 * POST /api/avatar/session/[id]/result
 *
 * Desktop tarafı (veya gelecekteki server-side provider) final
 * GeneratedAvatar'ı session'a publish eder, status → "ready".
 * Bu provider-agnostic bir bridge: avatar nereden gelirse gelsin
 * (mock client, server-side AI, Avaturn callback, vs.) aynı endpoint'e
 * yazar.
 *
 * Body (JSON):
 *   { avatar: GeneratedAvatar, publisherId?: string }
 *
 * Response:
 *   200 → { session }  (status = "ready")
 *   400 → invalid
 *   404 → session yok
 *
 * PATCH /api/avatar/session/[id]/result
 *   Status'u "generating" / "error" gibi ara durumlara çekmek için.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession, setStatus } from "@/lib/caelinus-avatar-core";
import type {
  PublishResultRequest,
  PublishResultResponse,
  SessionStatus,
} from "@/lib/caelinus-avatar-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ResultSchema = z.object({
  avatar: z.object({
    id: z.string(),
    glbUrl: z.string(),
    styleProfile: z.unknown(),
    provider: z.string(),
    generatedAt: z.string(),
  }).passthrough(),
  publisherId: z.string().optional(),
});

const PatchSchema = z.object({
  status: z.enum([
    "pending",
    "mobile-connected",
    "selfie-uploading",
    "selfie-received",
    "generating",
    "ready",
    "error",
    "expired",
  ]),
  errorMessage: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(
  req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<PublishResultResponse | { error: string }>> {
  const { id } = await params;

  const session = getSession(id);
  if (!session) {
    return NextResponse.json(
      { error: "Session bulunamadı veya süresi doldu." },
      { status: 404 },
    );
  }

  let body: PublishResultRequest;
  try {
    body = (await req.json()) as PublishResultRequest;
  } catch {
    return NextResponse.json({ error: "JSON gövde gerekli." }, { status: 400 });
  }

  const parsed = ResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz avatar." },
      { status: 400 },
    );
  }

  const updated = setStatus(id, "ready", {
    avatar: parsed.data.avatar as PublishResultRequest["avatar"],
    publisherId: parsed.data.publisherId,
    errorMessage: undefined,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Session güncellenemedi." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { session: updated },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<PublishResultResponse | { error: string }>> {
  const { id } = await params;

  const session = getSession(id);
  if (!session) {
    return NextResponse.json(
      { error: "Session bulunamadı veya süresi doldu." },
      { status: 404 },
    );
  }

  let body: { status: SessionStatus; errorMessage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON gövde gerekli." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz status." },
      { status: 400 },
    );
  }

  const updated = setStatus(id, parsed.data.status, {
    errorMessage: parsed.data.errorMessage,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Session güncellenemedi." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { session: updated },
    { headers: { "Cache-Control": "no-store" } },
  );
}

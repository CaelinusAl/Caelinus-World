/**
 * POST /api/avatar/session/[id]/selfie
 *
 * Mobile selfie upload endpoint. Mobile sayfa kameradan veya upload'tan
 * gelen dataUrl'i buraya gönderir. Backend session'a yazar, status →
 * "selfie-received". Desktop polling bunu görür.
 *
 * Body (JSON):
 *   { dataUrl: "data:image/...", source?: "upload"|"webcam", width?, height? }
 *
 * Validasyon:
 *   • Boyut: data URL ≤ ~3MB (MAX_DATAURL_BYTES) — mobile resize
 *     ediliyor, ama yine de cap koyuyoruz
 *   • MIME: image/jpeg, image/png, image/webp
 *
 * Response:
 *   200 → { session }   (status = "selfie-received")
 *   400 → invalid
 *   404 → session yok
 *   413 → dataUrl çok büyük
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession, setStatus } from "@/lib/caelinus-avatar-core";
import type {
  SelfieUploadRequest,
  SelfieUploadResponse,
} from "@/lib/caelinus-avatar-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DATAURL_BYTES = 3.5 * 1024 * 1024;

const SelfieSchema = z.object({
  dataUrl: z
    .string()
    .startsWith("data:image/")
    .refine((s) => /^data:image\/(png|jpe?g|webp)/.test(s), {
      message: "Desteklenen format: png/jpeg/webp",
    }),
  source: z.enum(["upload", "webcam"]).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(
  req: NextRequest,
  { params }: Ctx,
): Promise<NextResponse<SelfieUploadResponse | { error: string }>> {
  const { id } = await params;

  const session = getSession(id);
  if (!session) {
    return NextResponse.json(
      { error: "Session bulunamadı veya süresi doldu." },
      { status: 404 },
    );
  }

  let body: SelfieUploadRequest;
  try {
    body = (await req.json()) as SelfieUploadRequest;
  } catch {
    return NextResponse.json({ error: "JSON gövde gerekli." }, { status: 400 });
  }

  const parsed = SelfieSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz selfie." },
      { status: 400 },
    );
  }

  if (parsed.data.dataUrl.length > MAX_DATAURL_BYTES) {
    return NextResponse.json(
      { error: "Selfie çok büyük (>3.5MB). Daha düşük çözünürlükle dene." },
      { status: 413 },
    );
  }

  const updated = setStatus(id, "selfie-received", {
    selfie: {
      dataUrl: parsed.data.dataUrl,
      source: parsed.data.source ?? "upload",
      capturedAt: new Date().toISOString(),
      width: parsed.data.width,
      height: parsed.data.height,
    },
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

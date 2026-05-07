/**
 * POST /api/avatar/session
 *
 * Caelinus Avatar Core — yeni QR session yarat. Desktop "Avatarımı
 * Oluştur" tıklandığında çağrılır. Backend bir session id verir,
 * mobile sayfa için absolute URL üretir (request host'undan).
 *
 * Response:
 *   { session: AvatarSession }   — id, mobileUrl, expiresAt
 *
 * Hata durumları:
 *   500 — beklenmeyen
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { createSession } from "@/lib/caelinus-avatar-core";
import type { CreateSessionResponse } from "@/lib/caelinus-avatar-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  // Vercel + reverse proxy: x-forwarded-* header'ları
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(): Promise<NextResponse<CreateSessionResponse | { error: string }>> {
  try {
    const baseUrl = await buildBaseUrl();
    // Mobile sayfa: /caelinus-avatar/m/[id]
    // {id} placeholder'ı session-store içinde gerçek id ile değiştirilir.
    const mobileUrlTemplate = `${baseUrl}/caelinus-avatar/m/{id}`;
    const session = createSession({ mobileUrl: mobileUrlTemplate });

    return NextResponse.json(
      { session },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("[avatar/session] create failed:", err);
    return NextResponse.json(
      { error: "Session yaratılamadı." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/caelinus/jobs
 *
 * Caelinus AI Studio'da yeni bir avatar üretim job'u açar. Body
 * `{ selfie?, style, quality? }` alır → JobRecord (id + initial state)
 * döndürür. Worker arka planda hemen ilerlemeye başlar; client SSE
 * stream'inden progress dinler.
 *
 * Response:
 *   201 → { job }
 *   400 → validation error
 *   429 → too many active jobs (abuse guard, ileride)
 *
 * Authentication: şimdilik anonim. S12'de Supabase auth ile
 * `userId` extract edilecek.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  getJobStore,
  startJobInBackground,
  type JobInput,
  type JobRecord,
} from "@/lib/caelinus-ai/jobs";
import type {
  AvatarStyleProfile,
  SelfieAnalysis,
  SelfieInput,
  SelfieMeta,
} from "@/lib/caelinus-ai";
import { DEFAULT_STYLE_PROFILE } from "@/lib/caelinus-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
  /**
   * Selfie GÖRÜNTÜSÜ — browser-side mimaride GÖNDERİLMEZ (cihazda kalır).
   * Geriye uyumluluk için opsiyonel tutulur.
   */
  selfie?: SelfieInput;
  /** Görüntüsüz selfie metadatası (telemetri). */
  selfieMeta?: SelfieMeta;
  /** Tarayıcıda hesaplanmış MediaPipe selfie analizi (browser-side). */
  analysis?: SelfieAnalysis;
  style?: Partial<AvatarStyleProfile>;
  quality?: "fast" | "balanced" | "high";
  inputHash?: string;
};

function isValidStyle(s: unknown): s is Partial<AvatarStyleProfile> {
  return typeof s === "object" && s !== null;
}

function clientHashFromRequest(req: NextRequest): string {
  // Privacy-preserving fingerprint — IP'yi hash'leyip client tracking için.
  // NextRequest.headers.get('x-forwarded-for') Vercel / Next proxy üzerinden gelir
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  // Basit hash (production'da crypto subtle ile sha256)
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h * 31 + ip.charCodeAt(i)) | 0;
  }
  return `c_${Math.abs(h).toString(36)}`;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<{ job: JobRecord } | { error: string }>> {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: "Geçerli bir JSON gövdesi gönder." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const userStyle = isValidStyle(body.style) ? body.style : {};
  const style: AvatarStyleProfile = {
    ...DEFAULT_STYLE_PROFILE,
    ...userStyle,
    hair: { ...DEFAULT_STYLE_PROFILE.hair, ...(userStyle.hair ?? {}) },
  };

  const input: JobInput = {
    selfie: body.selfie,
    selfieMeta: body.selfieMeta,
    analysis: body.analysis,
    style,
    quality: body.quality ?? "balanced",
    inputHash: body.inputHash,
  };

  const store = getJobStore();
  const job = await store.create(input, {
    providerId: "caelinus-ai-studio-stub",
    providerVersion: "0.1.0",
    clientHash: clientHashFromRequest(req),
  });

  // Worker'ı arka planda fire-and-forget başlat. Response hemen döner.
  startJobInBackground(job.id);

  return NextResponse.json(
    { job },
    {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
        Location: `/api/caelinus/jobs/${job.id}`,
      },
    },
  );
}

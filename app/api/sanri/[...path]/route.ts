/**
 * /api/sanri/[...path] — Sanri FastAPI sunucu proxy'si
 *
 * District Engine'in `sanri` sağlayıcısı tüm çağrıları buradan geçirir.
 * Sorumluluklar:
 *   • Gelen yolu `SANRI_API_URL`'e ilet (örn. /api/sanri/bilinc-alani/ask
 *     → {SANRI_API_URL}/bilinc-alani/ask).
 *   • Giriş yapan kullanıcının `X-User-Id`'sini (Supabase UUID) ekle.
 *   • CORS'u ortadan kaldır (sunucu-sunucu), sırları sunucuda tut.
 *   • Sanri'nin UTF-8 JSON yanıtını aynen döndür.
 *
 * Güvenlik: yalnızca okunabilir/etkileşim uçları beklenir; admin/cron yolları
 * engellenir.
 */

import { serverEnv } from "@/lib/env";
import { sanriIdentityHeaders } from "@/lib/sanri/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOCKED_PREFIXES = ["admin", "shopier", "billing", "bank-transfer", "content/cron"];

function targetUrl(path: string[], search: string): string {
  const base = serverEnv.SANRI_API_URL.replace(/\/$/, "");
  return `${base}/${path.join("/")}${search}`;
}

function isBlocked(path: string[]): boolean {
  const joined = path.join("/").toLowerCase();
  return BLOCKED_PREFIXES.some((p) => joined === p || joined.startsWith(p + "/") || joined.startsWith(p));
}

async function forward(req: Request, path: string[]): Promise<Response> {
  if (!path?.length || isBlocked(path)) {
    return Response.json({ error: "not_allowed" }, { status: 403 });
  }

  const url = new URL(req.url);
  const idHeaders = await sanriIdentityHeaders();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...idHeaders,
  };

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
    headers["Content-Type"] = req.headers.get("content-type") ?? "application/json";
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl(path, url.search), {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "sanri_unreachable" }, { status: 502 });
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, { params }: Ctx) {
  const { path } = await params;
  return forward(req, path);
}

export async function POST(req: Request, { params }: Ctx) {
  const { path } = await params;
  return forward(req, path);
}

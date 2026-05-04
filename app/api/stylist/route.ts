/**
 * POST /api/stylist
 *
 * Vizyon: "AI ile seçtiğin… Bugün ne giysem, gün/gece kombini,
 *          mağazadaki ürünlerle."
 *
 * Bu route *katalog-bound* bir kombin önerisi döndürür. Şu an deterministik
 * `lib/stylist/engine.ts` motorunu kullanıyor — gelecekte AI iyileştirme
 * katmanı (yalnız anlatıyı zenginleştirir, ürün ID'lerini değiştirmez)
 * eklenebilir.
 *
 * Request body:
 *   {
 *     slot: "day" | "night" | "now",
 *     zodiac?: string,
 *     intent?: string,
 *     hour?: number,
 *     lang?: "tr" | "en"
 *   }
 *
 * Response (200):
 *   { ok: true, look: StylistLook }
 *
 * Hatalı body → 400 + { error }.
 *
 * Edge runtime — saf JS, DB yok, yan etki yok.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { buildStylistLook, STYLIST_ZODIACS } from "@/lib/stylist/engine";

export const runtime = "edge";

const BodySchema = z.object({
  slot: z.enum(["day", "night", "now"]),
  zodiac: z
    .string()
    .trim()
    .refine(
      (v) => v.length === 0 || STYLIST_ZODIACS.includes(v),
      "unknown zodiac",
    )
    .optional()
    .or(z.literal("")),
  intent: z.string().trim().max(120).optional().or(z.literal("")),
  hour: z.number().int().min(0).max(23).optional(),
  lang: z.enum(["tr", "en"]).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { slot, zodiac, intent, hour, lang } = parsed.data;

  const look = buildStylistLook(
    {
      slot,
      zodiac: zodiac && zodiac.length > 0 ? zodiac : undefined,
      intent: intent && intent.length > 0 ? intent : undefined,
      hour,
    },
    lang ?? "tr",
  );

  return NextResponse.json({ ok: true, look });
}

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", allowed: ["POST"] },
    { status: 405 },
  );
}

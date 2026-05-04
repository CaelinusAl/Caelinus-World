/**
 * POST /api/avatar/portrait
 *
 * Vizyon: "Saçını seç, gözünü seç — Caelinus AI tanrıçanı çizsin."
 *
 * Kullanıcı `BuilderTraits` paketini gönderir; biz:
 *   1. Trait'leri deterministik DNA hash'ine çeviririz
 *   2. Supabase Storage'da `caelinus-portraits/<dna>.png` var mı diye
 *      bakarız — varsa URL'i döneriz (CACHE HIT, sıfır maliyet)
 *   3. Yoksa OpenAI gpt-image-1'e prompt yollar, 1024×1024 PNG alırız
 *   4. PNG'yi storage'a yükler, public URL'i döneriz
 *
 * Cache stratejisi: content-addressed. Aynı trait kombinasyonu farklı
 * kullanıcılarda = aynı dosya, paylaşılan cache. 12 saç × 11 göz × 7
 * ten × 7 dudak × 3 doku × 3 uzunluk × 3 beden ≈ 174K kombinasyon.
 * Popüler ~5K kombinasyon ~%95 talebi karşılar (~$100 başlangıç
 * maliyet, sonrası bedava).
 *
 * DB satırı tutmuyoruz (play_renders şeması portrait kullanımına
 * uymaz; storage'ın varlığı zaten cache). Daha sonra istatistik
 * gerekirse ayrı `portrait_renders` tablosu eklenir.
 *
 * Anonim erişim açık — selfie yok, kişisel veri yok, abuse riski
 * düşük; rate limit `play.rate-limit`'in IP-based mantığından
 * yararlanır (saat başına 60 fresh render, cache hit'ler sayılmaz).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DEFAULT_TRAITS,
  EYE_COLORS,
  HAIR_COLORS,
  LIP_COLORS,
  SKIN_TONES,
  serializeTraits,
  traitsToPrompt,
  type BuilderTraits,
  type EyeColorId,
  type HairColorId,
  type LipColorId,
  type SkinToneId,
  type BodyShapeId,
  type HairLengthId,
  type HairTextureId,
  type GlyphMode,
  type FrequencyId,
} from "@/lib/avatar/builder";
import { ZODIACS, type ZodiacId } from "@/data/play-assets";
import { renderPlayImage } from "@/lib/play/provider";
import {
  checkQuota,
  clientKeyFromHeaders,
  recordRender,
} from "@/lib/play/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STORAGE_BUCKET = "play-renders";
const PORTRAIT_PREFIX = "caelinus-portraits";

/* ── Zod schema — DEFAULT_TRAITS ile aynı şekil ────────────── */

const SKIN_IDS = SKIN_TONES.map((s) => s.id) as [SkinToneId, ...SkinToneId[]];
const BODY_IDS = ["willow", "hourglass", "moon"] as const satisfies readonly BodyShapeId[];
const LENGTH_IDS = ["short", "medium", "long"] as const satisfies readonly HairLengthId[];
const TEXTURE_IDS = ["straight", "wavy", "curly"] as const satisfies readonly HairTextureId[];
const HAIR_IDS = HAIR_COLORS.map((h) => h.id) as [HairColorId, ...HairColorId[]];
const EYE_IDS = EYE_COLORS.map((e) => e.id) as [EyeColorId, ...EyeColorId[]];
const LIP_IDS = LIP_COLORS.map((l) => l.id) as [LipColorId, ...LipColorId[]];
const ZODIAC_IDS = ZODIACS.map((z) => z.id) as [ZodiacId, ...ZodiacId[]];
const GLYPH_MODES = ["none", "zodiac", "frequency"] as const satisfies readonly GlyphMode[];
const FREQ_IDS = ["396", "417", "528", "639", "741", "852", "963"] as const satisfies readonly FrequencyId[];

const TraitsSchema = z.object({
  skin: z.enum(SKIN_IDS),
  body: z.enum([...BODY_IDS] as [BodyShapeId, ...BodyShapeId[]]),
  hairLength: z.enum([...LENGTH_IDS] as [HairLengthId, ...HairLengthId[]]),
  hairTexture: z.enum([...TEXTURE_IDS] as [HairTextureId, ...HairTextureId[]]),
  hairColor: z.enum(HAIR_IDS),
  eye: z.enum(EYE_IDS),
  lip: z.enum(LIP_IDS),
  zodiac: z.enum(ZODIAC_IDS).nullable(),
  glyph: z.enum([...GLYPH_MODES] as [GlyphMode, ...GlyphMode[]]),
  frequency: z.enum([...FREQ_IDS] as [FrequencyId, ...FrequencyId[]]),
});

const BodySchema = z.object({
  traits: TraitsSchema,
  /** Tanı için debug bilgisi — opsiyonel, response'da geri döner. */
  lang: z.enum(["tr", "en"]).optional(),
});

/* ── DNA → cache path ─────────────────────────────────────── */

/** Stable, kısa SHA-256 hash. DNA string'inden 16-hex prefix. */
async function dnaHash(dna: string): Promise<string> {
  const enc = new TextEncoder().encode(dna);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

/* ── POST handler ──────────────────────────────────────────── */

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
  const traits: BuilderTraits = { ...DEFAULT_TRAITS, ...parsed.data.traits };

  const supabase = createSupabaseAdminClient();
  const dna = serializeTraits(traits);
  const hash = await dnaHash(dna);
  const objectPath = `${PORTRAIT_PREFIX}/${hash}.png`;

  // ── 1. CACHE LOOKUP — storage'da var mı? ────────────────
  // `getPublicUrl` her zaman bir URL string döndürür (varlık check
  // etmez). Gerçekten dosyanın orada olduğunu doğrulamak için
  // `list` ile kontrol ediyoruz.
  const { data: existing, error: listErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(PORTRAIT_PREFIX, {
      search: `${hash}.png`,
      limit: 1,
    });
  if (listErr) {
    // Storage erişim hatası — kritik değil, AI render'a düşeriz
    // ama kullanıcıya yansıyan hız etkisi olur.
    console.warn("[avatar.portrait] storage list failed:", listErr.message);
  }

  if (existing && existing.some((f) => f.name === `${hash}.png`)) {
    const { data: pub } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(objectPath);
    return NextResponse.json({
      ok: true,
      url: pub.publicUrl,
      cached: true,
      dna,
    });
  }

  // ── 2. RATE LIMIT — fresh render anonim de olsa sayılır ─
  const clientKey = clientKeyFromHeaders(req.headers);
  const quota = checkQuota(clientKey);
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: "rate_limit",
        message:
          "Saatlik AI portre limitine ulaştın. Bir saat sonra tekrar dene.",
        retryAfterMs: quota.retryAfterMs,
      },
      { status: 429 },
    );
  }

  // ── 3. AI RENDER ────────────────────────────────────────
  const prompt = traitsToPrompt(traits, parsed.data.lang ?? "en");

  let render;
  try {
    render = await renderPlayImage({
      prompt,
      negativePrompt:
        "ugly, deformed, low quality, watermark, text, logo, multiple people, " +
        "duplicate face, asymmetric eyes, extra limbs, distorted hands",
      seed: parseInt(hash.slice(0, 8), 16),
      cacheKey: `portrait-${hash}`,
      // Provider katmanı — env'den okur. OpenAI gpt-image-1 default.
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[avatar.portrait] AI render failed:", msg);
    return NextResponse.json(
      { error: "ai_render_failed", message: msg },
      { status: 502 },
    );
  }

  if (render.provider !== "stub") {
    recordRender(clientKey);
  }

  // ── 4. STORAGE UPLOAD ───────────────────────────────────
  const upload = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, render.bytes, {
      contentType: render.contentType,
      upsert: true,
    });
  if (upload.error) {
    console.error("[avatar.portrait] storage upload failed:", upload.error.message);
    return NextResponse.json(
      { error: "storage_upload_failed", message: upload.error.message },
      { status: 502 },
    );
  }

  const { data: pub } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(objectPath);

  return NextResponse.json({
    ok: true,
    url: pub.publicUrl,
    cached: false,
    dna,
    provider: render.provider,
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", allowed: ["POST"] },
    { status: 405 },
  );
}

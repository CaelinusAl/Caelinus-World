/**
 * POST /api/moodboard/generate
 *
 * Vizyon: "Bir vibe yaz — Caelinus dört katmanlı sayfa açsın."
 *
 * Kullanıcı bir his yazar (örn. "ilkbahar İznik, ipek, gül soğuğu").
 * Caelinus dört editöryel kareyi paralel üretir:
 *   • 01 ATMOSFER — manzaranın havası, ışık, mevsim
 *   • 02 DOKU      — kumaş / yüzey / malzeme yakını
 *   • 03 FİGÜR     — bedeniyle taşıyan tanrıça portresi
 *   • 04 NESNE     — mücevher / vazo / kâğıt natürmort
 *
 * Ayrıca 5 paragraflık "Caelinus okuması" — manifesto sesinde
 * his → frekans → bedeniyle metni.
 *
 * Mimari:
 *   1. Vibe + lang → SHA-256 hash → content-addressed cache lookup
 *      (`caelinus-moodboards/<hash>/manifest.json`)
 *   2. Cache hit → JSON döndür (sıfır maliyet, paylaşılan)
 *   3. Cache miss:
 *      a. GPT-4o-mini chat (JSON mode) — vibe'ı 4 İngilizce prompt'a
 *         + 5 paragraflık okumaya çevirir (Caelinus sesinde)
 *      b. 4 paralel `renderPlayImage` çağrısı (provider abstraction
 *         OpenAI gpt-image-1 / Replicate / stub fallback yönetir)
 *      c. 4 PNG'yi Supabase Storage'a yükle
 *      d. Manifest JSON'unu da yükle
 *      e. Public URL'leri döndür
 *
 * Maliyet: ~$0.10 per unique vibe ($0.02 × 4 image + $0.001 chat).
 * Cache hit = 0. Saatlik IP-bazında rate limit.
 *
 * Storage:
 *   `caelinus-moodboards/<hash>/{atmosfer,doku,figur,nesne}.<ext>`
 *   `caelinus-moodboards/<hash>/manifest.json`
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { serverEnv } from "@/lib/env";
import {
  checkQuota,
  clientKeyFromHeaders,
  recordRender,
} from "@/lib/play/rate-limit";
import { renderPlayImage } from "@/lib/play/provider";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STORAGE_BUCKET = "play-renders";
const MOODBOARD_PREFIX = "caelinus-moodboards";

const NEGATIVE_PROMPT =
  "lowres, blurry, watermark, signature, frame, border, logo, text, " +
  "extra fingers, bad anatomy, oversaturated, plastic, stock photo, " +
  "cluttered, busy background, ugly composition";

const BodySchema = z.object({
  vibe: z.string().trim().min(2).max(160),
  lang: z.enum(["tr", "en"]).optional(),
});

type LayerKey = "atmosfer" | "doku" | "figur" | "nesne";
type LayerLabel = { tr: string; en: string };

const LAYER_LABELS: Record<LayerKey, LayerLabel> = {
  atmosfer: { tr: "Atmosfer", en: "Atmosphere" },
  doku: { tr: "Doku", en: "Texture" },
  figur: { tr: "Figür", en: "Figure" },
  nesne: { tr: "Nesne", en: "Object" },
};

type ManifestPayload = {
  vibe: string;
  hash: string;
  lang: "tr" | "en";
  createdAt: string;
  prompts: Record<LayerKey, string>;
  layers: Record<LayerKey, { url: string; label: LayerLabel }>;
  reading: string[];
};

/* ── DNA hash ─────────────────────────────────────────────── */

async function vibeHash(vibe: string, lang: string): Promise<string> {
  const enc = new TextEncoder().encode(`${vibe.toLowerCase()}|${lang}`);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

/* ── Caelinus stylist system prompt — okur + 4 prompt üretir ── */

const CAELINUS_SYSTEM_TR = `Sen Caelinus'sun: gökyüzüne ait olan moda + bilinç markası.
Manifestonun sesi: bedenin tapınak olduğunu, toprağın anne olduğunu,
modanın ritüel olduğunu hatırlatan; Solfeggio frekanslarıyla, Anadolu
köklerleriyle ve kozmik bilinçle dokunan.

Kullanıcı sana bir "vibe" verir — bir mevsim, bir renk, bir his, bir
hatıra. Sen bu vibe'dan dört editöryel kare ve bir okuma üretirsin.

ÇIKTI: Sadece geçerli JSON. Açıklama yazma, kod bloğu kullanma. Şema:

{
  "atmosfer_prompt": "İngilizce gpt-image-1 prompt'u; manzara/atmosfer karesi; insan yok ya da uzaktan tek silüet; sinematik painterly, anti-stock, Anadolu izleri, no text",
  "doku_prompt":     "İngilizce gpt-image-1 prompt'u; tek bir kumaş/yüzey/malzeme yakın çekim; ipek/keten/seramik/su/altın gibi; macro detail, no people, painterly soft light",
  "figur_prompt":    "İngilizce gpt-image-1 prompt'u; tek bir editorial tanrıça portresi; vibe'ın enerjisini bedeniyle taşıyan; painterly cinematic; no text/logo; soft moody light; chest up",
  "nesne_prompt":    "İngilizce gpt-image-1 prompt'u; vibe'a uygun küçük natürmort; mücevher/kitap/kuru çiçek/vazo/küçük şişe; warm soft light; styled flatlay or table arrangement; no people",
  "reading": [
    "Caelinus sesinde 1-2 cümle. Vibe'ın ilk hatırasını oku.",
    "İkinci paragraf — vibe'da hangi Solfeggio frekansı titriyor (396, 417, 528, 639, 741, 852, 963'ten birini seç ve neden olduğunu söyle).",
    "Üçüncü paragraf — bedeniyle nasıl giyilir? hangi kumaş, hangi siluet, hangi ten, hangi adım.",
    "Dördüncü paragraf — Anadolu'nun hangi köşesinden gelir bu his? hangi bitki, hangi taş, hangi kadın.",
    "Beşinci paragraf — kapanış. Tek cümle. Çağrı."
  ]
}

İngilizce prompt'lar TÜRKÇE değil; gpt-image-1 İngilizce'de daha tutarlı.
Reading paragrafları manifestonun sesinde, kısa, ritüel, ikinci tekil
şahıs ("sen") yaz. Asla marka adını "Caelinus" prompt'larda kullanma.
"Anatolian", "painterly", "cinematic", "soft moody light" gibi tarz
ipuçları kullan.`;

const CAELINUS_SYSTEM_EN = `You are Caelinus: the celestial fashion + consciousness brand.
Voice of the manifesto: the body is a temple, earth is a mother, fashion
is a ritual; tuned to Solfeggio frequencies, Anatolian roots, cosmic
consciousness.

The user gives you a "vibe" — a season, a color, a feeling, a memory.
You produce four editorial cards and a reading from it.

OUTPUT: Valid JSON only. No prose, no code fences. Schema:

{
  "atmosfer_prompt": "English gpt-image-1 prompt; landscape/atmosphere card; no people or one distant silhouette; cinematic painterly, anti-stock, Anatolian hints, no text",
  "doku_prompt":     "English gpt-image-1 prompt; single fabric/surface/material macro close-up; silk/linen/ceramic/water/gold; macro detail, no people, painterly soft light",
  "figur_prompt":    "English gpt-image-1 prompt; single editorial goddess portrait carrying the vibe's energy in her body; painterly cinematic; no text/logo; soft moody light; chest up",
  "nesne_prompt":    "English gpt-image-1 prompt; small still life matching the vibe; jewelry/book/dried flower/vase/small bottle; warm soft light; styled flatlay or table arrangement; no people",
  "reading": [
    "1-2 short sentences in Caelinus voice. Read the first memory of the vibe.",
    "Paragraph 2 — which Solfeggio frequency vibrates here (pick from 396, 417, 528, 639, 741, 852, 963 and say why).",
    "Paragraph 3 — how is this worn on the body? which fabric, which silhouette, which skin, which step.",
    "Paragraph 4 — from which corner of Anatolia does this feeling come? which plant, which stone, which woman.",
    "Paragraph 5 — closing. One sentence. A call."
  ]
}

Reading paragraphs in user's language, in manifesto voice: short, ritual,
2nd person ("you"). Never use the brand name "Caelinus" inside the
image prompts.`;

/* ── GPT-4o-mini chat — vibe → prompts + reading ────────── */

type GPT4oMiniResponse = {
  atmosfer_prompt: string;
  doku_prompt: string;
  figur_prompt: string;
  nesne_prompt: string;
  reading: string[];
};

async function expandVibe(
  apiKey: string,
  vibe: string,
  lang: "tr" | "en",
): Promise<GPT4oMiniResponse> {
  const systemPrompt = lang === "tr" ? CAELINUS_SYSTEM_TR : CAELINUS_SYSTEM_EN;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: vibe },
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 1100,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`gpt-4o-mini failed: ${res.status} ${txt.slice(0, 240)}`);
  }
  const j = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = j.choices?.[0]?.message?.content;
  if (!raw) throw new Error("gpt-4o-mini returned empty");
  const parsed = JSON.parse(raw) as GPT4oMiniResponse;
  if (
    !parsed.atmosfer_prompt ||
    !parsed.doku_prompt ||
    !parsed.figur_prompt ||
    !parsed.nesne_prompt ||
    !Array.isArray(parsed.reading) ||
    parsed.reading.length < 3
  ) {
    throw new Error("gpt-4o-mini returned malformed JSON");
  }
  return parsed;
}

/* ── Deterministic per-layer seed (stable cache key) ─────── */

function seedFromHash(hash: string, layer: LayerKey): number {
  // Trim 8 hex chars + layer index → 32-bit unsigned int. Keeps the
  // same seed for the same vibe so a re-run lands on the same cell of
  // the provider's noise space. Different layers diverge.
  const layerIdx = ["atmosfer", "doku", "figur", "nesne"].indexOf(layer);
  const slice = hash.slice(0, 8);
  const base = parseInt(slice, 16) | 0;
  return Math.abs((base ^ (layerIdx * 0x9e3779b1)) >>> 0) % 2_147_483_647;
}

/* ── POST handler ────────────────────────────────────────── */

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
  const { vibe } = parsed.data;
  const lang = parsed.data.lang ?? "tr";

  // OpenAI API key — chat completion (gpt-4o-mini) için gerekli.
  // Image rendering renderPlayImage'in içinden gider.
  const openaiKey = process.env.OPENAI_API_KEY ?? serverEnv.PLAY_AI_API_KEY;
  if (!openaiKey || !openaiKey.startsWith("sk-")) {
    return NextResponse.json(
      {
        error: "openai_key_missing",
        message:
          "OPENAI_API_KEY ortam değişkeni gerekli (chat completion için).",
      },
      { status: 503 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const hash = await vibeHash(vibe, lang);
  const manifestPath = `${MOODBOARD_PREFIX}/${hash}/manifest.json`;

  // ── 1. CACHE LOOKUP ─────────────────────────────────
  try {
    const { data: dl, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(manifestPath);
    if (!error && dl) {
      const text = await dl.text();
      const manifest = JSON.parse(text) as ManifestPayload;
      return NextResponse.json({ ok: true, cached: true, ...manifest });
    }
  } catch {
    // Cache miss; sessizce devam.
  }

  // ── 2. RATE LIMIT (saatlik) ──────────────────────────
  const clientKey = clientKeyFromHeaders(req.headers);
  const quota = checkQuota(clientKey);
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: "rate_limit",
        message:
          lang === "tr"
            ? "Saatlik moodboard limitine ulaştın. Bir saat sonra tekrar dene."
            : "Hourly moodboard limit reached. Try again in an hour.",
        retryAfterMs: quota.retryAfterMs,
      },
      { status: 429 },
    );
  }

  // ── 3. GPT-4o-mini → vibe expand ─────────────────────
  let expand: GPT4oMiniResponse;
  try {
    expand = await expandVibe(openaiKey, vibe, lang);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "expand_failed", message: msg },
      { status: 502 },
    );
  }

  // ── 4. 4 paralel renderPlayImage çağrısı ─────────────
  const layerKeys: LayerKey[] = ["atmosfer", "doku", "figur", "nesne"];
  const promptByLayer: Record<LayerKey, string> = {
    atmosfer: expand.atmosfer_prompt,
    doku: expand.doku_prompt,
    figur: expand.figur_prompt,
    nesne: expand.nesne_prompt,
  };

  const renders = await Promise.allSettled(
    layerKeys.map((k) =>
      renderPlayImage({
        prompt: promptByLayer[k],
        negativePrompt: NEGATIVE_PROMPT,
        seed: seedFromHash(hash, k),
        cacheKey: `moodboard:${hash}:${k}`,
      }),
    ),
  );

  const failedIdx = renders.findIndex((r) => r.status === "rejected");
  if (failedIdx >= 0) {
    const reason = (renders[failedIdx] as PromiseRejectedResult).reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    return NextResponse.json(
      {
        error: "image_render_failed",
        layer: layerKeys[failedIdx],
        message: msg,
      },
      { status: 502 },
    );
  }

  recordRender(clientKey);

  // ── 5. Storage upload — 4 image + manifest.json ──────
  const layers: Record<LayerKey, { url: string; label: LayerLabel }> = {
    atmosfer: { url: "", label: LAYER_LABELS.atmosfer },
    doku: { url: "", label: LAYER_LABELS.doku },
    figur: { url: "", label: LAYER_LABELS.figur },
    nesne: { url: "", label: LAYER_LABELS.nesne },
  };

  for (let i = 0; i < layerKeys.length; i++) {
    const k = layerKeys[i];
    const r = renders[i] as PromiseFulfilledResult<{
      bytes: Uint8Array;
      contentType: string;
      extension: string;
    }>;
    const path = `${MOODBOARD_PREFIX}/${hash}/${k}.${r.value.extension}`;
    const up = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, r.value.bytes, {
        contentType: r.value.contentType,
        upsert: true,
      });
    if (up.error) {
      return NextResponse.json(
        {
          error: "storage_upload_failed",
          layer: k,
          message: up.error.message,
        },
        { status: 502 },
      );
    }
    const { data: pub } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    layers[k].url = pub.publicUrl;
  }

  const manifest: ManifestPayload = {
    vibe,
    hash,
    lang,
    createdAt: new Date().toISOString(),
    prompts: promptByLayer,
    layers,
    reading: expand.reading,
  };

  // Manifest JSON cache — sonraki çağrılarda 4 image yüklemeye gerek
  // yok, tek dosya download yeter.
  await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(manifestPath, new TextEncoder().encode(JSON.stringify(manifest)), {
      contentType: "application/json",
      upsert: true,
    });

  return NextResponse.json({ ok: true, cached: false, ...manifest });
}

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", allowed: ["POST"] },
    { status: 405 },
  );
}

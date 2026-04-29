/**
 * POST /api/play/render
 *
 * Body: { archetype: ArchetypeId, zodiac: ZodiacId, scene: SceneId }
 * Reply: { url: string; cached: boolean }
 *
 * Cache strategy:
 *   1. lookup `play_renders` by `cache_key` — if hit, return immediately,
 *   2. otherwise call the configured AI provider, upload bytes to the
 *      `play-renders` Storage bucket, and persist the cache row.
 *
 * Open to anonymous visitors so the studio works without sign-in. Save
 * + share are gated separately.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ArchetypeId,
  lookCacheKey,
  SceneId,
  ZodiacId,
  ARCHETYPES,
  SCENES,
  ZODIACS,
} from "@/data/play-assets";
import { findOutfit, PLAY_OUTFITS } from "@/data/play-outfits";
import { briefHash, BRIEF_MAX_LENGTH, sanitizeBrief } from "@/lib/play/brief";
import { checkBrief, moderationMessage } from "@/lib/play/moderation";
import { renderPlayImage } from "@/lib/play/provider";
import {
  checkQuota,
  clientKeyFromHeaders,
  recordRender,
} from "@/lib/play/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlayRenderRow } from "@/lib/supabase/types";
import {
  buildPlayEditPrompt,
  buildPlayPrompt,
  type EditCategory,
} from "@/prompts/play";

export const runtime = "nodejs";
// Replicate's polling can stretch close to 60s — opt out of static
// inference and let the route stream while we poll.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ARCHETYPE_IDS = ARCHETYPES.map((a) => a.id) as [ArchetypeId, ...ArchetypeId[]];
const ZODIAC_IDS = ZODIACS.map((z) => z.id) as [ZodiacId, ...ZodiacId[]];
const SCENE_IDS = SCENES.map((s) => s.id) as [SceneId, ...SceneId[]];
// Outfit ids are taken straight from the play-outfits catalogue. Empty
// list would crash zod's enum, so fall back to a single sentinel that
// no live product can ever match.
const OUTFIT_IDS = (PLAY_OUTFITS.length > 0
  ? (PLAY_OUTFITS.map((o) => o.id) as [string, ...string[]])
  : ["__no_outfit__"]) as [string, ...string[]];

const RenderRequestSchema = z.object({
  archetype: z.enum(ARCHETYPE_IDS),
  zodiac: z.enum(ZODIAC_IDS),
  scene: z.enum(SCENE_IDS),
  /**
   * F2a — re-roll index. `1` (default) = canonical render shared
   * across the gallery. Higher values create distinct cache rows
   * keyed `<triple>-v<N>` so users can request a fresh take without
   * polluting the canonical entry.
   *
   * Capped at 8 so a stray client can't farm cents with `?variant=999`.
   */
  variant: z.coerce.number().int().min(1).max(8).optional().default(1),
  /**
   * F2b — optional one-line user brief. Authenticated only; the route
   * sanitises + moderates the value, hashes it into the cache key,
   * and folds it into the AI prompt as a "personal brief" clause.
   * Anonymous requests with a non-empty brief get a 401.
   */
  brief: z.string().max(BRIEF_MAX_LENGTH * 2).optional(),
  /**
   * F2c — Stylist Caelinus AI outfit overlay. Optional product id
   * from the live shop catalogue (e.g. `b10` = Capricorn Stone Siren
   * bikini). When present, the prompt builder folds the outfit
   * fragment into the figure clause and the cache key gets an
   * `-o<id>` suffix so the outfit-on look is its own row alongside
   * the canonical no-outfit entry.
   *
   * Anonymous-allowed: outfits are curated copy with no user input,
   * so there's nothing to moderate (unlike the free-form `brief`).
   */
  outfit: z.enum(OUTFIT_IDS).optional(),
  /**
   * Faz 2.1 — kullanıcı selfie'si. Set edildiğinde:
   *   • bare avatar pre-render adımı atlanır,
   *   • FASHN VTON `model_image` parametresine doğrudan bu data URI
   *     geçer (FASHN URL veya base64 data URI kabul eder),
   *   • cache_key'e `-s<hash>` suffix eklenir, böylece aynı selfie +
   *     aynı outfit ikinci kez render edilmez.
   *
   * Sadece outfit ile birlikte anlamlı: outfit yoksa selfie alanları
   * görmezden gelinir (selfie tek başına AI render tetiklemez).
   *
   * Boyut limiti: ~3 MB data URI ≈ 2.2 MB raw. Client tarafı
   * SelfieUploader bunu 1024px JPEG @ q=0.85 ile garanti altına alır
   * (~250-450 KB). 4 MB üstüne çıkanı reddediyoruz, JSON body uzar
   * sonra Vercel/Next 4.5 MB request limit'ine yanaşır.
   */
  selfieDataUri: z
    .string()
    .max(4 * 1024 * 1024, "Selfie too large")
    .regex(/^data:image\/(jpeg|png|webp);base64,/, "Invalid selfie data URI")
    .optional(),
  /** Selfie data URI'nin sha256-prefix hash'i (16 hex). Client
   *  hesaplar; sunucu sadece cache_key'e dahil eder, integrity
   *  doğrulaması yapmaz (cache hit kötüye kullanılırsa kullanıcı yine
   *  kendi yüklediği selfie ile render olur, başkası bu hash'i tahmin
   *  edemez). */
  selfieHash: z
    .string()
    .regex(/^[0-9a-f]{8,32}$/i, "Invalid selfie hash")
    .optional(),
  /** UI language hint — only used to pick the rejection-message
   *  language when moderation triggers. Defaults to EN. */
  lang: z.enum(["tr", "en"]).optional().default("en"),
});

const STORAGE_BUCKET = "play-renders";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = RenderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { archetype, zodiac, scene, variant, lang } = parsed.data;
  // Resolve the outfit (if any) up front — `findOutfit` returns null
  // when the id slips through but isn't in the live catalogue, which
  // we treat as "no outfit" instead of erroring (defensive against
  // catalogue updates that prune entries).
  const outfit = findOutfit(parsed.data.outfit);

  // Faz 2.1 — selfie payload. Selfie'nin anlamlı olabilmesi için outfit
  // şart (FASHN model_image + garment_image ikilisi gerekiyor); selfie
  // tek başına gelirse görmezden geliyoruz, eski text-to-image yoluna
  // düşmemek için. selfieDataUri ile selfieHash birlikte gelmeli;
  // birinin eksikliği "selfie modu yok" kabul edilir.
  const selfieDataUri =
    outfit && parsed.data.selfieDataUri && parsed.data.selfieHash
      ? parsed.data.selfieDataUri
      : null;
  const selfieHash =
    outfit && parsed.data.selfieDataUri && parsed.data.selfieHash
      ? parsed.data.selfieHash
      : "";

  // ── Brief: sanitise → auth → moderate ──────────────────────
  // Anonymous users get the canonical (no-brief) render path. A brief
  // that survives sanitisation but the user isn't signed in → 401 so
  // the client can redirect to /atelier/giris with a `?next` param.
  const cleanBrief = sanitizeBrief(parsed.data.brief);
  if (cleanBrief) {
    const userClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "auth_required", message: "Sign in to use a custom brief." },
        { status: 401 },
      );
    }
    const moderation = checkBrief(cleanBrief);
    if (!moderation.ok) {
      return NextResponse.json(
        {
          error: "moderation_blocked",
          reason: moderation.reason,
          message: moderationMessage(moderation.reason, lang),
        },
        { status: 400 },
      );
    }
  }

  const briefDigest = cleanBrief ? briefHash(cleanBrief) : "";
  const cacheKey = lookCacheKey(
    archetype,
    zodiac,
    scene,
    variant,
    briefDigest,
    outfit?.id ?? "",
    selfieHash,
  );

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (err) {
    // No service-role key — we can't read the cache or upload. The
    // client will surface the error and let the user retry once env
    // is wired up.
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Supabase admin client unavailable",
      },
      { status: 503 },
    );
  }

  // 1) Cache hit? Stub-cached rows are treated as misses so a real
  //    provider call replaces the placeholder SVG with actual artwork
  //    (the upsert at the end of this handler updates the same row).
  const cached = await supabase
    .from("play_renders")
    .select("url, provider")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  const cachedRow = cached.data as Pick<PlayRenderRow, "url" | "provider"> | null;
  if (cachedRow?.url && cachedRow.provider !== "stub") {
    return NextResponse.json({ url: cachedRow.url, cached: true });
  }

  // Cache miss — every render from here on is a real provider call.
  // Apply the per-IP hourly budget BEFORE we spend any cents.
  const clientKey = clientKeyFromHeaders(req.headers);
  const quota = checkQuota(clientKey);
  if (!quota.ok) {
    const retrySeconds = Math.ceil(quota.retryAfterMs / 1000);
    return NextResponse.json(
      {
        error: "quota_exceeded",
        message:
          `Saatlik render limitine ulaştın (${quota.used}/${quota.limit}). ` +
          `${Math.ceil(retrySeconds / 60)} dakika sonra tekrar dene.`,
        used: quota.used,
        limit: quota.limit,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retrySeconds) },
      },
    );
  }

  // 2) Build prompt + render fresh.
  let prompt;
  try {
    prompt = buildPlayPrompt({
      archetype,
      zodiac,
      scene,
      variant,
      brief: cleanBrief || undefined,
      outfit: outfit ? { id: outfit.id, prompt: outfit.prompt } : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Prompt build failed" },
      { status: 400 },
    );
  }

  // 2b) Stylist Caelinus AI virtual try-on.
  //
  // When the request carries an outfit, we want gpt-image-1 to paint
  // the *real* shop garment onto the goddess — not its own
  // interpretation of a prompt fragment. To do that the OpenAI
  // image-edit endpoint needs a "bare" avatar render to edit.
  //
  // Strategy:
  //   1. Look up the bare cache row (same triple, no outfit).
  //   2. If missing, render the bare avatar fresh with text-to-image,
  //      upload it, persist its cache row — then edit-mode can build
  //      on top of that asset.
  //   3. Build the surgical edit prompt and pass both reference URLs
  //      to renderPlayImage().
  let editReferences:
    | {
        avatarUrl: string;
        garmentBytes: Uint8Array;
        garmentMime: string;
        editPrompt: string;
      }
    | undefined;
  let vtonReferences:
    | {
        avatarUrl: string;
        garmentImageData: string;
        category: "tops" | "bottoms" | "one-pieces" | "auto";
      }
    | undefined;
  let faceSwapReferences:
    | {
        sourceImage: string;
        targetImage: string;
      }
    | undefined;

  // ── Selfie + outfit → face-swap (Caelinus shop hero shot üzerine
  //    kullanıcı yüzü) ──────────────────────────────────────────
  // Selfie yüklenmiş AND outfit'in kullanılabilir bir `previewImage`'ı
  // varsa face-swap yolu zorla devreye girer; bare avatar render,
  // FASHN VTON ve OpenAI image-edit yolları tamamen atlanır.
  // previewImage Caelinus modelinin bikinili hâli olduğu için sadece
  // yüzü değiştirip $0.04 maliyetinde son ürünü çıkarmak yeterli.
  if (selfieDataUri && outfit?.previewImage) {
    const origin = new URL(req.url).origin;
    const targetImageUrl = new URL(outfit.previewImage, origin).href;
    faceSwapReferences = {
      sourceImage: selfieDataUri,
      targetImage: targetImageUrl,
    };
  }

  if (outfit && !faceSwapReferences) {
    const bareCacheKey = lookCacheKey(
      archetype,
      zodiac,
      scene,
      variant,
      briefDigest,
      "",
    );

    let bareAvatarUrl: string | null = null;

    // Faz 2.1 — selfie modu: bare avatar pre-render adımını tamamen
    // atla ve FASHN'a `model_image` olarak kullanıcının selfie data
    // URI'sini geçir. Bu yol:
    //   • bare AI render maliyetini sıfırlar (FASHN tek render yeter),
    //   • kullanıcının kendi yüzü/bedeni ile garmenti birleştirir,
    //   • selfieHash cache_key'de olduğu için aynı selfie+outfit
    //     ikinci kez ücret yazmaz.
    // editReferences (OpenAI image-edit) bu yolda inşa edilmez —
    // FASHN garment-only model olduğu için zaten editReferences'ı
    // selfie ile besleyemezdik (face preservation farklı problem).
    if (selfieDataUri) {
      bareAvatarUrl = selfieDataUri;
    } else {
      const bareCached = await supabase
        .from("play_renders")
        .select("url, provider")
        .eq("cache_key", bareCacheKey)
        .maybeSingle();
      const bareCachedRow = bareCached.data as
        | Pick<PlayRenderRow, "url" | "provider">
        | null;
      if (bareCachedRow?.url && bareCachedRow.provider !== "stub") {
        bareAvatarUrl = bareCachedRow.url;
      } else {
        // Need to produce the bare avatar before we can edit it.
        let barePromptOutput;
        try {
          barePromptOutput = buildPlayPrompt({
            archetype,
            zodiac,
            scene,
            variant,
            brief: cleanBrief || undefined,
            outfit: null,
          });
        } catch (err) {
          return NextResponse.json(
            {
              error:
                err instanceof Error
                  ? `bare prompt build failed: ${err.message}`
                  : "Bare prompt build failed",
            },
            { status: 400 },
          );
        }

        let bareRender;
        try {
          bareRender = await renderPlayImage({
            prompt: barePromptOutput.prompt,
            negativePrompt: barePromptOutput.negativePrompt,
            seed: barePromptOutput.seed,
            cacheKey: bareCacheKey,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `[play.render] ${cacheKey} bare prerender failed → ${msg}`,
          );
          return NextResponse.json(
            { error: msg || "AI bare prerender failed" },
            { status: 502 },
          );
        }

        const bareObjectPath = `${bareCacheKey}.${bareRender.extension}`;
        const bareUpload = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(bareObjectPath, bareRender.bytes, {
            contentType: bareRender.contentType,
            upsert: true,
          });
        if (bareUpload.error) {
          return NextResponse.json(
            {
              error: `Storage upload failed (bare): ${bareUpload.error.message}`,
            },
            { status: 502 },
          );
        }
        const { data: barePub } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(bareObjectPath);
        bareAvatarUrl = barePub.publicUrl;

        await supabase.from("play_renders").upsert(
          {
            cache_key: bareCacheKey,
            archetype,
            zodiac,
            scene,
            url: bareAvatarUrl,
            prompt: barePromptOutput.prompt,
            seed: barePromptOutput.seed,
            provider: bareRender.provider,
          } as never,
          { onConflict: "cache_key" },
        );

        // The bare render itself was a real provider call when it
        // wasn't cached — count it against the hourly quota too.
        if (bareRender.provider !== "stub") {
          recordRender(clientKey);
        }
      }
    }

    if (bareAvatarUrl) {
      // Fetch the shop hero shot over HTTP so the garment bytes are
      // available to both the FASHN VTON path (needs base64) and the
      // OpenAI image-edit path (needs raw bytes for multipart).
      //
      // Why HTTP instead of `fs.readFile(public/...)`:
      //   • Touching `process.cwd()` in a route handler triggers
      //     Next.js file tracing on the entire `public/` tree and
      //     copies it into the serverless function bundle. Our
      //     `public/` weighs ~900 MB (atelier dashboard imagery),
      //     which blew past Vercel's 300 MB function-size limit.
      //   • The `public/play/shop/*` files are already served by the
      //     same deployment as static assets, so HTTP fetch is the
      //     correct round-trip.
      //   • Works identically in dev (localhost:3000) and prod
      //     (vercel.app / custom domain) — origin comes from the
      //     incoming request URL.
      let garmentBytes: Uint8Array | null = null;
      let garmentMime = mimeFromExtension(outfit.imageUrl);
      try {
        const origin = new URL(req.url).origin;
        const garmentUrl = new URL(outfit.imageUrl, origin).href;
        const garmentRes = await fetch(garmentUrl);
        if (!garmentRes.ok) {
          throw new Error(
            `garment fetch ${garmentRes.status} ${garmentUrl}`,
          );
        }
        garmentBytes = new Uint8Array(await garmentRes.arrayBuffer());
        garmentMime =
          garmentRes.headers.get("content-type") ?? garmentMime;
      } catch (err) {
        // Without the garment we can't run either edit path — log and
        // skip both. The outer flow then falls back to vanilla
        // text-to-image with the outfit fragment in the prompt, which
        // at least produces *something* visual instead of a dead end.
        console.warn(
          `[play.render] garment fetch failed → using prompt-only path. ` +
            `outfit=${outfit.id} err=${
              err instanceof Error ? err.message : String(err)
            }`,
        );
      }

      if (garmentBytes) {
        // Always build the OpenAI edit references — they're the
        // accessory path AND the fallback if FASHN VTON fails.
        editReferences = {
          avatarUrl: bareAvatarUrl,
          garmentBytes,
          garmentMime,
          editPrompt: buildPlayEditPrompt({
            category: outfit.category as EditCategory,
          }),
        };

        // FASHN VTON is the preferred path for true garments. Builds
        // a data URI so FASHN can't be tripped up by localhost URLs
        // in dev and so we don't have to host the garment on a public
        // CDN in prod — FASHN reads the data URI inline.
        if (outfit.vtonCategory) {
          const garmentDataUri = `data:${garmentMime};base64,${Buffer.from(
            garmentBytes,
          ).toString("base64")}`;
          vtonReferences = {
            avatarUrl: bareAvatarUrl,
            garmentImageData: garmentDataUri,
            category: outfit.vtonCategory,
          };
        }
      }
    }
  }

  let render;
  try {
    render = await renderPlayImage({
      prompt: prompt.prompt,
      negativePrompt: prompt.negativePrompt,
      seed: prompt.seed,
      cacheKey,
      editReferences,
      vtonReferences,
      faceSwapReferences,
    });
  } catch (err) {
    // Surface the upstream message in the server log so we can
    // distinguish billing/rate-limit/safety/prompt failures at a glance.
    // The original message is also returned to the client (502 body).
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[play.render] ${cacheKey} failed → ${msg}`);
    return NextResponse.json(
      { error: msg || "AI render failed unexpectedly" },
      { status: 502 },
    );
  }

  // 3) Upload to Storage. Filename is the cache key — overwrite-safe
  //    so even if two requests race we end up with one canonical file.
  const objectPath = `${cacheKey}.${render.extension}`;
  const upload = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, render.bytes, {
      contentType: render.contentType,
      upsert: true,
    });
  if (upload.error) {
    return NextResponse.json(
      { error: `Storage upload failed: ${upload.error.message}` },
      { status: 502 },
    );
  }

  const { data: pub } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(objectPath);
  const publicUrl = pub.publicUrl;

  // 4) Persist the cache row. If two requests raced, the unique
  //    constraint on `cache_key` will let us treat the conflict as a
  //    no-op and just read the existing row.
  const insert = await supabase
    .from("play_renders")
    .upsert(
      {
        cache_key: cacheKey,
        archetype,
        zodiac,
        scene,
        url: publicUrl,
        prompt: prompt.prompt,
        seed: prompt.seed,
        provider: render.provider,
      } as never,
      { onConflict: "cache_key" },
    )
    .select("url")
    .single();

  const insertedRow = insert.data as Pick<PlayRenderRow, "url"> | null;
  const finalUrl = insertedRow?.url ?? publicUrl;

  // Only count successful, billed renders. Stub renders are free, so
  // skip them — keeps the dev experience friction-free.
  if (render.provider !== "stub") {
    recordRender(clientKey);
  }

  return NextResponse.json({ url: finalUrl, cached: false });
}

/** Cheap extension → MIME mapper for the data-URI we hand to FASHN.
 *  Keep in sync with `lib/play/provider.ts → guessImageMime`. We
 *  duplicate the tiny helper instead of cross-importing because the
 *  provider module is `server-only` and lugging an `import` over for
 *  six lines feels heavier than the duplication. */
function mimeFromExtension(p: string): string {
  const f = p.toLowerCase();
  if (f.endsWith(".jpg") || f.endsWith(".jpeg")) return "image/jpeg";
  if (f.endsWith(".webp")) return "image/webp";
  if (f.endsWith(".gif")) return "image/gif";
  return "image/png";
}

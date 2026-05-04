/**
 * POST /api/avatar/save
 *
 * Faz 3.3 — Avatar Studio'da üretilen face-swap görselini kullanıcının
 * Caelinus hesabına kalıcı bağlar.
 *
 * Akış:
 *   1. Auth check (cookie session). Yoksa 401.
 *   2. Body Zod doğrulama: { url, zodiac }
 *      • url: Supabase play-renders public bucket'ından gelen URL
 *        olmalı — host + path whitelist ile karşılaştırılır.
 *      • zodiac: 12 burçtan biri.
 *   3. Source bytes admin client ile fetch edilir
 *      (play-renders bucket public; ama yine sıkı kontrol).
 *   4. user-avatars bucket'a `{user_id}/caelinus.<ext>` olarak upsert.
 *   5. profiles tablosunda caelinus_avatar_url + zodiac + updatedAt
 *      güncellenir.
 *   6. Yeni public URL döndürülür.
 *
 * Önemli kurallar:
 *   • Görsel başkasının değil — URL play-renders bucket'ından geliyor
 *     ve cache_key kullanıcı selfieHash'ini içeriyor (yani başkası
 *     bu URL'i tahmin edemez).
 *   • Aynı user_id'ye yazıyoruz; başkasının avatarını override etmek
 *     mümkün değil (storage RLS yine de owner-only).
 *   • Service role gerekmez aslında — RLS doğru çalıştığı sürece
 *     kullanıcının kendi user-avatars/{user_id}/ path'ine yazma izni
 *     var. Ama profile update için admin client gerek (profiles
 *     RLS catalog dışı kullanıcının kendi row'unu update etmesine
 *     izin vermiyor olabilir; admin ile garanti).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { AVATAR_CANVAS_IDS } from "@/lib/avatar/canvases";
import { clientEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ZODIACS = [
  "aries", "taurus", "gemini", "cancer",
  "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

const BodySchema = z.object({
  url: z.string().url(),
  zodiac: z.enum(ZODIACS),
  /** Wardrobe Faz B — kullanıcının seçtiği base canvas. Geriye dönük
   *  uyumluluk için optional; eski avatar'ları olan kullanıcılar
   *  yeniden kaydetmeden bu kolonu null bırakırlar. Migration
   *  0012'deki check constraint enum ile aynı: silk/bodysuit/veil. */
  canvas: z.enum(AVATAR_CANVAS_IDS).optional(),
});

const USER_AVATARS_BUCKET = "user-avatars";

export async function POST(req: Request) {
  // 1. Auth
  const userClient = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { error: "auth_required", message: "Önce giriş yap." },
      { status: 401 },
    );
  }

  // 2. Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { url: sourceUrl, zodiac, canvas } = parsed.data;

  // 3. URL whitelist — sadece kendi Supabase Storage public bucket'ından.
  // Path: <SUPABASE_URL>/storage/v1/object/public/play-renders/...
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const supabaseHost = new URL(clientEnv.NEXT_PUBLIC_SUPABASE_URL).host;
  if (
    parsedUrl.host !== supabaseHost ||
    !parsedUrl.pathname.startsWith("/storage/v1/object/public/play-renders/")
  ) {
    return NextResponse.json(
      { error: "URL must come from the play-renders bucket" },
      { status: 400 },
    );
  }

  // 4. Fetch source bytes.
  let sourceRes: Response;
  try {
    sourceRes = await fetch(sourceUrl);
  } catch {
    return NextResponse.json(
      { error: "Source fetch failed" },
      { status: 502 },
    );
  }
  if (!sourceRes.ok) {
    return NextResponse.json(
      { error: `Source fetch ${sourceRes.status}` },
      { status: 502 },
    );
  }
  const buf = new Uint8Array(await sourceRes.arrayBuffer());
  const contentType = sourceRes.headers.get("content-type") ?? "image/png";
  const extension = contentType.includes("jpeg")
    ? "jpg"
    : contentType.includes("webp")
      ? "webp"
      : "png";

  // 5. Upload to user-avatars/{user_id}/caelinus.<ext> (admin client —
  //    write hakkı RLS dışında olur, atomik güncelleme).
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
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

  const objectPath = `${user.id}/caelinus.${extension}`;
  const upload = await admin.storage
    .from(USER_AVATARS_BUCKET)
    .upload(objectPath, buf, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (upload.error) {
    return NextResponse.json(
      { error: `Storage upload failed: ${upload.error.message}` },
      { status: 502 },
    );
  }

  const { data: pub } = admin.storage
    .from(USER_AVATARS_BUCKET)
    .getPublicUrl(objectPath);
  // Cache-bust suffix — Supabase aynı path'e upsert ettiğimiz için
  // CDN URL'i değişmez ama updatedAt parametresi ile tarayıcı cache'ini
  // by-pass'leriz (badge yeni avatar'ı anında görsün).
  const updatedAt = new Date().toISOString();
  const publicUrl = `${pub.publicUrl}?t=${Date.parse(updatedAt)}`;

  // 6. Profil update.
  //
  // `caelinus_avatar_base` kolonu Migration 0012 ile gelir; o uygulanana
  // dek update payload'una koyarsak "column does not exist" alırız.
  // Bu yüzden iki aşamalı: önce mevcut kolonlar (Migration 0011)
  // ile dene; başarılıysa, canvas verildiyse 0012 kolonunu ayrı bir
  // update'le dene ve hatayı sessizce yut (eski şemada ek hint döner).
  const updatePayload: Record<string, string> = {
    caelinus_avatar_url: publicUrl,
    caelinus_avatar_zodiac: zodiac,
    caelinus_avatar_updated_at: updatedAt,
    updated_at: updatedAt,
  };

  const update = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (update.error) {
    // Migration uygulanmamış olabilir — ayırt etmek için mesajı kontrol
    // et. Yine 502 dön ama kullanıcıya net hint ver.
    const msg = update.error.message;
    const missingCol = /column .* does not exist/i.test(msg);
    return NextResponse.json(
      {
        error: missingCol
          ? "profiles tablosuna caelinus_avatar_* kolonları eklenmemiş. Migration 0011_caelinus_avatar.sql Supabase Dashboard'tan uygulanmalı."
          : `Profile update failed: ${msg}`,
      },
      { status: 502 },
    );
  }

  // Canvas update — 0012 yoksa sessizce skip; yine de 200 dön çünkü
  // ana avatar başarıyla yazıldı.
  if (canvas) {
    const canvasUpdate = await admin
      .from("profiles")
      .update({ caelinus_avatar_base: canvas })
      .eq("id", user.id);
    if (canvasUpdate.error) {
      const msg = canvasUpdate.error.message;
      const missingCol = /column .* does not exist/i.test(msg);
      if (!missingCol) {
        // Gerçek hatayı sessizce yutmayalım — log ama 200 dönmeye devam,
        // çünkü avatar zaten yazıldı.
        console.warn(
          `[avatar.save] canvas update failed for user=${user.id}: ${msg}`,
        );
      }
      // missingCol → 0012 henüz uygulanmamış, normal davranış.
    }
  }

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    zodiac,
    canvas: canvas ?? null,
    updatedAt,
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

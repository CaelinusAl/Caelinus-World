/**
 * GET /api/avatar/me
 *
 * Faz 3.3 — Auth-bound AI avatar okuma.
 *
 * Login varsa profiles tablosundan kullanıcının kalıcı AI avatarını
 * (caelinus_avatar_url + zodiac + updatedAt) döndürür. Avatar yoksa
 * 404. Login yoksa 401.
 *
 * Client tarafı (`AvatarStudioBody`, `AvatarBadge`) sayfa açılışında
 * bunu çağırarak localStorage'da olmayan ama sunucuda kayıtlı bir
 * avatar varsa hidrasyondan sonra çekebilir — cross-device deneyimi.
 *
 * localStorage hâlâ tek başına çalışan offline / anonim akışın
 * temeli; bu endpoint yalnızca auth'lı katmanı taşır.
 */

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  // Birinci dene: tüm kolonlarla (0012 dahil caelinus_avatar_base).
  // Migration 0012 yoksa "column does not exist" → fallback select ile
  // sadece 0011 kolonlarını al. Böylece eski şemada da çalışır.
  let data: {
    caelinus_avatar_url: string | null;
    caelinus_avatar_zodiac: string | null;
    caelinus_avatar_updated_at: string | null;
    caelinus_avatar_base: string | null;
  } | null = null;
  let error;

  const fullSelect = await supabase
    .from("profiles")
    .select(
      "caelinus_avatar_url, caelinus_avatar_zodiac, caelinus_avatar_updated_at, caelinus_avatar_base",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (fullSelect.error && /column .* does not exist/i.test(fullSelect.error.message)) {
    // 0012 yok, 0011 var olabilir — ayrı sorgu.
    const partialSelect = await supabase
      .from("profiles")
      .select(
        "caelinus_avatar_url, caelinus_avatar_zodiac, caelinus_avatar_updated_at",
      )
      .eq("id", user.id)
      .maybeSingle();
    error = partialSelect.error;
    if (partialSelect.data) {
      // Supabase-js v2.104+'da `.select(...)` zincir narrowing'i bazen
      // `never`'a çöküyor — `from("profiles").update(...)` için codebase'de
      // `as never` workaround'u zaten uygulanmış (atelier orders actions).
      // Burada okuma tarafında runtime shape'i biz biliyoruz, o yüzden
      // explicit Pick cast ile narrowing'i atlatıyoruz.
      const p = partialSelect.data as Pick<
        import("@/lib/supabase/types").ProfileRow,
        "caelinus_avatar_url"
        | "caelinus_avatar_zodiac"
        | "caelinus_avatar_updated_at"
      >;
      data = {
        caelinus_avatar_url: p.caelinus_avatar_url,
        caelinus_avatar_zodiac: p.caelinus_avatar_zodiac,
        caelinus_avatar_updated_at: p.caelinus_avatar_updated_at,
        caelinus_avatar_base: null,
      };
    }
  } else {
    error = fullSelect.error;
    data = fullSelect.data;
  }

  if (error) {
    // Migration 0011 bile yok; client bu durumu gracefully
    // localStorage-only akışa düşmelidir.
    const missingCol = /column .* does not exist/i.test(error.message);
    if (missingCol) {
      return NextResponse.json(
        { error: "migration_pending" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: 502 },
    );
  }

  if (!data || !data.caelinus_avatar_url) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    url: data.caelinus_avatar_url,
    zodiac: data.caelinus_avatar_zodiac,
    canvas: data.caelinus_avatar_base,
    updatedAt: data.caelinus_avatar_updated_at,
  });
}

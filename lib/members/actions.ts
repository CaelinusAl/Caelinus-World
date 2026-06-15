"use server";

/**
 * CAELINUS — Frekans Ağı · server action'lar (Faz 0)
 *
 * Kimliği localStorage'dan HESABA taşıyan köprü burada. Üç eylem:
 *
 *   • syncFrequencyToAccount — kullanıcının tarayıcısındaki FrequencyProfile'ı
 *     hesabına yazar (element / Hz / intent / dob / burç + tam profil jsonb).
 *     Giriş sonrası bir kere çalışır → kimlik artık cihaza değil hesaba bağlı.
 *   • joinNetwork — handle (+roller, yuva-kodu) seçerek ağa katılma.
 *   • updateMemberProfile — public profil alanlarını güncelleme.
 *
 * Hepsi RLS-bağlı server client kullanır → `profiles_update_self` sayesinde
 * kullanıcı yalnız kendi satırını değiştirebilir.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/env";
import type { FrequencyProfile } from "@/lib/frequency";
import type { Json, ProfileRow } from "@/lib/supabase/types";

import {
  isValidHandle,
  mapProfileRow,
  normalizeHandle,
  type MemberProfile,
  type MemberProfilePatch,
  type MemberRole,
} from "./types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

const VALID_ROLES: readonly MemberRole[] = [
  "writer",
  "artist",
  "designer",
  "producer",
  "seeker",
];

function sanitizeRoles(roles: MemberRole[] | undefined): MemberRole[] | null {
  if (!roles || roles.length === 0) return null;
  const clean = Array.from(
    new Set(roles.filter((r): r is MemberRole => VALID_ROLES.includes(r))),
  );
  return clean.length ? clean : null;
}

/** FrequencyProfile → profiles patch (kimliğin kanonik alanları). */
function patchFromFrequency(p: FrequencyProfile): Partial<ProfileRow> {
  return {
    element: p.element,
    frequency_hz: p.frequency,
    intent: p.intent,
    dob: /^\d{4}-\d{2}-\d{2}$/.test(p.dob) ? p.dob : null,
    caelinus_avatar_zodiac: p.zodiac,
    frequency_profile: p as unknown as Json,
  };
}

async function requireUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Kullanıcının tarayıcısındaki frekans profilini hesabına yaz. Mevcut
 * kanonik alanları (element/Hz/intent/burç) günceller; idempotent.
 */
export async function syncFrequencyToAccount(
  profile: FrequencyProfile,
): Promise<ActionResult<MemberProfile>> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }
  if (!profile?.zodiac || typeof profile.frequency !== "number") {
    return { ok: false, error: "Geçersiz frekans profili." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { data, error } = await supabase
    .from("profiles")
    // upsert: trigger eklenmeden önce oluşmuş kullanıcılarda profiles satırı
    // olmayabilir → satır yoksa oluştur, varsa güncelle. postgrest-js'in
    // write-arg çıkarımı interface row'larda `never` verdiği için cast.
    .upsert(
      { id: user.id, email: user.email, ...patchFromFrequency(profile) } as never,
      { onConflict: "id" },
    )
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: error.message, code: error.code };
  if (!data) return { ok: false, error: "Profil güncellenemedi." };
  return { ok: true, data: mapProfileRow(data as ProfileRow) };
}

/**
 * Ağa katıl — handle seç (zorunlu), roller + yuva-kodu opsiyonel. Varsa
 * frekans profili de aynı anda hesaba taşınır. handle çakışırsa 23505
 * yakalanır ve "kullanımda" hatası döner.
 */
export async function joinNetwork(input: {
  handle: string;
  roles?: MemberRole[];
  homeCode?: number | null;
  frequencyProfile?: FrequencyProfile | null;
}): Promise<ActionResult<MemberProfile>> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }

  const handle = normalizeHandle(input.handle ?? "");
  if (!isValidHandle(handle)) {
    return {
      ok: false,
      error:
        "Kullanıcı adı 3-30 karakter olmalı: küçük harf, rakam ve alt çizgi.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };
  const userId = user.id;

  const patch: Partial<ProfileRow> = {
    id: userId,
    email: user.email ?? null,
    handle,
    is_public: true,
    network_joined_at: new Date().toISOString(),
  };
  const roles = sanitizeRoles(input.roles);
  if (roles) patch.roles = roles;
  if (typeof input.homeCode === "number") {
    patch.home_code =
      input.homeCode >= 1 && input.homeCode <= 81 ? input.homeCode : null;
  }
  if (input.frequencyProfile) {
    Object.assign(patch, patchFromFrequency(input.frequencyProfile));
  }

  // upsert: profiles satırı yoksa (eski/trigger-öncesi kullanıcı) oluştur,
  // varsa güncelle. RLS profiles_insert_self + profiles_update_self izinli.
  const { data, error } = await supabase
    .from("profiles")
    .upsert(patch as never, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Bu kullanıcı adı zaten alınmış.",
        code: "handle_taken",
      };
    }
    return { ok: false, error: error.message, code: error.code };
  }
  if (!data) return { ok: false, error: "Ağa katılım kaydedilemedi." };
  return { ok: true, data: mapProfileRow(data as ProfileRow) };
}

/** Public profil alanlarını güncelle (sahibi). */
export async function updateMemberProfile(
  patch: MemberProfilePatch,
): Promise<ActionResult<MemberProfile>> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Oturum bulunamadı." };

  const row: Partial<ProfileRow> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.headline !== undefined) row.headline = patch.headline;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.links !== undefined) row.links = patch.links;
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
  if (patch.homeCode !== undefined) {
    row.home_code =
      typeof patch.homeCode === "number" &&
      patch.homeCode >= 1 &&
      patch.homeCode <= 81
        ? patch.homeCode
        : null;
  }
  const roles = sanitizeRoles(patch.roles);
  if (roles) row.roles = roles;
  if (patch.handle !== undefined && patch.handle !== null) {
    const h = normalizeHandle(patch.handle);
    if (!isValidHandle(h)) {
      return { ok: false, error: "Geçersiz kullanıcı adı." };
    }
    row.handle = h;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(row as never)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Bu kullanıcı adı zaten alınmış.", code: "handle_taken" };
    }
    return { ok: false, error: error.message, code: error.code };
  }
  if (!data) return { ok: false, error: "Profil güncellenemedi." };
  return { ok: true, data: mapProfileRow(data as ProfileRow) };
}

/**
 * handle müsait mi? UI ipucu için best-effort. profiles RLS başkasının
 * satırını gizlediğinden, varlık kontrolünü service-role client yapar
 * (yalnız boolean döner; veri sızdırmaz). Anahtar yoksa null döner ve
 * UI nihai kararı yazım anındaki unique kısıta bırakır.
 */
export async function isHandleAvailable(
  handle: string,
): Promise<boolean | null> {
  const h = normalizeHandle(handle);
  if (!isValidHandle(h)) return false;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("handle", h)
      .maybeSingle();
    if (error) return null;
    return data === null;
  } catch {
    return null;
  }
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";

import AccountBody from "./AccountBody";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tr = locale === "tr";
  return {
    title: tr ? "Hesap · Caelinus" : "Account · Caelinus",
    // Account pages should never be indexed by search engines —
    // private surfaces, no meaningful canonical content.
    robots: { index: false, follow: false },
    ...buildLocaleMetadata(locale, "/hesap"),
  };
}

/**
 * Account settings — `/hesap`.
 *
 * Lets a signed-in user edit their public profile (display name, avatar,
 * preferred language) and sign out. RLS on `profiles` already restricts
 * writes to `auth.uid() = id`; we re-check ownership server-side so the
 * route never ships an unauthenticated body.
 */
export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/atelier/giris?next=/hesap");

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, avatar_url, locale, notify_orders, notify_marketing, marketing_consent_at, deleted_at, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = (data as ProfileRow | null) ?? null;

  // The DB trigger creates a profile on first sign-in, but a stale
  // session before the trigger ran could land us here without a row.
  // Build a minimal placeholder so the form still renders.
  const fallback: ProfileRow = {
    id: user.id,
    email: user.email ?? null,
    display_name: null,
    avatar_url: null,
    locale: "tr",
    notify_orders: true,
    notify_marketing: false,
    marketing_consent_at: null,
    deleted_at: null,
    // Migration 0011 + 0013 — kullanıcı avatar'ı henüz yok.
    // Bu kolonlar nullable; AccountBody bunları opsiyonel okur.
    caelinus_avatar_url: null,
    caelinus_avatar_zodiac: null,
    caelinus_avatar_updated_at: null,
    caelinus_avatar_base: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <AccountBody profile={profile ?? fallback} />;
}

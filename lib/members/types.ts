/**
 * CAELINUS — Frekans Ağı · üye domain tipleri (Faz 0)
 *
 * `profiles` satırının üstüne kurulu, uygulama-katmanı tipleri. Supabase
 * row tipleri (lib/supabase/types) düşük seviyedir; burada ağ mantığının
 * konuştuğu daha temiz şekiller yaşar.
 */

import type {
  MemberElement,
  MemberIntent,
  MemberLinks,
  MemberRole,
  MemberZodiac,
  ProfileRow,
  PublicMemberRow,
} from "@/lib/supabase/types";

export type {
  MemberElement,
  MemberIntent,
  MemberLinks,
  MemberRole,
  MemberZodiac,
};

export const MEMBER_ROLES: readonly MemberRole[] = [
  "writer",
  "artist",
  "designer",
  "producer",
  "seeker",
] as const;

/** Rollerin TR/EN etiketleri — UI rozeti + dizin filtresi için. */
export const MEMBER_ROLE_LABEL: Record<MemberRole, { tr: string; en: string }> = {
  writer: { tr: "Yazar", en: "Writer" },
  artist: { tr: "Sanatçı", en: "Artist" },
  designer: { tr: "Tasarımcı", en: "Designer" },
  producer: { tr: "Üretici", en: "Producer" },
  seeker: { tr: "Arayıcı", en: "Seeker" },
};

/** handle kuralları — migration check'iyle birebir aynı. */
export const HANDLE_PATTERN = /^[a-z0-9_]{3,30}$/;

export function isValidHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}

/** Serbest girdiyi handle'a normalize et (küçük harf, geçersiz karakter → _). */
export function normalizeHandle(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

/** Sahibinin gördüğü tam kimlik (private alanlar dahil). */
export type MemberProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  caelinusAvatarUrl: string | null;
  handle: string | null;
  roles: MemberRole[];
  element: MemberElement | null;
  homeCode: number | null;
  headline: string | null;
  bio: string | null;
  links: MemberLinks;
  intent: MemberIntent | null;
  frequencyHz: number | null;
  zodiac: MemberZodiac | null;
  dob: string | null;
  isPublic: boolean;
  inNetwork: boolean;
  networkJoinedAt: string | null;
};

/** Public dizinde / profil sayfasında gösterilen güvenli görünüm. */
export type PublicMember = {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  caelinusAvatarUrl: string | null;
  roles: MemberRole[];
  element: MemberElement | null;
  homeCode: number | null;
  headline: string | null;
  bio: string | null;
  links: MemberLinks;
  zodiac: MemberZodiac | null;
  frequencyHz: number | null;
  networkJoinedAt: string | null;
};

/** Frekans ağı dizini filtresi. */
export type MemberFilter = {
  role?: MemberRole;
  element?: MemberElement;
  homeCode?: number;
  /** Serbest metin — display_name / handle / headline içinde arar. */
  query?: string;
  limit?: number;
  offset?: number;
};

/** Üyenin profili güncellerken yazabileceği alanlar (private dahil). */
export type MemberProfilePatch = Partial<{
  displayName: string | null;
  handle: string | null;
  roles: MemberRole[];
  homeCode: number | null;
  headline: string | null;
  bio: string | null;
  links: MemberLinks;
  isPublic: boolean;
}>;

/* ─── row → domain eşleyiciler ───────────────────────────────────────── */

export function mapProfileRow(row: ProfileRow): MemberProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    caelinusAvatarUrl: row.caelinus_avatar_url,
    handle: row.handle,
    roles: row.roles ?? ["seeker"],
    element: row.element,
    homeCode: row.home_code,
    headline: row.headline,
    bio: row.bio,
    links: row.links ?? {},
    intent: row.intent,
    frequencyHz: row.frequency_hz,
    zodiac: row.caelinus_avatar_zodiac,
    dob: row.dob,
    isPublic: row.is_public,
    inNetwork: Boolean(row.handle),
    networkJoinedAt: row.network_joined_at,
  };
}

export function mapPublicMemberRow(row: PublicMemberRow): PublicMember {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    caelinusAvatarUrl: row.caelinus_avatar_url,
    roles: row.roles ?? ["seeker"],
    element: row.element,
    homeCode: row.home_code,
    headline: row.headline,
    bio: row.bio,
    links: row.links ?? {},
    zodiac: row.zodiac,
    frequencyHz: row.frequency_hz,
    networkJoinedAt: row.network_joined_at,
  };
}

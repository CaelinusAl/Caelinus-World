/**
 * CAELINUS — Ortak Üretim · katkı domain tipleri (Faz 2)
 */

import type {
  ContributionKind,
  ContributionRow,
  ContributionStatus,
  ContributionTier,
  MemberElement,
  PublicContributionRow,
} from "@/lib/supabase/types";

export type { ContributionKind, ContributionStatus, ContributionTier };

export const CONTRIBUTION_KINDS: readonly ContributionKind[] = [
  "lore",
  "verse",
  "visual",
  "note",
] as const;

export const CONTRIBUTION_KIND_META: Record<
  ContributionKind,
  { tr: string; en: string; glyph: string; needsBody: boolean; needsMedia: boolean }
> = {
  lore: { tr: "Lore", en: "Lore", glyph: "◷", needsBody: true, needsMedia: false },
  verse: { tr: "Dize", en: "Verse", glyph: "❝", needsBody: true, needsMedia: false },
  visual: { tr: "Görsel", en: "Visual", glyph: "❖", needsBody: false, needsMedia: true },
  note: { tr: "Not", en: "Note", glyph: "✎", needsBody: true, needsMedia: false },
};

/** Sahibinin gördüğü tam katkı. */
export type Contribution = {
  id: string;
  authorUserId: string;
  kind: ContributionKind;
  title: string;
  body: string | null;
  mediaUrl: string | null;
  code: number | null;
  status: ContributionStatus;
  tier: ContributionTier;
  publishedAt: string | null;
  createdAt: string;
};

/** Akış / profil için yayımlanmış katkı + güvenli yazar bilgisi. */
export type PublicContribution = {
  id: string;
  kind: ContributionKind;
  title: string;
  body: string | null;
  mediaUrl: string | null;
  code: number | null;
  tier: ContributionTier;
  publishedAt: string | null;
  createdAt: string;
  author: {
    userId: string;
    handle: string | null;
    name: string | null;
    avatar: string | null;
    element: MemberElement | null;
  };
};

export type ContributionFilter = {
  kind?: ContributionKind;
  code?: number;
  authorHandle?: string;
  limit?: number;
  offset?: number;
};

export type ContributionInput = {
  kind: ContributionKind;
  title: string;
  body?: string | null;
  mediaUrl?: string | null;
  code?: number | null;
};

export function mapContributionRow(row: ContributionRow): Contribution {
  return {
    id: row.id,
    authorUserId: row.author_user_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    mediaUrl: row.media_url,
    code: row.code,
    status: row.status,
    tier: row.tier,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export function mapPublicContributionRow(
  row: PublicContributionRow,
): PublicContribution {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    mediaUrl: row.media_url,
    code: row.code,
    tier: row.tier,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    author: {
      userId: row.author_user_id,
      handle: row.author_handle,
      name: row.author_name,
      avatar: row.author_avatar,
      element: row.author_element,
    },
  };
}

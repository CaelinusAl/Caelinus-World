/**
 * CAELINUS — Atelier validation schemas.
 *
 * Single source of truth for what an "atelier" record can hold across
 * the application form (`/atelier/basvuru`), the edit page
 * (`/atelier/[slug]/duzenle`), and any future moderation UI.
 *
 * The shapes here intentionally mirror the constraints in
 * `supabase/migrations/0001_init.sql` — including the slug regex and the
 * `atelier_kind` / `atelier_status` enums — so client-side errors fail
 * fast with friendly copy instead of bouncing off Postgres CHECK
 * constraints with a 500.
 */
import { z } from "zod";

import { PROVINCES, PROVINCE_REGIONS } from "@/data/provinces";
import type {
  AtelierKind,
  AtelierStatus,
} from "@/lib/supabase/types";

/* ─── enums ─────────────────────────────────────────────────────── */

export const ATELIER_KINDS: readonly AtelierKind[] = [
  "cooperative",
  "farmer",
  "artisan",
  "designer",
  "chef",
  "herbalist",
  "other",
] as const;

export const ATELIER_STATUSES: readonly AtelierStatus[] = [
  "draft",
  "pending",
  "approved",
  "rejected",
] as const;

/** UI labels for `atelier_kind`. Source of truth for both forms. */
export const KIND_LABELS: Record<AtelierKind, { tr: string; en: string }> = {
  cooperative: { tr: "Kooperatif", en: "Cooperative" },
  farmer:      { tr: "Çiftçi",     en: "Farmer" },
  artisan:     { tr: "Zanaatkâr",  en: "Artisan" },
  designer:    { tr: "Tasarımcı",  en: "Designer" },
  chef:        { tr: "Şef",        en: "Chef" },
  herbalist:   { tr: "Şifacı / Otacı", en: "Herbalist" },
  other:       { tr: "Diğer",      en: "Other" },
};

/* ─── slug ──────────────────────────────────────────────────────── */

/**
 * Mirror of the Postgres CHECK constraint:
 *   `^[a-z0-9]+(-[a-z0-9]+)*$` and 2..64 chars.
 * Anything that fails this here will also fail at insert-time, so we
 * surface the friendly version to the user.
 */
export const slugSchema = z
  .string()
  .trim()
  .min(2, { message: "En az 2 karakter olmalı" })
  .max(64, { message: "En fazla 64 karakter olabilir" })
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Sadece küçük harf, rakam ve tek tire kullan (örn. ada-tasarim)",
  });

/**
 * Slugify Turkish (and any latin-extended) input on the client. Used to
 * pre-fill the slug from the atelier name as the user types.
 */
export function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr")
    // map common Turkish diacritics → ASCII equivalents
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .normalize("NFD")
    // strip remaining diacritics
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/* ─── application (insert) ──────────────────────────────────────── */

const REGION_IDS = PROVINCE_REGIONS.map((r) => r.id) as [string, ...string[]];
const PROVINCE_IDS = PROVINCES.map((p) => p.id) as [string, ...string[]];

/**
 * What a user submits at `/atelier/basvuru`. Status is implicitly
 * `draft` — we don't expose that field to the user.
 */
export const atelierApplicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Atelier adı en az 2 karakter olmalı" })
    .max(80, { message: "Atelier adı en fazla 80 karakter olabilir" }),
  slug: slugSchema,
  kind: z.enum(ATELIER_KINDS as unknown as [AtelierKind, ...AtelierKind[]]),
  region: z.enum(REGION_IDS),
  province: z.enum(PROVINCE_IDS),
  bio_tr: z
    .string()
    .trim()
    .min(20, { message: "Lütfen biraz daha anlat (en az 20 karakter)" })
    .max(800, { message: "En fazla 800 karakter" }),
  bio_en: z
    .string()
    .trim()
    .max(800, { message: "En fazla 800 karakter" })
    .optional()
    .or(z.literal("")),
});

export type AtelierApplicationInput = z.infer<typeof atelierApplicationSchema>;

/* ─── edit (update) ─────────────────────────────────────────────── */

/**
 * The full editable surface of an atelier from the owner's side. Every
 * field is optional so the form can submit partial updates without
 * having to round-trip the whole row.
 */
export const atelierEditSchema = z.object({
  name: atelierApplicationSchema.shape.name.optional(),
  kind: atelierApplicationSchema.shape.kind.optional(),
  region: atelierApplicationSchema.shape.region.optional(),
  province: atelierApplicationSchema.shape.province.optional(),
  bio_tr: z
    .string()
    .trim()
    .max(800, { message: "En fazla 800 karakter" })
    .optional()
    .or(z.literal("")),
  bio_en: z
    .string()
    .trim()
    .max(800, { message: "En fazla 800 karakter" })
    .optional()
    .or(z.literal("")),
  story_tr: z
    .string()
    .trim()
    .max(4000, { message: "En fazla 4000 karakter" })
    .optional()
    .or(z.literal("")),
  story_en: z
    .string()
    .trim()
    .max(4000, { message: "En fazla 4000 karakter" })
    .optional()
    .or(z.literal("")),
  contact_email: z
    .string()
    .trim()
    .email({ message: "Geçerli bir e-posta gir" })
    .optional()
    .or(z.literal("")),
  contact_phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .trim()
    .url({ message: "Geçerli bir URL (https://…)" })
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .trim()
    .max(60)
    .regex(/^[A-Za-z0-9._]+$/, {
      message: "Sadece kullanıcı adı (örn. caelinus.world)",
    })
    .optional()
    .or(z.literal("")),
  cover_image_url: z.string().trim().url().optional().or(z.literal("")),
  avatar_image_url: z.string().trim().url().optional().or(z.literal("")),
});

export type AtelierEditInput = z.infer<typeof atelierEditSchema>;

/* ─── helpers ───────────────────────────────────────────────────── */

/** Normalise an empty string to null — the DB cares about the difference. */
export function emptyToNull<T extends string | undefined>(
  value: T,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Provinces that belong to a given region — for cascading dropdowns. */
export function provincesInRegion(regionId: string) {
  return PROVINCES.filter((p) => p.regionId === regionId);
}

/**
 * CAELINUS — Hand-written Supabase row types.
 *
 * Mirrors `supabase/migrations/0001_init.sql`. When the schema changes,
 * either:
 *   1) regenerate from the live project:
 *      `npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/types.gen.ts`
 *      and switch the `Database` re-export below to the generated file, or
 *   2) update this file by hand to keep zero CLI dependency.
 *
 * Keeping this minimal/explicit gives us tight type safety on inserts
 * and selects without forcing every developer to install the Supabase
 * CLI.
 */

export type AtelierKind =
  | "cooperative"
  | "farmer"
  | "artisan"
  | "designer"
  | "chef"
  | "herbalist"
  | "other";

export type AtelierStatus = "draft" | "pending" | "approved" | "rejected";

export type CollectionStatus = "draft" | "published" | "archived";

export type ItemStatus = "draft" | "published" | "archived" | "sold-out";

export interface ProfileRow {
  id: string; // = auth.users.id (uuid)
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  locale: "tr" | "en" | null;
  created_at: string;
  updated_at: string;
}

export interface AtelierRow {
  id: string;
  owner_user_id: string; // → profiles.id
  slug: string; // unique
  name: string;
  kind: AtelierKind;
  region: string | null; // gaia region id (ege, akdeniz, …)
  province: string | null; // province slug
  bio_tr: string | null;
  bio_en: string | null;
  story_tr: string | null;
  story_en: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  instagram: string | null;
  cover_image_url: string | null;
  avatar_image_url: string | null;
  status: AtelierStatus;
  rejected_reason: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtelierCollectionRow {
  id: string;
  atelier_id: string;
  slug: string;
  title_tr: string;
  title_en: string | null;
  description_tr: string | null;
  description_en: string | null;
  cover_image_url: string | null;
  status: CollectionStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface AtelierItemRow {
  id: string;
  atelier_id: string;
  collection_id: string | null;
  slug: string;
  title_tr: string;
  title_en: string | null;
  description_tr: string | null;
  description_en: string | null;
  /** TRY by default; ISO 4217. */
  currency: string;
  /** Smallest unit of currency × 100 (kuruş, cents). 0 = inquire. */
  price_amount: number;
  /** Hertz alignment (Solfeggio band) — optional. */
  frequency_hz: number | null;
  moods: string[];
  intent: string | null;
  /** Linked plants in /universe/gaia. */
  plant_ids: string[];
  images: string[]; // public storage URLs in display order
  story_tr: string | null;
  story_en: string | null;
  status: ItemStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

/* /play studio — AI render cache + saved looks (migration 0005) */

export interface PlayRenderRow {
  id: string;
  cache_key: string; // "<archetype>-<zodiac>-<scene>"
  archetype: string;
  zodiac: string;
  scene: string;
  url: string;
  prompt: string | null;
  seed: number | null;
  provider: string | null;
  created_at: string;
}

export interface UserPlayLookRow {
  id: string;
  user_id: string;
  render_id: string;
  archetype: string;
  zodiac: string;
  scene: string;
  render_url: string;
  created_at: string;
}

/** Compose a Supabase-typed Database root for `createClient<Database>()`.
 *
 * Shape mirrors Supabase's generated types pattern (`{ [_ in never]: never }`
 * for empty buckets) so `@supabase/supabase-js` infers row types correctly
 * across `select(...)`, `.maybeSingle()`, `.returns<T>()` chains.
 *
 * `__InternalSupabase` is required by `@supabase/supabase-js` v2.104+
 * for table-row inference; without it, every chained query collapses
 * to `never` and properties like `display_name` become inaccessible.
 */
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      ateliers: {
        Row: AtelierRow;
        Insert: Partial<AtelierRow> &
          Pick<AtelierRow, "owner_user_id" | "slug" | "name" | "kind">;
        Update: Partial<AtelierRow>;
        Relationships: [];
      };
      atelier_collections: {
        Row: AtelierCollectionRow;
        Insert: Partial<AtelierCollectionRow> &
          Pick<AtelierCollectionRow, "atelier_id" | "slug" | "title_tr">;
        Update: Partial<AtelierCollectionRow>;
        Relationships: [];
      };
      atelier_items: {
        Row: AtelierItemRow;
        Insert: Partial<AtelierItemRow> &
          Pick<AtelierItemRow, "atelier_id" | "slug" | "title_tr">;
        Update: Partial<AtelierItemRow>;
        Relationships: [];
      };
      play_renders: {
        Row: PlayRenderRow;
        Insert: Partial<PlayRenderRow> &
          Pick<PlayRenderRow, "cache_key" | "archetype" | "zodiac" | "scene" | "url">;
        Update: Partial<PlayRenderRow>;
        Relationships: [];
      };
      user_play_looks: {
        Row: UserPlayLookRow;
        Insert: Partial<UserPlayLookRow> &
          Pick<
            UserPlayLookRow,
            | "user_id"
            | "render_id"
            | "archetype"
            | "zodiac"
            | "scene"
            | "render_url"
          >;
        Update: Partial<UserPlayLookRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      atelier_kind: AtelierKind;
      atelier_status: AtelierStatus;
      collection_status: CollectionStatus;
      item_status: ItemStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

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

/* Stripe-backed orders (migration 0006) */

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface ShippingAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  country: string | null;
}

export interface AtelierOrderRow {
  id: string;
  buyer_user_id: string | null;
  atelier_id: string;
  status: OrderStatus;
  currency: string;
  subtotal_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  buyer_email: string | null;
  buyer_name: string | null;
  shipping_address: ShippingAddress | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  buyer_notes: string | null;
  /** Maker-side fulfilment trail (migration 0007). All nullable so
   *  pre-shipment rows are valid without backfill. */
  tracking_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  maker_note: string | null;
  buyer_notified_shipped_at: string | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

export interface AtelierOrderItemRow {
  id: string;
  order_id: string;
  item_id: string;
  title_snapshot: string;
  currency_snapshot: string;
  price_snapshot_amount: number;
  image_snapshot_url: string | null;
  quantity: number;
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
      atelier_orders: {
        Row: AtelierOrderRow;
        Insert: Partial<AtelierOrderRow> &
          Pick<
            AtelierOrderRow,
            | "atelier_id"
            | "currency"
            | "subtotal_amount"
            | "total_amount"
          >;
        Update: Partial<AtelierOrderRow>;
        Relationships: [];
      };
      atelier_order_items: {
        Row: AtelierOrderItemRow;
        Insert: Partial<AtelierOrderItemRow> &
          Pick<
            AtelierOrderItemRow,
            | "order_id"
            | "item_id"
            | "title_snapshot"
            | "currency_snapshot"
            | "price_snapshot_amount"
          >;
        Update: Partial<AtelierOrderItemRow>;
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
      order_status: OrderStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

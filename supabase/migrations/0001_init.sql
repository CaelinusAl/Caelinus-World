-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 3 — Atelier schema
-- Migration: 0001_init.sql
--
-- Creates the foundational tables for:
--   profiles               (1:1 with auth.users)
--   ateliers               (designer / producer applications + profiles)
--   atelier_collections    (groupings of items)
--   atelier_items          (the actual products / pieces)
--
-- Run order: 0001 → 0002 → 0003 → 0004
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_type where typname = 'atelier_kind') then
    create type public.atelier_kind as enum (
      'cooperative',
      'farmer',
      'artisan',
      'designer',
      'chef',
      'herbalist',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'atelier_status') then
    create type public.atelier_status as enum (
      'draft',
      'pending',
      'approved',
      'rejected'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'collection_status') then
    create type public.collection_status as enum (
      'draft',
      'published',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'item_status') then
    create type public.item_status as enum (
      'draft',
      'published',
      'archived',
      'sold-out'
    );
  end if;
end$$;


-- ─── PROFILES ────────────────────────────────────────────────────────
-- One row per authenticated user. Keeps human-readable fields outside
-- of `auth.users` so we can join freely without RLS gymnastics.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text,
  avatar_url    text,
  locale        text check (locale in ('tr', 'en')) default 'tr',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);


-- ─── ATELIERS ────────────────────────────────────────────────────────
-- A producer/designer application. One person can run multiple atelier
-- profiles (e.g., a cooperative + a personal page), so this is N:1.

create table if not exists public.ateliers (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid not null references public.profiles(id) on delete cascade,

  slug                text not null unique,
  name                text not null,
  kind                public.atelier_kind not null default 'artisan',

  region              text,    -- gaia region: ege | akdeniz | ic-anadolu | …
  province            text,    -- province slug: bodrum, urla, …

  bio_tr              text,
  bio_en              text,
  story_tr            text,
  story_en            text,

  contact_email       text,
  contact_phone       text,
  website             text,
  instagram           text,

  cover_image_url     text,
  avatar_image_url    text,

  status              public.atelier_status not null default 'draft',
  rejected_reason     text,
  approved_at         timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint ateliers_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 64)
);

create index if not exists ateliers_owner_idx   on public.ateliers (owner_user_id);
create index if not exists ateliers_status_idx  on public.ateliers (status);
create index if not exists ateliers_region_idx  on public.ateliers (region);


-- ─── COLLECTIONS ─────────────────────────────────────────────────────
-- Optional groupings — e.g. "Lavanta Sezonu 2026", "Ata Tohum Kasası".

create table if not exists public.atelier_collections (
  id                uuid primary key default gen_random_uuid(),
  atelier_id        uuid not null references public.ateliers(id) on delete cascade,

  slug              text not null,
  title_tr          text not null,
  title_en          text,
  description_tr    text,
  description_en    text,

  cover_image_url   text,
  status            public.collection_status not null default 'draft',
  position          int not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint atelier_collections_slug_unique unique (atelier_id, slug)
);

create index if not exists atelier_collections_atelier_idx
  on public.atelier_collections (atelier_id);


-- ─── ITEMS ───────────────────────────────────────────────────────────
-- A single product / piece. Linked optionally to a collection and
-- to one or more plants in /universe/gaia.

create table if not exists public.atelier_items (
  id                uuid primary key default gen_random_uuid(),
  atelier_id        uuid not null references public.ateliers(id) on delete cascade,
  collection_id     uuid references public.atelier_collections(id) on delete set null,

  slug              text not null,
  title_tr          text not null,
  title_en          text,
  description_tr    text,
  description_en    text,

  currency          text not null default 'TRY',
  price_amount      bigint not null default 0,         -- kuruş / cents

  frequency_hz      int,                               -- nullable
  moods             text[] not null default '{}',
  intent            text,
  plant_ids         text[] not null default '{}',

  images            text[] not null default '{}',
  story_tr          text,
  story_en          text,

  status            public.item_status not null default 'draft',
  position          int not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint atelier_items_slug_unique unique (atelier_id, slug),
  constraint atelier_items_price_nonneg check (price_amount >= 0),
  constraint atelier_items_freq_range
    check (frequency_hz is null or (frequency_hz >= 100 and frequency_hz <= 2000))
);

create index if not exists atelier_items_atelier_idx     on public.atelier_items (atelier_id);
create index if not exists atelier_items_collection_idx  on public.atelier_items (collection_id);
create index if not exists atelier_items_status_idx      on public.atelier_items (status);

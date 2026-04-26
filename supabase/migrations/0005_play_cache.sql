-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 5 — /play studio (AI render cache + saved looks)
-- Migration: 0005_play_cache.sql
--
-- Two tables:
--
--   play_renders     — global cache, one row per (archetype, zodiac, scene).
--                      Once an AI render lands here, the next visitor with
--                      the same triple gets the stored Storage URL right
--                      away — no extra provider call.
--
--   user_play_looks  — per-user "save this look" gallery. Rows reference
--                      a play_renders row, plus the timestamp the user
--                      saved it. Owner-only RLS.
--
-- Both tables are read-only for the public; writes are funnelled through
-- server routes (`/api/play/render`, `/api/play/save`) that use the
-- service-role client. The cache row stays public-readable for share
-- routes that look up a key without the user being signed in.
-- ─────────────────────────────────────────────────────────────────────

-- ─── play_renders — global cache ────────────────────────────────────

create table if not exists public.play_renders (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,            -- "<archetype>-<zodiac>-<scene>"
  archetype text not null,
  zodiac text not null,
  scene text not null,
  url text not null,                          -- Supabase Storage public URL
  prompt text,                                -- the prompt actually used
  seed bigint,
  provider text,                              -- 'replicate' | 'openai' | 'stub'
  created_at timestamptz not null default now()
);

create index if not exists play_renders_cache_key_idx
  on public.play_renders (cache_key);

alter table public.play_renders enable row level security;

-- Public can read cached renders so anonymous /play visitors can pull a
-- previously-rendered URL. Writes are server-only via service role.
drop policy if exists play_renders_select_public on public.play_renders;
create policy play_renders_select_public
  on public.play_renders for select
  using (true);

-- Explicitly block all anon/authenticated writes; service role bypasses.
drop policy if exists play_renders_no_anon_writes on public.play_renders;
create policy play_renders_no_anon_writes
  on public.play_renders for all
  using (false)
  with check (false);

-- ─── user_play_looks — saved gallery, owner-only ────────────────────

create table if not exists public.user_play_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  render_id uuid not null references public.play_renders(id) on delete cascade,
  archetype text not null,
  zodiac text not null,
  scene text not null,
  render_url text not null,                   -- denormalised for fast list reads
  created_at timestamptz not null default now()
);

create index if not exists user_play_looks_user_idx
  on public.user_play_looks (user_id, created_at desc);

create index if not exists user_play_looks_render_idx
  on public.user_play_looks (render_id);

alter table public.user_play_looks enable row level security;

-- Owner-only read. Public look pages (/play/look/[id]) fetch via the
-- service-role client so we don't need a public select policy here.
drop policy if exists user_play_looks_select_owner on public.user_play_looks;
create policy user_play_looks_select_owner
  on public.user_play_looks for select
  using (auth.uid() = user_id);

drop policy if exists user_play_looks_insert_owner on public.user_play_looks;
create policy user_play_looks_insert_owner
  on public.user_play_looks for insert
  with check (auth.uid() = user_id);

drop policy if exists user_play_looks_delete_owner on public.user_play_looks;
create policy user_play_looks_delete_owner
  on public.user_play_looks for delete
  using (auth.uid() = user_id);

-- ─── Storage bucket for AI renders ──────────────────────────────────
-- Public-read bucket so the render URL stored in `play_renders.url`
-- works without a signed URL flow. Private uploads can come later.

insert into storage.buckets (id, name, public)
values ('play-renders', 'play-renders', true)
on conflict (id) do update set public = excluded.public;

-- Service-role uploads + public reads. RLS on storage.objects is
-- already enabled by Supabase by default.
drop policy if exists play_renders_storage_select on storage.objects;
create policy play_renders_storage_select
  on storage.objects for select
  using (bucket_id = 'play-renders');

-- Writes are restricted: only the service role can insert/update.
-- (No insert/update policy below means the bucket is locked down for
-- anon/authenticated writes; service role bypasses RLS entirely.)

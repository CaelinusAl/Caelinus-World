-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 8 — Profile extras (F5)
-- Migration: 0008_profile_extras.sql
--
-- Adds:
--   profiles.notify_orders         — transactional order updates (default on)
--   profiles.notify_marketing      — newsletter / promo (default OFF, KVKK)
--   profiles.marketing_consent_at  — timestamp of opt-in (audit trail)
--   profiles.deleted_at            — soft-delete tombstone
--
-- New storage bucket:
--   user-avatars   — public read, owner-only write/update/delete
--                    Path convention: {user_id}/{filename}
--                    Profile pictures live here, separate from
--                    `atelier-images` (which is keyed by atelier_id).
-- ─────────────────────────────────────────────────────────────────────


-- ─── Columns ─────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists notify_orders        boolean      not null default true,
  add column if not exists notify_marketing     boolean      not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists deleted_at           timestamptz;

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at)
  where deleted_at is not null;


-- ─── user-avatars bucket ─────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  4 * 1024 * 1024,                                       -- 4 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read.
drop policy if exists user_avatars_public_read on storage.objects;
create policy user_avatars_public_read
  on storage.objects for select
  using (bucket_id = 'user-avatars');

-- Owner-only write. First path segment must be the caller's auth.uid().
drop policy if exists user_avatars_owner_insert on storage.objects;
create policy user_avatars_owner_insert
  on storage.objects for insert
  with check (
    bucket_id = 'user-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists user_avatars_owner_update on storage.objects;
create policy user_avatars_owner_update
  on storage.objects for update
  using (
    bucket_id = 'user-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists user_avatars_owner_delete on storage.objects;
create policy user_avatars_owner_delete
  on storage.objects for delete
  using (
    bucket_id = 'user-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

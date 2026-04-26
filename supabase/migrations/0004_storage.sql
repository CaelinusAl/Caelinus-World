-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 3 — Storage buckets & policies
-- Migration: 0004_storage.sql
--
-- Buckets:
--   atelier-images   — public read, owner-only write.
--                      Path convention:  {atelier_id}/{filename}
--                      Example:          a47f.../cover.jpg
--   atelier-private  — owner-only read+write (KVKK / draft material).
-- ─────────────────────────────────────────────────────────────────────

-- ─── atelier-images (public) ─────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'atelier-images',
  'atelier-images',
  true,
  10 * 1024 * 1024,                                      -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- Public read.
drop policy if exists atelier_images_public_read on storage.objects;
create policy atelier_images_public_read
  on storage.objects for select
  using (bucket_id = 'atelier-images');

-- Owner write — first path segment must equal an atelier id the
-- caller owns. `storage.foldername(name)` returns text[]; element 1
-- is the top-level folder.
drop policy if exists atelier_images_owner_write on storage.objects;
create policy atelier_images_owner_write
  on storage.objects for insert
  with check (
    bucket_id = 'atelier-images'
    and exists (
      select 1 from public.ateliers a
      where a.id::text = (storage.foldername(name))[1]
        and a.owner_user_id = auth.uid()
    )
  );

drop policy if exists atelier_images_owner_update on storage.objects;
create policy atelier_images_owner_update
  on storage.objects for update
  using (
    bucket_id = 'atelier-images'
    and exists (
      select 1 from public.ateliers a
      where a.id::text = (storage.foldername(name))[1]
        and a.owner_user_id = auth.uid()
    )
  );

drop policy if exists atelier_images_owner_delete on storage.objects;
create policy atelier_images_owner_delete
  on storage.objects for delete
  using (
    bucket_id = 'atelier-images'
    and exists (
      select 1 from public.ateliers a
      where a.id::text = (storage.foldername(name))[1]
        and a.owner_user_id = auth.uid()
    )
  );


-- ─── atelier-private (owner-only) ────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'atelier-private',
  'atelier-private',
  false,
  20 * 1024 * 1024,                                      -- 20 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


drop policy if exists atelier_private_owner_all on storage.objects;
create policy atelier_private_owner_all
  on storage.objects for all
  using (
    bucket_id = 'atelier-private'
    and exists (
      select 1 from public.ateliers a
      where a.id::text = (storage.foldername(name))[1]
        and a.owner_user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'atelier-private'
    and exists (
      select 1 from public.ateliers a
      where a.id::text = (storage.foldername(name))[1]
        and a.owner_user_id = auth.uid()
    )
  );

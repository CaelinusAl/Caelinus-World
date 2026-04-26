-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 3 — Row-Level Security
-- Migration: 0003_rls.sql
--
-- Defaults:
--   profiles                — owner can read/update self; everyone else nothing
--   ateliers                — owner can do everything to own; public sees
--                             only `approved`. Admins see/modify all.
--   atelier_collections     — owner manages own; public sees published
--                             collections of approved ateliers.
--   atelier_items           — owner manages own; public sees published
--                             items of approved ateliers.
-- ─────────────────────────────────────────────────────────────────────

-- ─── PROFILES ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
  on public.profiles for select
  using (auth.uid() = id or public.is_caelinus_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  with check (auth.uid() = id);

-- Admins can also update profiles (display_name moderation, etc.)
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
  on public.profiles for update
  using (public.is_caelinus_admin())
  with check (true);


-- ─── ATELIERS ───────────────────────────────────────────────────────

alter table public.ateliers enable row level security;

-- Public can read approved ateliers.
drop policy if exists ateliers_select_public on public.ateliers;
create policy ateliers_select_public
  on public.ateliers for select
  using (status = 'approved');

-- Owner can read their own at any status.
drop policy if exists ateliers_select_owner on public.ateliers;
create policy ateliers_select_owner
  on public.ateliers for select
  using (auth.uid() = owner_user_id);

-- Admins can read everything.
drop policy if exists ateliers_select_admin on public.ateliers;
create policy ateliers_select_admin
  on public.ateliers for select
  using (public.is_caelinus_admin());

-- Owner can insert their own (status auto = draft via column default).
drop policy if exists ateliers_insert_owner on public.ateliers;
create policy ateliers_insert_owner
  on public.ateliers for insert
  with check (
    auth.uid() = owner_user_id
    and status in ('draft', 'pending')
  );

-- Owner can update non-status fields. They can move draft → pending.
-- Approval (pending → approved/rejected) is admin-only.
drop policy if exists ateliers_update_owner on public.ateliers;
create policy ateliers_update_owner
  on public.ateliers for update
  using (auth.uid() = owner_user_id)
  with check (
    auth.uid() = owner_user_id
    and status in ('draft', 'pending')
  );

-- Admins can update anything.
drop policy if exists ateliers_update_admin on public.ateliers;
create policy ateliers_update_admin
  on public.ateliers for update
  using (public.is_caelinus_admin())
  with check (true);

-- Owner can delete only while still in draft.
drop policy if exists ateliers_delete_owner on public.ateliers;
create policy ateliers_delete_owner
  on public.ateliers for delete
  using (auth.uid() = owner_user_id and status = 'draft');

-- Admins can delete.
drop policy if exists ateliers_delete_admin on public.ateliers;
create policy ateliers_delete_admin
  on public.ateliers for delete
  using (public.is_caelinus_admin());


-- ─── COLLECTIONS ────────────────────────────────────────────────────

alter table public.atelier_collections enable row level security;

drop policy if exists collections_select_public on public.atelier_collections;
create policy collections_select_public
  on public.atelier_collections for select
  using (
    status = 'published'
    and exists (
      select 1 from public.ateliers a
      where a.id = atelier_id and a.status = 'approved'
    )
  );

drop policy if exists collections_select_owner on public.atelier_collections;
create policy collections_select_owner
  on public.atelier_collections for select
  using (public.is_atelier_owner(atelier_id));

drop policy if exists collections_select_admin on public.atelier_collections;
create policy collections_select_admin
  on public.atelier_collections for select
  using (public.is_caelinus_admin());

drop policy if exists collections_write_owner on public.atelier_collections;
create policy collections_write_owner
  on public.atelier_collections for all
  using (public.is_atelier_owner(atelier_id))
  with check (public.is_atelier_owner(atelier_id));

drop policy if exists collections_write_admin on public.atelier_collections;
create policy collections_write_admin
  on public.atelier_collections for all
  using (public.is_caelinus_admin())
  with check (true);


-- ─── ITEMS ──────────────────────────────────────────────────────────

alter table public.atelier_items enable row level security;

drop policy if exists items_select_public on public.atelier_items;
create policy items_select_public
  on public.atelier_items for select
  using (
    status in ('published', 'sold-out')
    and exists (
      select 1 from public.ateliers a
      where a.id = atelier_id and a.status = 'approved'
    )
  );

drop policy if exists items_select_owner on public.atelier_items;
create policy items_select_owner
  on public.atelier_items for select
  using (public.is_atelier_owner(atelier_id));

drop policy if exists items_select_admin on public.atelier_items;
create policy items_select_admin
  on public.atelier_items for select
  using (public.is_caelinus_admin());

drop policy if exists items_write_owner on public.atelier_items;
create policy items_write_owner
  on public.atelier_items for all
  using (public.is_atelier_owner(atelier_id))
  with check (public.is_atelier_owner(atelier_id));

drop policy if exists items_write_admin on public.atelier_items;
create policy items_write_admin
  on public.atelier_items for all
  using (public.is_caelinus_admin())
  with check (true);


-- ─── caelinus_admins ─────────────────────────────────────────────────
-- Only admins can read or modify the allow-list. Avoids leaking who
-- has elevated privileges to non-admins.

alter table public.caelinus_admins enable row level security;

drop policy if exists admins_select_admin on public.caelinus_admins;
create policy admins_select_admin
  on public.caelinus_admins for select
  using (public.is_caelinus_admin());

drop policy if exists admins_write_admin on public.caelinus_admins;
create policy admins_write_admin
  on public.caelinus_admins for all
  using (public.is_caelinus_admin())
  with check (public.is_caelinus_admin());

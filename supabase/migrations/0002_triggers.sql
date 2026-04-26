-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 3 — Triggers & helper functions
-- Migration: 0002_triggers.sql
--
--   • handle_new_user()    — auto-create a public.profiles row when a
--                            user signs up via Supabase Auth.
--   • set_updated_at()     — generic timestamp updater.
--   • is_atelier_owner()   — RLS helper.
--   • is_caelinus_admin()  — checks email against an allow-list table.
-- ─────────────────────────────────────────────────────────────────────

-- ─── set_updated_at() ───────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists ateliers_set_updated_at on public.ateliers;
create trigger ateliers_set_updated_at
  before update on public.ateliers
  for each row execute function public.set_updated_at();

drop trigger if exists atelier_collections_set_updated_at on public.atelier_collections;
create trigger atelier_collections_set_updated_at
  before update on public.atelier_collections
  for each row execute function public.set_updated_at();

drop trigger if exists atelier_items_set_updated_at on public.atelier_items;
create trigger atelier_items_set_updated_at
  before update on public.atelier_items
  for each row execute function public.set_updated_at();


-- ─── handle_new_user() ──────────────────────────────────────────────
-- Inserts a profiles row when a new auth.users record is created.
-- Runs with security definer so it can bypass RLS for this single
-- privileged operation.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── caelinus_admins ────────────────────────────────────────────────
-- Tiny allow-list table. Two ways to grant admin:
--   1) insert email here (preferred — survives env changes), or
--   2) set CAELINUS_ADMIN_EMAILS env var (env-only check, see lib/env.ts)

create table if not exists public.caelinus_admins (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);


-- ─── is_caelinus_admin() ────────────────────────────────────────────

create or replace function public.is_caelinus_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.caelinus_admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid()
  );
$$;


-- ─── is_atelier_owner(atelier_id) ───────────────────────────────────

create or replace function public.is_atelier_owner(p_atelier uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ateliers
    where id = p_atelier and owner_user_id = auth.uid()
  );
$$;

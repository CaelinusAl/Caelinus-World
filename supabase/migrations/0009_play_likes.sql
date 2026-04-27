-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 9 — Play likes (community discovery, F4)
-- Migration: 0009_play_likes.sql
--
-- Adds:
--   play_likes              — one row per (user, render). Composite unique
--                             so a user can't like the same render twice.
--   play_renders.likes_count — denormalised counter, kept in sync via
--                             triggers. Lets the gallery sort by popular
--                             without a join + group-by on every page hit.
--
-- RLS:
--   • Authenticated users can insert/delete their OWN like.
--   • Reads are public (we expose `likes_count` on the cache row anyway).
--   • No service-role-only writes — likes are a user action.
-- ─────────────────────────────────────────────────────────────────────


-- ─── 1) likes_count column on the cache row ─────────────────────────

alter table public.play_renders
  add column if not exists likes_count integer not null default 0;

create index if not exists play_renders_likes_count_idx
  on public.play_renders (likes_count desc, created_at desc);


-- ─── 2) play_likes table ────────────────────────────────────────────

create table if not exists public.play_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  render_id   uuid not null references public.play_renders(id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint play_likes_unique unique (user_id, render_id)
);

create index if not exists play_likes_user_idx
  on public.play_likes (user_id, created_at desc);

create index if not exists play_likes_render_idx
  on public.play_likes (render_id);


-- ─── 3) Trigger to keep play_renders.likes_count in sync ────────────

create or replace function public.play_likes_sync_counter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.play_renders
       set likes_count = likes_count + 1
     where id = new.render_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.play_renders
       set likes_count = greatest(0, likes_count - 1)
     where id = old.render_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists play_likes_after_insert on public.play_likes;
create trigger play_likes_after_insert
  after insert on public.play_likes
  for each row execute function public.play_likes_sync_counter();

drop trigger if exists play_likes_after_delete on public.play_likes;
create trigger play_likes_after_delete
  after delete on public.play_likes
  for each row execute function public.play_likes_sync_counter();


-- ─── 4) Backfill counter for existing renders ───────────────────────
-- Cheap one-shot during migration. Fresh deployments hit zero rows so
-- this is effectively a no-op there.

update public.play_renders r
   set likes_count = sub.cnt
  from (
    select render_id, count(*)::int as cnt
      from public.play_likes
     group by render_id
  ) sub
 where r.id = sub.render_id
   and r.likes_count <> sub.cnt;


-- ─── 5) RLS ─────────────────────────────────────────────────────────

alter table public.play_likes enable row level security;

-- Anyone (anon + authenticated) can read likes — we expose them in
-- aggregate via likes_count anyway, and listing per-user likes is
-- useful for "did I like this?" lookups on the look detail page.
drop policy if exists play_likes_select_public on public.play_likes;
create policy play_likes_select_public
  on public.play_likes for select
  using (true);

-- Owner-only writes.
drop policy if exists play_likes_insert_self on public.play_likes;
create policy play_likes_insert_self
  on public.play_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists play_likes_delete_self on public.play_likes;
create policy play_likes_delete_self
  on public.play_likes for delete
  using (auth.uid() = user_id);

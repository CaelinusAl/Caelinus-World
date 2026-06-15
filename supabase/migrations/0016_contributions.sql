-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Frekans Ağı — Faz 2 · Ortak Üretim
-- Migration: 0016_contributions.sql
--
-- Üyeler dünyaya KATKI ekler. Tasarımcı→ürün ve üretici→mal zaten
-- Atelier'de yaşıyor; bu tablo yeni yüzü taşır:
--   • yazar    → lore / öykü / dize (arya)
--   • sanatçı  → görsel / konsept
--   • herkes   → serbest not
--
-- Her katkı SANRI haritasında bir KODA (1..81) bağlanabilir → "bir kodun
-- uyanışı" akışı buradan beslenir.
--
-- Moderasyon: katkı anında 'published' + tier 'community' olur (üye
-- sonucu hemen görür). Admin sonradan 'canon'a yükseltebilir, gizleyebilir
-- (status) veya reddedebilir. Kanon = dünyanın resmî dokusu; community =
-- üye katmanı. RLS bunu zorlar: üye kendini 'canon' yapamaz.
-- ─────────────────────────────────────────────────────────────────────


-- ─── Tablo ───────────────────────────────────────────────────────────

create table if not exists public.contributions (
  id               uuid primary key default gen_random_uuid(),
  author_user_id   uuid not null references public.profiles (id) on delete cascade,
  kind             text not null,
  title            text not null,
  body             text,
  media_url        text,
  -- SANRI 81 şehir-kodundan hangisine bağlı (opsiyonel).
  code             smallint,
  status           text not null default 'published',
  tier             text not null default 'community',
  rejected_reason  text,
  published_at     timestamptz default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint contributions_kind_chk
    check (kind in ('lore', 'verse', 'visual', 'note')),
  constraint contributions_status_chk
    check (status in ('draft', 'pending', 'published', 'rejected')),
  constraint contributions_tier_chk
    check (tier in ('community', 'canon')),
  constraint contributions_code_chk
    check (code is null or (code >= 1 and code <= 81)),
  constraint contributions_title_len
    check (char_length(title) between 1 and 160)
);

create index if not exists contributions_author_idx
  on public.contributions (author_user_id);
create index if not exists contributions_code_idx
  on public.contributions (code)
  where status = 'published';
create index if not exists contributions_published_idx
  on public.contributions (published_at desc)
  where status = 'published';


-- ─── updated_at trigger ──────────────────────────────────────────────

drop trigger if exists contributions_set_updated_at on public.contributions;
create trigger contributions_set_updated_at
  before update on public.contributions
  for each row execute function public.set_updated_at();


-- ─── RLS ─────────────────────────────────────────────────────────────

alter table public.contributions enable row level security;

-- Public, yayımlanmışları okur.
drop policy if exists contributions_select_public on public.contributions;
create policy contributions_select_public
  on public.contributions for select
  using (status = 'published');

-- Yazar kendi katkılarını her statüde okur.
drop policy if exists contributions_select_owner on public.contributions;
create policy contributions_select_owner
  on public.contributions for select
  using (auth.uid() = author_user_id);

-- Admin hepsini okur.
drop policy if exists contributions_select_admin on public.contributions;
create policy contributions_select_admin
  on public.contributions for select
  using (public.is_caelinus_admin());

-- Yazar kendi katkısını ekler — yalnız 'community' tier, kanon değil.
drop policy if exists contributions_insert_owner on public.contributions;
create policy contributions_insert_owner
  on public.contributions for insert
  with check (
    auth.uid() = author_user_id
    and tier = 'community'
    and status in ('draft', 'pending', 'published')
  );

-- Yazar kendi katkısını günceller — kanona yükseltemez.
drop policy if exists contributions_update_owner on public.contributions;
create policy contributions_update_owner
  on public.contributions for update
  using (auth.uid() = author_user_id)
  with check (
    auth.uid() = author_user_id
    and tier = 'community'
    and status in ('draft', 'pending', 'published')
  );

-- Admin her şeyi yapar (kanona yükseltme, gizleme, reddetme).
drop policy if exists contributions_update_admin on public.contributions;
create policy contributions_update_admin
  on public.contributions for update
  using (public.is_caelinus_admin())
  with check (true);

-- Yazar kendi katkısını siler.
drop policy if exists contributions_delete_owner on public.contributions;
create policy contributions_delete_owner
  on public.contributions for delete
  using (auth.uid() = author_user_id);

drop policy if exists contributions_delete_admin on public.contributions;
create policy contributions_delete_admin
  on public.contributions for delete
  using (public.is_caelinus_admin());


-- ─── public_contributions view (akış + profil için) ─────────────────
-- Yayımlanmış katkıları, yazarın YALNIZ güvenli profil kolonlarıyla
-- birleştirir. profiles RLS owner-only olduğundan akışta yazar adını/
-- avatarını göstermek için bu definer view kullanılır.

create or replace view public.public_contributions as
  select
    c.id,
    c.kind,
    c.title,
    c.body,
    c.media_url,
    c.code,
    c.tier,
    c.published_at,
    c.created_at,
    c.author_user_id,
    p.handle          as author_handle,
    p.display_name    as author_name,
    coalesce(p.caelinus_avatar_url, p.avatar_url) as author_avatar,
    p.element         as author_element
  from public.contributions c
  join public.profiles p on p.id = c.author_user_id
  where c.status = 'published'
    and p.deleted_at is null;

grant select on public.public_contributions to anon, authenticated;

comment on view public.public_contributions is
  'Yayımlanmış katkılar + yazarın güvenli profil kolonları (akış / profil). '
  'Hassas profil alanları dahil değildir.';

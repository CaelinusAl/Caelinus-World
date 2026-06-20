-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Frekans Ağı — Faz 0
-- Migration: 0015_members_network.sql
--
-- Caelinus'u "tek marka vitrini"nden "üyelerin birlikte kurduğu bir
-- evren"e taşıyan ilk adım. Ayrı bir `members` tablosu KURMAYIZ —
-- her auth kullanıcısının zaten bir `profiles` satırı var; onu frekans
-- ağı alanlarıyla genişletiriz. Böylece Atelier, sipariş, avatar gibi
-- mevcut sistemler hiç değişmeden çalışmaya devam eder.
--
-- Eklenenler (profiles):
--   roles               — bir üye birden çok yaratıcı tipi olabilir
--                         (writer | artist | designer | producer | seeker)
--   handle              — public kullanıcı adı (/u/<handle>); benzersiz,
--                         küçük harf, url-güvenli. Ağa "katılma" = handle seçme.
--   element             — fire | earth | air | water (frekanstan)
--   home_code           — SANRI 81 şehir-kodundan üyenin "yuvası" (1..81)
--   headline, bio       — public profil metni
--   links               — jsonb { instagram, website, ... }
--   intent              — calm | power | love | clarity
--   frequency_hz        — Solfeggio Hz (kanonik sayı)
--   frequency_profile   — tam FrequencyProfile (localStorage'dan hesaba taşınır)
--   dob                 — doğum tarihi (private; sadece sahibi görür)
--   is_public           — profil dizinde görünsün mü
--   network_joined_at   — ağa katılma anı
--
-- Güvenlik: profiles RLS "yalnız sahibi okur" olduğundan, public dizin
-- için SADECE güvenli sütunları açan bir `public_members` VIEW kullanırız
-- (email / dob / bildirim tercihleri ASLA sızmaz).
-- ─────────────────────────────────────────────────────────────────────


-- ─── Kolonlar ────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists roles             text[]      not null default array['seeker']::text[],
  add column if not exists handle            text,
  add column if not exists element           text,
  add column if not exists home_code         smallint,
  add column if not exists headline          text,
  add column if not exists bio               text,
  add column if not exists links             jsonb       not null default '{}'::jsonb,
  add column if not exists intent            text,
  add column if not exists frequency_hz      smallint,
  add column if not exists frequency_profile jsonb,
  add column if not exists dob               date,
  add column if not exists is_public         boolean     not null default true,
  add column if not exists network_joined_at timestamptz;


-- ─── Kısıtlar (enum'ları check ile zorla — yeni tip yaratmadan) ──────

-- handle: 3-30 karakter, küçük harf + rakam + alt çizgi. (null serbest:
-- kullanıcı handle seçene dek ağ dizininde görünmez.)
alter table public.profiles
  drop constraint if exists profiles_handle_chk;
alter table public.profiles
  add constraint profiles_handle_chk
  check (handle is null or handle ~ '^[a-z0-9_]{3,30}$');

-- handle benzersizliği — case-insensitive (her zaman küçük harf saklasak
-- da güvenlik için lower() index).
create unique index if not exists profiles_handle_key
  on public.profiles (lower(handle))
  where handle is not null;

alter table public.profiles
  drop constraint if exists profiles_element_chk;
alter table public.profiles
  add constraint profiles_element_chk
  check (element is null or element in ('fire', 'earth', 'air', 'water'));

alter table public.profiles
  drop constraint if exists profiles_intent_chk;
alter table public.profiles
  add constraint profiles_intent_chk
  check (intent is null or intent in ('calm', 'power', 'love', 'clarity'));

alter table public.profiles
  drop constraint if exists profiles_home_code_chk;
alter table public.profiles
  add constraint profiles_home_code_chk
  check (home_code is null or (home_code >= 1 and home_code <= 81));

-- roller geçerli kümeden olmalı (boş dizi de geçerli — ama default 'seeker').
alter table public.profiles
  drop constraint if exists profiles_roles_chk;
alter table public.profiles
  add constraint profiles_roles_chk
  check (roles <@ array['writer', 'artist', 'designer', 'producer', 'seeker']::text[]);


-- ─── Dizinler (keşif sorguları için) ─────────────────────────────────

-- Elemana / yuva-koduna göre filtre (frekans ağı dizini).
create index if not exists profiles_element_idx
  on public.profiles (element)
  where is_public = true and deleted_at is null;

create index if not exists profiles_home_code_idx
  on public.profiles (home_code)
  where is_public = true and deleted_at is null;

-- Rol filtreleri için GIN (roles && array['writer'] gibi sorgular).
create index if not exists profiles_roles_gin
  on public.profiles using gin (roles);


-- ─── Public üye dizini VIEW'i ────────────────────────────────────────
-- profiles RLS "yalnız sahibi okur" olduğu için public dizini doğrudan
-- profiles'tan veremeyiz (RLS satır-bazlı; tüm satırı açmak email/dob
-- sızdırır). Bunun yerine SADECE güvenli sütunları açan bir view.
--
-- View, migration rolü (postgres) tarafından oluşturulur ve varsayılan
-- olarak `security_invoker = off` çalışır → profiles RLS'ini view sahibi
-- bağlamında atlar, böylece anon/authenticated yalnızca aşağıda seçilen
-- güvenli kolonları okuyabilir. (Hassas kolonlar view'a hiç dahil değil.)

create or replace view public.public_members as
  select
    p.id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.caelinus_avatar_url,
    p.roles,
    p.element,
    p.home_code,
    p.headline,
    p.bio,
    p.links,
    p.caelinus_avatar_zodiac as zodiac,
    p.frequency_hz,
    p.network_joined_at,
    p.created_at
  from public.profiles p
  where p.is_public = true
    and p.deleted_at is null
    and p.handle is not null;

-- Public okuma — dizin herkese açık.
grant select on public.public_members to anon, authenticated;

comment on view public.public_members is
  'Frekans ağı public dizini. profiles''ın yalnız güvenli kolonlarını '
  'açar (email/dob/bildirim tercihleri HARİÇ). is_public + handle olan '
  've silinmemiş üyeleri listeler.';


-- ─── handle_new_user() — yeni üyeye varsayılan rol ───────────────────
-- Kolon default'u ('seeker') zaten yeni satırlara uygulanır; trigger'ı
-- değiştirmeye gerek yok. Mevcut satırlar da `add column ... default` ile
-- 'seeker' rolüyle backfill edilir. Handle null kalır (kullanıcı ağa
-- katılırken seçer), o yüzden eski hesaplar dizinde otomatik görünmez.

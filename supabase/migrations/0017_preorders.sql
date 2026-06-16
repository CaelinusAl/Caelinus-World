-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Soft launch — shop pre-orders (no payment)
-- Migration: 0017_preorders.sql
--
-- Yumuşak lansman aşamasında Caelinus Shop gerçek tahsilat yapmaz; bunun
-- yerine ziyaretçinin "ön sipariş" talebini ve iletişim bilgisini durable
-- olarak saklarız ki ekip sonradan ulaşabilsin.
--
-- Yazma yalnızca server (service-role) üzerinden yapılır; istemci erişimi
-- RLS ile tamamen kapalıdır (e-posta listesi sızmasın).
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.preorders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  phone text,
  items jsonb not null default '[]'::jsonb,
  address jsonb,
  total_amount integer,          -- minor units (kuruş/cent), opsiyonel
  currency text,
  note text,
  source text not null default 'shop',
  created_at timestamptz not null default now()
);

create index if not exists preorders_created_idx
  on public.preorders (created_at desc);
create index if not exists preorders_email_idx
  on public.preorders (email);

alter table public.preorders enable row level security;

-- İstemci (anon/authenticated) erişimi tamamen kapalı; yalnızca service
-- role (RLS bypass) okur/yazar.
drop policy if exists preorders_no_client_access on public.preorders;
create policy preorders_no_client_access
  on public.preorders for all
  using (false)
  with check (false);

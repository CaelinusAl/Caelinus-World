-- ============================================================================
-- CAELINUS · Gaia dwell telemetry (İZOLE, baseline ölçümü)
-- Migration: 0019_gaia_dwell.sql
-- ----------------------------------------------------------------------------
-- Metrik: "Gaia'ya giren kullanıcı 30 sn'den fazla kalıyor mu?"
-- Üretim/pilot tablolarına DOKUNULMAZ. Anonim; yazma yalnız /api/dwell route'u
-- üzerinden service-role ile yapılır (RLS bypass). Anon doğrudan erişemez.
--
-- variant = 'baseline' | 'mini-journey'  → A/B karşılaştırması (gölge→kalp→portal
-- mini-yolculuğu eklendikten sonra fark ölçülür).
-- reason  = 'heartbeat30' (30sn eşiği aşıldı) | 'leave' (sahneden ayrılış)
-- Analiz: session başına MAX(dwell_ms) → reached_30s = max>=30000.
-- ============================================================================

create table if not exists public.gaia_dwell (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  scene        text not null default 'gaia',
  variant      text not null default 'baseline',
  session_key  text,
  dwell_ms     integer check (dwell_ms is null or dwell_ms >= 0),
  interactions integer default 0,
  reason       text
);

alter table public.gaia_dwell enable row level security;
-- Policy YOK: yazma yalnız service-role (RLS bypass); anon doğrudan yazamaz/okuyamaz.

create index if not exists gaia_dwell_session_idx on public.gaia_dwell (session_key);
create index if not exists gaia_dwell_variant_idx on public.gaia_dwell (variant);
create index if not exists gaia_dwell_created_idx on public.gaia_dwell (created_at desc);

-- ============================================================================
-- CAELINUS · Avatar/Bilinç Testi — Sonuç + "% kaç anlattı" verisi
-- Migration: 0018_avatar_test.sql
-- ----------------------------------------------------------------------------
-- Veri İZOLE pilot tablosunda toplanır: public.pilot_responses (Gaia projesi).
-- ÜRETİM TABLOLARINA DOKUNULMAZ. Bu migration yalnızca eksik kolonları EKLER
-- (ADD COLUMN IF NOT EXISTS) — mevcut kolonlar (shadow_key, percent, note,
-- scores, ts, created_at) korunur.
--
-- Hedef: 50-100 kişide "İnsanlar kendilerini Caelinus içinde buluyor mu?"
-- sorusunu ölçmek. Anonim doldurulabilir (Gate33 trafiği); yazma yalnız
-- API route üzerinden service-role ile yapılır.
--
-- Kolon eşlemesi (API: app/api/avatar-test/route.ts):
--   primary_key   ← Ana Bilinç (district)
--   secondary_key ← İkincil Bilinç (district)
--   shadow_key    ← Düştüğün Gölge (district)             [mevcut kolon]
--   gate_key      ← Kapın (gölgenin panzehiri, district)
--   calling       ← Çağrı (Şifacı/Oracle/…)
--   percent       ← "Bu kart seni yüzde kaç anlattı?" 0-100 [mevcut kolon]
--   scores        ← { light: {...}, shadow: {...} } jsonb    [mevcut kolon]
--   session_key   ← anonim oturum anahtarı (crypto.randomUUID)
-- ============================================================================

alter table public.pilot_responses
  add column if not exists primary_key   text,
  add column if not exists secondary_key text,
  add column if not exists gate_key      text,
  add column if not exists calling       text,
  add column if not exists session_key   text;

create index if not exists pilot_responses_created_at_idx on public.pilot_responses (created_at desc);
create index if not exists pilot_responses_primary_idx    on public.pilot_responses (primary_key);
create index if not exists pilot_responses_session_idx    on public.pilot_responses (session_key);

-- RLS: tablo zaten row level security açık. Yazma service-role admin client
-- ile yapıldığı için (service-role RLS'i bypass eder) ek policy gerekmez.

-- ============================================================================
-- CAELINUS · Avatar Test — Sonuç + "% kaç anlattı" verisi
-- Migration: 0018_avatar_test.sql
-- ----------------------------------------------------------------------------
-- "/test" akışının çıktısını ve asıl altın veriyi (accuracy %) saklar.
-- Hedef: 50-100 kişide "İnsanlar kendilerini Caelinus içinde buluyor mu?"
-- sorusunu ölçmek. Anonim doldurulabilir (Gate33 trafiği); yazma yalnız
-- API route üzerinden service-role ile yapılır.
--
-- Çıktı 5 değer + skorlar + accuracy:
--   primary/secondary/shadow/gate district + calling + light/shadow scores
--   accuracy: kullanıcının "bu kart beni % kaç anlattı" cevabı (0-100)
-- ============================================================================

create table if not exists public.avatar_test_results (
  id                 uuid primary key default gen_random_uuid(),
  /* Giriş yapmışsa kullanıcı; çoğu anonim. */
  user_id            uuid references auth.users(id) on delete set null,
  /* Anonim oturum anahtarı (client crypto.randomUUID) — dedupe/telemetri. */
  session_key        text,
  /* Sonuç — 8 district'ten biri. */
  primary_district   text not null,
  secondary_district text,
  shadow_district    text not null,
  gate_district      text not null,
  calling            text,
  /* Ham skorlar — sonradan analiz için (jsonb). */
  light_scores       jsonb,
  shadow_scores      jsonb,
  /* ASIL VERİ: "bu kart beni % kaç anlattı" (0-100). */
  accuracy           smallint check (accuracy is null or (accuracy >= 0 and accuracy <= 100)),
  created_at         timestamptz not null default now()
);

create index if not exists idx_avatar_test_results_created   on public.avatar_test_results(created_at desc);
create index if not exists idx_avatar_test_results_primary    on public.avatar_test_results(primary_district);
create index if not exists idx_avatar_test_results_shadow     on public.avatar_test_results(shadow_district);

-- RLS: yalnız service role yazar/okur; tüm I/O API route üzerinden (admin client).
alter table public.avatar_test_results enable row level security;

drop policy if exists "avatar_test_service_all" on public.avatar_test_results;
create policy "avatar_test_service_all" on public.avatar_test_results
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

comment on table public.avatar_test_results is
  'Caelinus Avatar Test sonuçları + accuracy (% kaç anlattı) — MVP veri toplama';

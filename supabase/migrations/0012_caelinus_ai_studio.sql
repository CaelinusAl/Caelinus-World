-- ============================================================================
-- CAELINUS AI STUDIO — Backend Pipeline Tables
-- ----------------------------------------------------------------------------
-- Migration: 0012
-- Sprint:    S1 (Backend Skeleton)
-- Roadmap:   caelinus/docs/caelinus-ai-roadmap.md
-- ----------------------------------------------------------------------------
-- Caelinus AI Studio'nun arka tarafının saklayacağı 4 ana entity:
--
--   1. caelinus_ai_selfies   — kullanıcı yüklediği selfie referansları
--                              (R2/storage URL + hash + TTL)
--   2. caelinus_ai_jobs      — pipeline job'ları (queued → finalized akışı)
--   3. caelinus_ai_job_events — audit/debug için faz event log'u
--   4. caelinus_ai_avatars   — finalize tamamlanmış GeneratedAvatar'lar
--
-- Bu migration in-memory store ile birebir uyumlu — `lib/caelinus-ai/jobs/store`
-- dosyasının `SupabaseJobStore` implementasyonu (S1.j) bu şemayı kullanacak.
--
-- RLS:
--   • Anonim kullanıcılar OLUŞTURABİLİR ama sadece kendi `client_hash`'ları
--     üzerinden okuyabilir.
--   • Auth'lu kullanıcılar kendi user_id'leri ile işaretlenmiş job'lara
--     erişir.
--   • Service role tüm tablolara RW.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. SELFIES
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.caelinus_ai_selfies (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  client_hash  text not null,
  /* R2 / Supabase Storage URL'i (geçici, signed). */
  storage_url  text,
  /* Selfie'nin SHA-256 hash'i — idempotency + dedupe. */
  content_hash text,
  /* MIME türü — 'image/jpeg', 'image/png'. */
  mime_type    text,
  /* Pixel dimensions — debug + resize hint. */
  width        int,
  height       int,
  /* Yüklenme kaynağı — UI'dan gelir. */
  source       text check (source in ('upload', 'webcam', 'mobile-qr')),
  captured_at  timestamptz not null default now(),
  /* TTL — 30 gün sonra otomatik silinir (KVKK / GDPR). */
  expires_at   timestamptz not null default (now() + interval '30 days'),
  /* Soft delete — kullanıcı manuel sildiyse. */
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_caelinus_ai_selfies_user        on public.caelinus_ai_selfies(user_id);
create index if not exists idx_caelinus_ai_selfies_client_hash on public.caelinus_ai_selfies(client_hash);
create index if not exists idx_caelinus_ai_selfies_expires_at  on public.caelinus_ai_selfies(expires_at) where deleted_at is null;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. JOBS — pipeline durum makinesi
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.caelinus_ai_jobs (
  /* "caij_<uuid-trim>" formatlı stable id — server üretir. */
  id                  text primary key,
  user_id             uuid references auth.users(id) on delete cascade,
  client_hash         text not null,
  selfie_id           uuid references public.caelinus_ai_selfies(id) on delete set null,
  /* Hangi provider yarattı: 'caelinus-ai-studio', 'caelinus-ai-studio-stub', vs. */
  provider_id         text not null,
  provider_version    text not null,
  /* Pipeline durumu — JobStatus enum'la senkron. */
  status              text not null default 'queued' check (
    status in (
      'queued', 'preparing', 'analyzing-selfie', 'matching-archetype',
      'generating-variants', 'matches-ready', 'rigging', 'rendering',
      'polishing', 'finalized', 'cancelled', 'failed'
    )
  ),
  progress            int not null default 0 check (progress >= 0 and progress <= 100),
  /* Şiirsel mesaj — kullanıcıya gösterilen son güncelleme. */
  message             text,
  /* Job input — AvatarStyleProfile + selfie referansı + quality hint. */
  input               jsonb not null,
  /* Job output — analysis, matches, selectedMatchId, avatar (kümülatif). */
  output              jsonb not null default '{}'::jsonb,
  /* Hata bilgisi (status='failed' için). */
  error               jsonb,
  /* Idempotency hash — aynı input'la tekrar gelen istekleri yakala. */
  input_hash          text,
  /* Quality hint — 'fast', 'balanced', 'high'. */
  quality             text default 'balanced',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  /* Job 24 saat sonra GC'lenir — hâlâ aktif değilse. */
  expires_at          timestamptz not null default (now() + interval '24 hours')
);

create index if not exists idx_caelinus_ai_jobs_user       on public.caelinus_ai_jobs(user_id);
create index if not exists idx_caelinus_ai_jobs_status     on public.caelinus_ai_jobs(status);
create index if not exists idx_caelinus_ai_jobs_created_at on public.caelinus_ai_jobs(created_at desc);
create index if not exists idx_caelinus_ai_jobs_input_hash on public.caelinus_ai_jobs(input_hash) where input_hash is not null;
create index if not exists idx_caelinus_ai_jobs_expires_at on public.caelinus_ai_jobs(expires_at);

-- updated_at otomatik trigger
create or replace function public.caelinus_ai_jobs_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_caelinus_ai_jobs_updated_at on public.caelinus_ai_jobs;
create trigger trg_caelinus_ai_jobs_updated_at
  before update on public.caelinus_ai_jobs
  for each row execute function public.caelinus_ai_jobs_set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- 3. JOB EVENTS — audit log + Realtime broadcast surface
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.caelinus_ai_job_events (
  id          bigserial primary key,
  job_id      text not null references public.caelinus_ai_jobs(id) on delete cascade,
  /* Event türü: 'progress', 'matches', 'finalized', 'error', 'cancelled'. */
  event_type  text not null check (
    event_type in ('progress', 'matches', 'finalized', 'error', 'cancelled')
  ),
  status      text,
  progress    int,
  message     text,
  /* Tam payload — jobs.output ile redundant ama event order tutuluyor. */
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_caelinus_ai_job_events_job        on public.caelinus_ai_job_events(job_id, created_at);
create index if not exists idx_caelinus_ai_job_events_created_at on public.caelinus_ai_job_events(created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. AVATARS — finalize tamamlanan GeneratedAvatar'lar
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.caelinus_ai_avatars (
  id                  text primary key,
  user_id             uuid references auth.users(id) on delete cascade,
  job_id              text references public.caelinus_ai_jobs(id) on delete set null,
  match_id            text,
  /* GLB dosya URL'i — R2 / public/models. */
  glb_url             text not null,
  thumbnail_url       text,
  /* Style profile + reading + outfit binding hints — full GeneratedAvatar JSON. */
  payload             jsonb not null,
  /* Provider attribution. */
  provider_id         text not null,
  provider_version    text,
  generated_at        timestamptz not null default now(),
  /* Soft delete. */
  deleted_at          timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_caelinus_ai_avatars_user       on public.caelinus_ai_avatars(user_id);
create index if not exists idx_caelinus_ai_avatars_job        on public.caelinus_ai_avatars(job_id);
create index if not exists idx_caelinus_ai_avatars_created_at on public.caelinus_ai_avatars(created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- 5. RLS POLICIES
-- ──────────────────────────────────────────────────────────────────────────

alter table public.caelinus_ai_selfies     enable row level security;
alter table public.caelinus_ai_jobs        enable row level security;
alter table public.caelinus_ai_job_events  enable row level security;
alter table public.caelinus_ai_avatars     enable row level security;

-- Selfies: kullanıcı kendi selfie'lerini okuyabilir + service role her şey
drop policy if exists "selfies_user_select" on public.caelinus_ai_selfies;
create policy "selfies_user_select" on public.caelinus_ai_selfies
  for select using (
    auth.uid() = user_id or auth.role() = 'service_role'
  );

drop policy if exists "selfies_user_insert" on public.caelinus_ai_selfies;
create policy "selfies_user_insert" on public.caelinus_ai_selfies
  for insert with check (
    auth.uid() = user_id or user_id is null or auth.role() = 'service_role'
  );

drop policy if exists "selfies_service_all" on public.caelinus_ai_selfies;
create policy "selfies_service_all" on public.caelinus_ai_selfies
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Jobs: aynı pattern
drop policy if exists "jobs_user_select" on public.caelinus_ai_jobs;
create policy "jobs_user_select" on public.caelinus_ai_jobs
  for select using (
    auth.uid() = user_id or auth.role() = 'service_role'
  );

drop policy if exists "jobs_service_all" on public.caelinus_ai_jobs;
create policy "jobs_service_all" on public.caelinus_ai_jobs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Job events: sadece service role yazar; kullanıcı kendi job'larının event'lerini okur
drop policy if exists "job_events_user_select" on public.caelinus_ai_job_events;
create policy "job_events_user_select" on public.caelinus_ai_job_events
  for select using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.caelinus_ai_jobs j
      where j.id = caelinus_ai_job_events.job_id
        and j.user_id = auth.uid()
    )
  );

drop policy if exists "job_events_service_all" on public.caelinus_ai_job_events;
create policy "job_events_service_all" on public.caelinus_ai_job_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Avatars: kullanıcı kendi avatar'ını okur, service role her şey
drop policy if exists "avatars_user_select" on public.caelinus_ai_avatars;
create policy "avatars_user_select" on public.caelinus_ai_avatars
  for select using (
    auth.uid() = user_id or auth.role() = 'service_role'
  );

drop policy if exists "avatars_service_all" on public.caelinus_ai_avatars;
create policy "avatars_service_all" on public.caelinus_ai_avatars
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────
-- 6. HOUSEKEEPING — cron / GC functions
-- ──────────────────────────────────────────────────────────────────────────

-- Süresi dolmuş selfie'leri temizle (KVKK / GDPR)
create or replace function public.caelinus_ai_purge_expired_selfies()
returns int as $$
declare
  affected int;
begin
  delete from public.caelinus_ai_selfies
  where expires_at < now()
     or (deleted_at is not null and deleted_at < now() - interval '7 days');
  get diagnostics affected = row_count;
  return affected;
end;
$$ language plpgsql security definer;

-- Süresi dolmuş queued/active job'ları cancel'a çek (worker ölmüşse)
create or replace function public.caelinus_ai_purge_expired_jobs()
returns int as $$
declare
  affected int;
begin
  update public.caelinus_ai_jobs
     set status = 'cancelled',
         message = 'Worker pickup edilmedi, otomatik iptal.',
         updated_at = now()
   where expires_at < now()
     and status in ('queued', 'preparing', 'analyzing-selfie',
                    'matching-archetype', 'generating-variants',
                    'rigging', 'rendering', 'polishing');
  get diagnostics affected = row_count;
  return affected;
end;
$$ language plpgsql security definer;

-- Realtime publication (Supabase Realtime üzerinden SSE alternative subscribe için)
-- S1.j'de SupabaseJobStore bu publication'ı kullanır.
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'caelinus_ai_realtime'
  ) then
    create publication caelinus_ai_realtime for table
      public.caelinus_ai_jobs,
      public.caelinus_ai_job_events;
  end if;
end $$;

comment on table  public.caelinus_ai_selfies     is 'Caelinus AI Studio — selfie blob references (R2-backed, 30d TTL)';
comment on table  public.caelinus_ai_jobs        is 'Caelinus AI Studio — avatar generation jobs (state machine)';
comment on table  public.caelinus_ai_job_events  is 'Caelinus AI Studio — append-only event log per job';
comment on table  public.caelinus_ai_avatars     is 'Caelinus AI Studio — finalized GeneratedAvatar records';

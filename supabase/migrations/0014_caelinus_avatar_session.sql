-- ============================================================================
-- CAELINUS AVATAR — QR Session Store
-- ----------------------------------------------------------------------------
-- Migration: 0014
-- Sprint:    S2 (Selfie illusion lock-in)
-- Roadmap:   caelinus/docs/caelinus-ai-roadmap.md §S2
-- ----------------------------------------------------------------------------
-- /caelinus-avatar/create + /caelinus-avatar/m/[sessionId] flow'unun
-- backend session state'ini Postgres'e taşır. In-memory store şu an
-- aktif (lib/caelinus-avatar-core/session-store.ts içinde
-- `InMemorySessionStore`); production deploy için bu tablo + env-gated
-- `SupabaseSessionStore` kullanılır.
--
-- ⚠ Vercel multi-instance prod'da in-memory map koparır:
-- desktop function instance A QR yaratır, mobile selfie POST function
-- instance B'ye düşer → instance B map'inde session yoktur. Tablo bu
-- problemi çözer (single source of truth Postgres'te).
--
-- Schema seçimleri:
--   • id: 10-12 char base32, server üretiyor (text primary key)
--   • selfie + avatar JSONB — payload tipini app katmanı bilir
--   • expires_at indexli — `caelinus_avatar_purge_expired_sessions()` GC
--   • RLS: yalnızca service role yazar/okur (anon kullanıcılar API
--     route üzerinden geliyor; route service role ile erişiyor zaten)
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. SESSIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.caelinus_avatar_session (
  /* "ABCD23WXYZ" formatlı 10-12 karakter base32 id — server üretir.
     QR'a girdiği için kısa tutuyoruz, mobile URL kısa olsun. */
  id            text primary key,
  /* Pipeline durumu — SessionStatus enum'la senkron. */
  status        text not null default 'pending' check (
    status in (
      'pending', 'mobile-connected', 'selfie-uploading',
      'selfie-received', 'generating', 'ready', 'error', 'expired'
    )
  ),
  /* QR'a girecek mobile URL — host bilgisi server-side compose. */
  mobile_url    text not null,
  /* SelfieInput — { dataUrl, source, capturedAt, width, height }.
     dataUrl base64 ~150-300 KB; tablo TOAST otomatik açacak. */
  selfie        jsonb,
  /* GeneratedAvatar — { id, glbUrl, styleProfile, reading, ... }. */
  avatar        jsonb,
  /* Hata mesajı (status='error' için). */
  error_message text,
  /* Desktop'tan publish eden client'ın id'si — telemetri için. */
  publisher_id  text,
  created_at    timestamptz not null default now(),
  /* TTL — 10 dakika. expires_at < now() ise getSession null döner. */
  expires_at    timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists idx_caelinus_avatar_session_expires_at
  on public.caelinus_avatar_session(expires_at);
create index if not exists idx_caelinus_avatar_session_status
  on public.caelinus_avatar_session(status);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. RLS — yalnızca service role
-- ──────────────────────────────────────────────────────────────────────────

alter table public.caelinus_avatar_session enable row level security;

-- Anon/auth kullanıcılar bu tabloya doğrudan erişmesin; tüm I/O
-- API route'lar üzerinden, route'lar service role admin client kullanır.
drop policy if exists "session_service_all" on public.caelinus_avatar_session;
create policy "session_service_all" on public.caelinus_avatar_session
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────
-- 3. HOUSEKEEPING — expired session GC
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.caelinus_avatar_purge_expired_sessions()
returns int as $$
declare
  affected int;
begin
  delete from public.caelinus_avatar_session
  where expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$ language plpgsql security definer;

comment on table public.caelinus_avatar_session is
  'Caelinus QR avatar session — desktop ↔ mobile köprüsü, 10dk TTL';
comment on function public.caelinus_avatar_purge_expired_sessions() is
  'Cron-driven cleanup; in-app cleanup timer her 60sn de tetikleniyor';

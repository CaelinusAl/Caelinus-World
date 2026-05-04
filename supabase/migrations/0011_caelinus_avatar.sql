-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 11 — Auth-bound AI avatar persist (Faz 3.3)
-- Migration: 0011_caelinus_avatar.sql
--
-- Avatar Studio'da (`/avatar`) üretilen face-swap görseli artık
-- kullanıcının Caelinus hesabına bağlanır. Genel `profiles.avatar_url`
-- (ufak profil fotoğrafı) ile karışmasın diye AI avatar için ayrı
-- alanlar tutulur:
--
--   profiles.caelinus_avatar_url        — user-avatars bucket public URL
--                                          (path: {user_id}/caelinus.<ext>)
--   profiles.caelinus_avatar_zodiac     — kullanıcının seçtiği burç
--                                          (12 burçtan biri)
--   profiles.caelinus_avatar_updated_at — son üretim zamanı
--
-- Storage politikaları:
--   `user-avatars` bucket'ı 0008'de yaratıldı, public read + owner
--   write halen geçerli. Yeni alan eklemiyoruz; sadece var olan
--   bucket'ı kullanıyoruz. AI avatar dosyaları
--   `{user_id}/caelinus.png` (ya da .jpg/.webp) olarak yüklenir;
--   her kaydedişte aynı path → upsert, eski avatar silinir.
--
-- Bu migration'ın hiçbir mevcut row'u kırmaması için tüm kolonlar
-- nullable. Avatar olmayan kullanıcılar etkilenmez; localStorage
-- yine yedek/anonim akışın temeli olarak kalır.
-- ─────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists caelinus_avatar_url        text,
  add column if not exists caelinus_avatar_zodiac     text,
  add column if not exists caelinus_avatar_updated_at timestamptz;

-- Burcun değeri 12 burçtan biri olmalı. Constraint mevcut row'ları
-- bozmaz çünkü null'lar serbest.
alter table public.profiles
  drop constraint if exists profiles_caelinus_avatar_zodiac_check;

alter table public.profiles
  add constraint profiles_caelinus_avatar_zodiac_check
  check (
    caelinus_avatar_zodiac is null
    or caelinus_avatar_zodiac in (
      'aries','taurus','gemini','cancer','leo','virgo',
      'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
    )
  );

-- Hızlı erişim — "kullanıcının avatarı var mı" sorusu sık çalışacak.
create index if not exists profiles_caelinus_avatar_url_idx
  on public.profiles (id)
  where caelinus_avatar_url is not null;

-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Wardrobe Faz B
-- Migration: 0013_avatar_base.sql
--
-- profiles.caelinus_avatar_base — kullanıcının seçtiği base tuval. 3 sabit
-- değer: 'silk' | 'bodysuit' | 'veil'. lib/avatar/canvases.ts ve
-- lib/supabase/types.ts (ProfileRow.caelinus_avatar_base) bununla hizalı.
--
-- (Bu dosya repo'da eksikti; tam şema kurulumunda profiles bütünlüğü için
--  eklendi. `if not exists` ile idempotent.)
-- ─────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists caelinus_avatar_base text;

alter table public.profiles
  drop constraint if exists profiles_caelinus_avatar_base_chk;
alter table public.profiles
  add constraint profiles_caelinus_avatar_base_chk
  check (
    caelinus_avatar_base is null
    or caelinus_avatar_base in ('silk', 'bodysuit', 'veil')
  );

-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 10 — Story-only goods
-- Migration: 0010_item_story.sql
--
-- Vizyon: "Caelinus bir moda markası değil. Bir deneyim."
--   → Vitrindeki her ürün hikâyeli olmak zorunda. Bu migration
--     hikâyeyi şema seviyesinde birinci sınıf vatandaş yapar:
--
--   atelier_items.story_chapters       jsonb (default '[]')
--                                      → [{mark, title_tr, text_tr,
--                                          title_en?, text_en?, image_url?}]
--   atelier_items.provenance           jsonb (default '{}')
--                                      → {region, producer_id?, atelier_origin?,
--                                          materials:[{name, source}]}
--   atelier_items.narrative_video_url  text (nullable)
--                                      → kısa hikâye videosu (PDP başında oynar)
--
-- Yayın guard'ı:
--   Bir ürün `published` statüsüne geçebilmek için **en az birinden**
--   beslenmeli:
--     • story_tr veya story_en (uzun anlatı) dolu, VEYA
--     • story_chapters dizisinde en az 1 eleman var.
--
--   Bu kural CHECK constraint olarak eklenir; eski draft/archived
--   satırlar etkilenmez (yalnız status='published' iken zorunlu).
--
-- RLS politikaları 0003'te zaten "owner her şeyi yazabilir" tabanında
-- olduğu için yeni alanlar otomatik yazılabilir; ek policy gerekmez.
-- ─────────────────────────────────────────────────────────────────────


-- ─── Columns ─────────────────────────────────────────────────────────

alter table public.atelier_items
  add column if not exists story_chapters      jsonb not null default '[]'::jsonb,
  add column if not exists provenance          jsonb not null default '{}'::jsonb,
  add column if not exists narrative_video_url text;


-- ─── Indexes (light) ─────────────────────────────────────────────────
-- GIN on story_chapters for future filters (mood/atelier-search), and
-- on provenance for region/producer lookups. Both jsonb_path_ops to
-- keep index size compact since we only need containment queries.

create index if not exists atelier_items_story_chapters_gin
  on public.atelier_items using gin (story_chapters jsonb_path_ops);

create index if not exists atelier_items_provenance_gin
  on public.atelier_items using gin (provenance jsonb_path_ops);


-- ─── Published-only story guard ──────────────────────────────────────
-- Idempotent: drop + recreate so migration can re-run safely.

alter table public.atelier_items
  drop constraint if exists atelier_items_published_needs_story;

alter table public.atelier_items
  add constraint atelier_items_published_needs_story
  check (
    status <> 'published'
    or coalesce(length(story_tr), 0) > 0
    or coalesce(length(story_en), 0) > 0
    or jsonb_array_length(story_chapters) >= 1
  );


-- ─── Narrative video URL shape ───────────────────────────────────────
-- Allow null, but if filled it must look like a public http(s) URL.
-- Keeps storage bucket links + Vimeo/YouTube embeds both valid.

alter table public.atelier_items
  drop constraint if exists atelier_items_narrative_video_shape;

alter table public.atelier_items
  add constraint atelier_items_narrative_video_shape
  check (
    narrative_video_url is null
    or narrative_video_url ~ '^https?://[^\s]+$'
  );

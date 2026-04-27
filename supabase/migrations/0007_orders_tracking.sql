-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 6.1 — atelier_orders tracking + lifecycle timestamps
-- Migration: 0007_orders_tracking.sql
--
-- Adds the columns the maker dashboard needs to walk an order
-- from "paid" → "shipped" → "delivered". Cancellation/refund
-- timestamps round out the lifecycle for support purposes.
--
-- All columns nullable so historical "paid" rows from 0006 survive
-- without a backfill. New columns are not part of the buyer-checkout
-- flow — only the maker UI writes here, and RLS already permits
-- atelier owners to update their own orders.
-- ─────────────────────────────────────────────────────────────────────

alter table public.atelier_orders
  add column if not exists tracking_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists maker_note text,
  add column if not exists buyer_notified_shipped_at timestamptz;

-- The owner status update needs to know which order to flip; we
-- already index by atelier_id but a dedicated status filter on the
-- maker's "open shipments" view earns its keep.
create index if not exists atelier_orders_status_idx
  on public.atelier_orders (atelier_id, status, created_at desc);

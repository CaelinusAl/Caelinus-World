-- ─────────────────────────────────────────────────────────────────────
-- CAELINUS · Phase 6 — atelier orders (Stripe Checkout)
-- Migration: 0006_orders.sql
--
-- Two tables:
--
--   atelier_orders        — one row per checkout session. Holds buyer
--                           contact, shipping address, monetary totals
--                           and the Stripe ids needed to reconcile.
--
--   atelier_order_items   — one row per line on the order. Snapshots
--                           the item title / price / cover at purchase
--                           time so historical orders stay accurate
--                           even if the maker edits the listing later.
--
-- Writes are funnelled through the Stripe webhook (server-only,
-- service-role). Buyers and atelier owners can read their respective
-- rows via RLS.
-- ─────────────────────────────────────────────────────────────────────

-- ─── enums ───────────────────────────────────────────────────────────

do $$ begin
  create type public.order_status as enum (
    'pending',     -- session created, payment not confirmed
    'paid',        -- payment_intent.succeeded
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

-- ─── atelier_orders ──────────────────────────────────────────────────

create table if not exists public.atelier_orders (
  id uuid primary key default gen_random_uuid(),
  -- Buyer can be null for guest checkout (Stripe collects email).
  buyer_user_id uuid references auth.users(id) on delete set null,
  atelier_id uuid not null references public.ateliers(id) on delete restrict,
  status public.order_status not null default 'pending',
  -- Money snapshot, all in minor units (kuruş, cents).
  currency text not null,
  subtotal_amount integer not null check (subtotal_amount >= 0),
  shipping_amount integer not null default 0 check (shipping_amount >= 0),
  tax_amount integer not null default 0 check (tax_amount >= 0),
  total_amount integer not null check (total_amount >= 0),
  -- Buyer contact (denormalised so guest orders still work).
  buyer_email text,
  buyer_name text,
  shipping_address jsonb,
  -- Stripe linkage.
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  -- Optional notes from the buyer (Stripe Checkout custom field).
  buyer_notes text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists atelier_orders_buyer_idx
  on public.atelier_orders (buyer_user_id, created_at desc);
create index if not exists atelier_orders_atelier_idx
  on public.atelier_orders (atelier_id, created_at desc);
create index if not exists atelier_orders_session_idx
  on public.atelier_orders (stripe_checkout_session_id);

-- ─── atelier_order_items ─────────────────────────────────────────────

create table if not exists public.atelier_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.atelier_orders(id) on delete cascade,
  item_id uuid not null references public.atelier_items(id) on delete restrict,
  -- Snapshot at purchase time. The item could be edited or archived
  -- later; the order should keep what the buyer actually saw.
  title_snapshot text not null,
  currency_snapshot text not null,
  price_snapshot_amount integer not null check (price_snapshot_amount >= 0),
  image_snapshot_url text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists atelier_order_items_order_idx
  on public.atelier_order_items (order_id);
create index if not exists atelier_order_items_item_idx
  on public.atelier_order_items (item_id);

-- ─── updated_at trigger on orders ───────────────────────────────────

create or replace function public.touch_atelier_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_atelier_orders_touch on public.atelier_orders;
create trigger trg_atelier_orders_touch
before update on public.atelier_orders
for each row execute function public.touch_atelier_orders_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.atelier_orders enable row level security;
alter table public.atelier_order_items enable row level security;

-- Orders: buyer reads own, atelier owner reads orders to their atelier.
drop policy if exists orders_select_buyer on public.atelier_orders;
create policy orders_select_buyer
  on public.atelier_orders for select
  using (auth.uid() = buyer_user_id);

drop policy if exists orders_select_atelier_owner on public.atelier_orders;
create policy orders_select_atelier_owner
  on public.atelier_orders for select
  using (public.is_atelier_owner(atelier_id));

-- Atelier owner can flip status (shipped, delivered, cancelled). Buyers
-- cannot edit orders directly. Service role bypasses RLS for the
-- webhook flow.
drop policy if exists orders_update_atelier_owner on public.atelier_orders;
create policy orders_update_atelier_owner
  on public.atelier_orders for update
  using (public.is_atelier_owner(atelier_id))
  with check (public.is_atelier_owner(atelier_id));

-- Lock down inserts/deletes from anon/authenticated entirely; only the
-- Stripe webhook (service role) creates rows and only the buyer's
-- support contact can void them.
drop policy if exists orders_no_client_inserts on public.atelier_orders;
create policy orders_no_client_inserts
  on public.atelier_orders for insert
  with check (false);

drop policy if exists orders_no_client_deletes on public.atelier_orders;
create policy orders_no_client_deletes
  on public.atelier_orders for delete
  using (false);

-- Order items: piggyback on parent order RLS.
drop policy if exists order_items_select_buyer on public.atelier_order_items;
create policy order_items_select_buyer
  on public.atelier_order_items for select
  using (
    exists (
      select 1 from public.atelier_orders o
      where o.id = atelier_order_items.order_id
        and o.buyer_user_id = auth.uid()
    )
  );

drop policy if exists order_items_select_atelier_owner on public.atelier_order_items;
create policy order_items_select_atelier_owner
  on public.atelier_order_items for select
  using (
    exists (
      select 1 from public.atelier_orders o
      where o.id = atelier_order_items.order_id
        and public.is_atelier_owner(o.atelier_id)
    )
  );

drop policy if exists order_items_no_client_writes on public.atelier_order_items;
create policy order_items_no_client_writes
  on public.atelier_order_items for all
  using (false)
  with check (false);

-- BetInsight Trainer Feed / Community Billing v1
-- STAGING ONLY. Do not apply to production until the feature is approved.
-- 2026-09-27

begin;

alter table public.community_posts
  add column if not exists distribution_scope text not null default 'PROFILE',
  add column if not exists billing_tier text,
  add column if not exists unit_cost numeric(8,2) not null default 0,
  add column if not exists unit_charge_status text not null default 'NOT_REQUIRED',
  add column if not exists billing_month text,
  add column if not exists billing_reference text,
  add column if not exists paid_at timestamptz,
  add column if not exists membership_status_snapshot text,
  add column if not exists premium_until_snapshot timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='community_posts_distribution_scope_chk') then
    alter table public.community_posts add constraint community_posts_distribution_scope_chk
      check (distribution_scope in ('PROFILE','GLOBAL'));
  end if;
  if not exists (select 1 from pg_constraint where conname='community_posts_charge_status_chk') then
    alter table public.community_posts add constraint community_posts_charge_status_chk
      check (unit_charge_status in ('NOT_REQUIRED','PENDING','PAID','FAILED','REFUNDED'));
  end if;
end $$;

create table if not exists public.community_membership_state (
  owner_ref text primary key,
  raw_tier text not null default 'BASIS',
  effective_tier text not null default 'BASIS',
  effective_status text not null default 'BASIS',
  payment_confirmed boolean not null default false,
  premium_until timestamptz,
  grace_until timestamptz,
  auto_renew text,
  tariff_code text,
  units_available numeric(12,2) not null default 0,
  profile_synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_post_charges (
  id uuid primary key default gen_random_uuid(),
  post_id uuid unique references public.community_posts(id) on delete cascade,
  owner_ref text not null,
  club_id uuid not null,
  distribution_scope text not null default 'GLOBAL',
  tier_snapshot text not null,
  membership_status_snapshot text not null,
  premium_until_snapshot timestamptz,
  month_key text not null,
  unit_cost numeric(8,2) not null,
  charge_status text not null default 'PENDING',
  external_reference text,
  balance_before numeric(12,2),
  balance_after numeric(12,2),
  error_code text,
  created_at timestamptz not null default now(),
  charged_at timestamptz,
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='community_post_charges_scope_chk') then
    alter table public.community_post_charges add constraint community_post_charges_scope_chk
      check (distribution_scope='GLOBAL');
  end if;
  if not exists (select 1 from pg_constraint where conname='community_post_charges_status_chk') then
    alter table public.community_post_charges add constraint community_post_charges_status_chk
      check (charge_status in ('PENDING','PAID','FAILED','REFUNDED'));
  end if;
end $$;

create index if not exists community_membership_state_effective_idx
  on public.community_membership_state(effective_tier,effective_status,updated_at desc);

create index if not exists community_posts_scope_status_created_idx
  on public.community_posts(distribution_scope,status,created_at desc);
create index if not exists community_post_charges_owner_month_idx
  on public.community_post_charges(owner_ref,month_key,charge_status,created_at desc);

-- Public/profile feed policy:
-- PROFILE = only on the author's profile.
-- GLOBAL  = central Trainer Feed + appears on every trainer profile.
--
-- Pricing contract:
-- BASIS        0.50 Units/global post, no invented monthly cap.
-- PREMIUM      0.25 Units/global post, max 10/month.
-- PREMIUM_PLUS 0.10 Units/global post, max 20/month.
--
-- Normal posts/comments publish without routine admin review.
-- Posts/comments containing an external link go to PENDING_REVIEW.
-- Reported content remains visible in the admin moderation queue.
-- Subscription benefits are based on EFFECTIVE status; expired Premium
-- automatically falls back to BASIS for pricing/quota purposes.

commit;

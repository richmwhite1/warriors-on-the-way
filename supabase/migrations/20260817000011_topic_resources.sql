-- Phase Two / Rec 4 — Resources directory (per-topic geographic directory).
-- NOT a feed. A filtered directory sorted by proximity, category, and vouches.
-- Distinct from the existing community-scoped `resources` table.

do $$ begin
  create type public.topic_resource_category as enum (
    'practitioner', 'farm', 'school', 'business', 'organization', 'place', 'service', 'other'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.topic_resources (
  id           uuid primary key default gen_random_uuid(),
  topic_id     uuid not null references public.topics (id) on delete cascade,
  created_by   uuid not null references public.users (id) on delete cascade,
  title        text not null,
  description  text,
  category     public.topic_resource_category not null default 'other',
  url          text,
  address      text,        -- general location text
  latitude     double precision,
  longitude    double precision,
  hidden_at    timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists topic_resources_topic_idx on public.topic_resources (topic_id) where hidden_at is null;
create index if not exists topic_resources_geo_idx on public.topic_resources (latitude, longitude);

alter table public.topic_resources enable row level security;

-- Public directory: anyone signed in can read (proximity filtering is done in queries).
drop policy if exists "topic_resources: read" on public.topic_resources;
create policy "topic_resources: read"
  on public.topic_resources for select
  using (hidden_at is null or auth.uid() = created_by or public.is_topic_reviewer(topic_id));

drop policy if exists "topic_resources: create" on public.topic_resources;
create policy "topic_resources: create"
  on public.topic_resources for insert
  with check (auth.uid() = created_by);

drop policy if exists "topic_resources: edit own or reviewer" on public.topic_resources;
create policy "topic_resources: edit own or reviewer"
  on public.topic_resources for update
  using (auth.uid() = created_by or public.is_topic_reviewer(topic_id));

-- Vouches: one per person per resource; a lightweight trust signal for sorting.
create table if not exists public.resource_vouches (
  resource_id uuid not null references public.topic_resources (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (resource_id, user_id)
);

alter table public.resource_vouches enable row level security;

drop policy if exists "resource_vouches: read" on public.resource_vouches;
create policy "resource_vouches: read"
  on public.resource_vouches for select using (true);

drop policy if exists "resource_vouches: manage own" on public.resource_vouches;
create policy "resource_vouches: manage own"
  on public.resource_vouches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

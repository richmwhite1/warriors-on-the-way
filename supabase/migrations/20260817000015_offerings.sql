-- Phase Two / Shannon's vision — Offerings (recurring & standing programs).
-- Most of the chapter menu is recurring: weekly yoga, a 4-week women's program,
-- a monthly potluck, a standing grief group. `events` is single-instance; this is
-- the distinct home for the ongoing ones. Peer-to-peer & free: there is NO fee
-- column — only an optional `cost_note` for "chip in for shared costs" logistics.

do $$ begin
  create type public.offering_status as enum ('active', 'paused', 'ended');
exception when duplicate_object then null; end $$;

create table if not exists public.offerings (
  id                  uuid primary key default gen_random_uuid(),
  community_id        uuid not null references public.communities (id) on delete cascade,
  created_by          uuid not null references public.users (id),
  title               text not null,
  description         text,
  -- Who leads it. A free-text name always; optionally linked to a member profile.
  facilitator_name    text,
  facilitator_user_id uuid references public.users (id),
  -- Human-readable cadence, e.g. "Tuesdays 6pm" or "First Sunday monthly".
  cadence_text        text,
  -- Optional next concrete session (for sorting / "next up" surfacing).
  next_starts_at      timestamptz,
  location            text,
  -- The mission badge (Seán's nine). Null falls back to the community's topic tag(s).
  topic_id            uuid references public.topics (id),
  -- Optional, non-commercial: "Bring $8 for groceries". Never a required fee.
  cost_note           text,
  status              public.offering_status not null default 'active',
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists offerings_community_idx on public.offerings (community_id) where deleted_at is null;
create index if not exists offerings_next_idx on public.offerings (next_starts_at) where deleted_at is null;

alter table public.offerings enable row level security;

-- Public menu: anyone (incl. signed-out guests) may read a live offering.
drop policy if exists "offerings: public read" on public.offerings;
create policy "offerings: public read"
  on public.offerings for select
  using (deleted_at is null or created_by = auth.uid() or public.is_admin(community_id));

drop policy if exists "offerings: create if member" on public.offerings;
create policy "offerings: create if member"
  on public.offerings for insert
  with check (public.is_member(community_id) and created_by = auth.uid());

drop policy if exists "offerings: edit by creator or admin" on public.offerings;
create policy "offerings: edit by creator or admin"
  on public.offerings for update
  using (created_by = auth.uid() or public.is_admin(community_id))
  with check (created_by = auth.uid() or public.is_admin(community_id));

drop trigger if exists trg_offerings_updated_at on public.offerings;
create trigger trg_offerings_updated_at
  before update on public.offerings
  for each row execute function public.set_updated_at();

-- ─── Offering ↔ needs (which of Shannon's six it answers) ───────────────────
create table if not exists public.offering_needs (
  offering_id uuid not null references public.offerings (id) on delete cascade,
  need_id     uuid not null references public.needs (id) on delete cascade,
  primary key (offering_id, need_id)
);

alter table public.offering_needs enable row level security;

drop policy if exists "offering_needs: public read" on public.offering_needs;
create policy "offering_needs: public read"
  on public.offering_needs for select using (true);

drop policy if exists "offering_needs: manage by offering editor" on public.offering_needs;
create policy "offering_needs: manage by offering editor"
  on public.offering_needs for all
  using (exists (
    select 1 from public.offerings o
    where o.id = offering_id
      and (o.created_by = auth.uid() or public.is_admin(o.community_id))
  ))
  with check (exists (
    select 1 from public.offerings o
    where o.id = offering_id
      and (o.created_by = auth.uid() or public.is_admin(o.community_id))
  ));

create index if not exists offering_needs_need_idx on public.offering_needs (need_id);

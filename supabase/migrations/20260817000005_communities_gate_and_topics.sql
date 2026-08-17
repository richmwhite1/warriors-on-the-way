-- Phase One / WS4 — Community topic-tagging, the 5-member visibility gate,
-- 30-day dormancy, configurable flag threshold, and activity tracking.
-- Role mapping: existing community_role enum is reused — 'organizer' = owner/creator,
-- 'admin' = appointed steward, 'member' = member. is_admin() already grants both
-- organizer and admin the steward moderation powers, so no enum surgery is needed.

do $$ begin
  create type public.community_status as enum ('forming', 'listed', 'dormant');
exception when duplicate_object then null; end $$;

alter table public.communities
  add column if not exists purpose        text,               -- one-sentence declaration
  add column if not exists status         public.community_status not null default 'forming',
  add column if not exists flag_threshold int not null default 3,  -- moderation dial
  add column if not exists dormant_at     timestamptz;

-- Grandfather any existing communities into the browsable state.
update public.communities set status = 'listed' where status = 'forming';

-- Weighted-by-meaning activity, kept as a single timestamp per membership (per §8).
-- Only meaningful actions touch it; likes/reads never do. Drives the phase-two sweep.
alter table public.community_members
  add column if not exists last_meaningful_action_at timestamptz not null default now();

-- ─── Community ↔ topic tags (≥1 required at creation, enforced in the action) ─
create table if not exists public.community_topics (
  community_id uuid not null references public.communities (id) on delete cascade,
  topic_id     uuid not null references public.topics (id) on delete cascade,
  primary key (community_id, topic_id)
);

alter table public.community_topics enable row level security;

drop policy if exists "community_topics: public read" on public.community_topics;
create policy "community_topics: public read"
  on public.community_topics for select using (true);

drop policy if exists "community_topics: manage by admin" on public.community_topics;
create policy "community_topics: manage by admin"
  on public.community_topics for all
  using (public.is_admin(community_id))
  with check (public.is_admin(community_id));

-- ─── 5-member visibility gate: flip forming → listed at 5 active members ────
create or replace function public.promote_community_on_fifth_member()
returns trigger language plpgsql as $$
declare active_count int;
begin
  if new.status = 'active' then
    select count(*) into active_count
    from public.community_members
    where community_id = new.community_id and status = 'active';

    if active_count >= 5 then
      update public.communities
        set status = 'listed', dormant_at = null
        where id = new.community_id and status = 'forming';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_promote_community on public.community_members;
create trigger trg_promote_community
  after insert or update of status on public.community_members
  for each row execute function public.promote_community_on_fifth_member();

-- ─── 30-day dormancy sweep: forming + <5 members + >30 days old → dormant ───
-- Releases the slug so the name becomes available again. Called by a daily cron.
create or replace function public.sweep_dormant_communities()
returns int language plpgsql security definer as $$
declare swept int := 0;
begin
  with stale as (
    select c.id, c.slug
    from public.communities c
    where c.status = 'forming'
      and c.created_at < now() - interval '30 days'
      and (
        select count(*) from public.community_members m
        where m.community_id = c.id and m.status = 'active'
      ) < 5
  )
  update public.communities c
    set status = 'dormant',
        dormant_at = now(),
        slug = 'dormant-' || left(c.id::text, 8) || '-' || c.slug
  from stale
  where c.id = stale.id;
  get diagnostics swept = row_count;
  return swept;
end;
$$;

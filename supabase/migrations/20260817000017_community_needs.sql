-- Communities ↔ Shannon's six needs.
--
-- The need taxonomy already tags events, offerings and practitioner entries — but not
-- communities, which is the one thing a person actually *joins*. So someone arriving at
-- "I Need Support" could see a grief group's next session and the facilitator's profile,
-- yet had no way to find the circle itself. Meanwhile a founder describes their group in
-- missions (the nine) while a seeker browses by need (the six), and the two vocabularies
-- never met.
--
-- This is the join table that closes that loop. Same shape as event_needs / offering_needs.

create table if not exists public.community_needs (
  community_id uuid not null references public.communities (id) on delete cascade,
  need_id      uuid not null references public.needs (id) on delete cascade,
  primary key (community_id, need_id)
);

create index if not exists community_needs_need_idx on public.community_needs (need_id);

alter table public.community_needs enable row level security;

-- Public read: the doorway pages are readable signed-out, so the tags must be too.
drop policy if exists "community_needs: public read" on public.community_needs;
create policy "community_needs: public read"
  on public.community_needs for select using (true);

-- Managed by a steward of the community, matching who can edit its settings.
drop policy if exists "community_needs: manage by steward" on public.community_needs;
create policy "community_needs: manage by steward"
  on public.community_needs for all
  using (public.is_admin(community_id))
  with check (public.is_admin(community_id));

-- Backfill: map the nine reclamations onto the six doorways so existing communities
-- appear on the menu immediately rather than waiting for every steward to re-tag by
-- hand. A mission can answer more than one felt need — Healing is both "care for my
-- body" and "life feels heavy" — so this is many-to-many on purpose. Best-effort
-- starting point, not a permanent mapping: stewards can change it in settings, and
-- `on conflict do nothing` means it never overwrites a tag that already exists.
insert into public.community_needs (community_id, need_id)
select distinct ct.community_id, n.id
from public.community_topics ct
join public.topics t on t.id = ct.topic_id
join (values
    ('education',     'curious'),
    ('storytelling',  'curious'),
    ('healing',       'wellness'),
    ('healing',       'support'),
    ('spirituality',  'guidance'),
    ('spirituality',  'support'),
    ('food',          'community'),
    ('entertainment', 'community'),
    ('economics',     'serve'),
    ('democracy',     'serve'),
    ('fire',          'serve')
  ) as m(topic_slug, need_slug) on m.topic_slug = t.slug
join public.needs n on n.slug = m.need_slug
on conflict do nothing;

-- Any community left with no doorway at all still needs to be findable, so give it the
-- broadest one that is always true of a community: people looking for connection.
insert into public.community_needs (community_id, need_id)
select c.id, n.id
from public.communities c
cross join public.needs n
where n.slug = 'community'
  and not exists (select 1 from public.community_needs cn where cn.community_id = c.id)
on conflict do nothing;

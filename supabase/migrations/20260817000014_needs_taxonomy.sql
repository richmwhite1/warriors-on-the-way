-- Phase Two / Shannon's vision — the "needs" taxonomy (the six felt needs).
-- This is the NAVIGATION spine: how a person arrives ("life feels heavy…").
-- It is orthogonal to `topics` (Seán's nine missions), which stay as the MEANING
-- lens — a mission badge on every offering/event. Neither is a sub-tree of the other.
-- Mirrors the `topics` table shape (public-read, seed-only writes) and the
-- `community_topics` junction shape for the *_needs join tables.

create table if not exists public.needs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,          -- the menu heading, e.g. "I Need Support"
  tagline     text,                   -- short secondary line, e.g. "Learn & explore"
  -- Shannon's first-person quote shown under the heading. Her words; keep verbatim.
  prompt      text,
  icon        text,                   -- lucide-react icon name
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.needs enable row level security;

drop policy if exists "needs: public read" on public.needs;
create policy "needs: public read"
  on public.needs for select using (true);
-- Writes are seed-only (service role bypasses RLS). No public write policies.

-- ─── Seed the six (Shannon's headings + quotes, verbatim) ───────────────────
insert into public.needs (slug, name, tagline, prompt, icon, sort_order)
values
  ('curious',   'I''m Curious',        'Learn & explore',        'I''m ready to deepen my understanding.',                                'compass',     1),
  ('support',   'I Need Support',      'You don''t walk alone',  'Life feels heavy and I don''t want to walk alone.',                     'life-buoy',   2),
  ('guidance',  'Personal Guidance',   'One-on-one journeying',  'I''d like one-on-one support for my journey.',                          'hand-heart',  3),
  ('community', 'I Want Community',     'Authentic connection',   'I''m looking for meaningful relationships and authentic connection.',    'users-round', 4),
  ('wellness',  'Movement & Wellness', 'Care for the body',      'I want to care for my body as part of my spiritual journey.',            'flower-2',    5),
  ('serve',     'I Want to Serve',      'Make a difference',      'I want to make a difference.',                                          'sprout',      6)
on conflict (slug) do update
  set name = excluded.name,
      tagline = excluded.tagline,
      prompt = excluded.prompt,
      icon = excluded.icon,
      sort_order = excluded.sort_order;

-- ─── Mission badge on events ────────────────────────────────────────────────
-- An event can carry an explicit mission (Seán's nine). When null, the query layer
-- falls back to the event's community's topic tag(s).
alter table public.events
  add column if not exists topic_id uuid references public.topics (id);

-- ─── Event ↔ needs (which of Shannon's six an event answers) ────────────────
create table if not exists public.event_needs (
  event_id uuid not null references public.events (id) on delete cascade,
  need_id  uuid not null references public.needs (id) on delete cascade,
  primary key (event_id, need_id)
);

alter table public.event_needs enable row level security;

drop policy if exists "event_needs: public read" on public.event_needs;
create policy "event_needs: public read"
  on public.event_needs for select using (true);

-- Managed by whoever can edit the event: its creator or a community steward.
drop policy if exists "event_needs: manage by event editor" on public.event_needs;
create policy "event_needs: manage by event editor"
  on public.event_needs for all
  using (exists (
    select 1 from public.events e
    where e.id = event_id
      and (e.created_by = auth.uid() or public.is_admin(e.community_id))
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = event_id
      and (e.created_by = auth.uid() or public.is_admin(e.community_id))
  ));

-- ─── Practitioner-directory entry ↔ needs (browse the directory by need) ────
create table if not exists public.resource_needs (
  resource_id uuid not null references public.topic_resources (id) on delete cascade,
  need_id     uuid not null references public.needs (id) on delete cascade,
  primary key (resource_id, need_id)
);

alter table public.resource_needs enable row level security;

drop policy if exists "resource_needs: public read" on public.resource_needs;
create policy "resource_needs: public read"
  on public.resource_needs for select using (true);

-- Managed by the entry's author or a topic reviewer (mirrors topic_resources edit).
drop policy if exists "resource_needs: manage by resource editor" on public.resource_needs;
create policy "resource_needs: manage by resource editor"
  on public.resource_needs for all
  using (exists (
    select 1 from public.topic_resources r
    where r.id = resource_id
      and (r.created_by = auth.uid() or public.is_topic_reviewer(r.topic_id))
  ))
  with check (exists (
    select 1 from public.topic_resources r
    where r.id = resource_id
      and (r.created_by = auth.uid() or public.is_topic_reviewer(r.topic_id))
  ));

create index if not exists event_needs_need_idx on public.event_needs (need_id);
create index if not exists resource_needs_need_idx on public.resource_needs (need_id);

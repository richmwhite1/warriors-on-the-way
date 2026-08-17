-- Phase One / WS2 — Topics layer (the nine mission domains).
-- Constraint: manifesto text is Seán's, verbatim, never softened or paraphrased.
-- It lives in `manifesto_objective`. The store-facing/solution framing lives in a
-- SEPARATE column `solution_statement` and is the only text used for OG tags, store
-- listings, onboarding, and paid acquisition. The two are never concatenated in code.

create table if not exists public.topics (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  -- Seán's verbatim manifesto line. Do not edit, soften, or paraphrase.
  manifesto_objective text not null,
  -- Product/solution framing (safe for store + acquisition). Editable.
  solution_statement  text,
  icon                text,           -- lucide-react icon name
  sort_order          int  not null default 0,
  created_at          timestamptz not null default now()
);

alter table public.topics enable row level security;

drop policy if exists "topics: public read" on public.topics;
create policy "topics: public read"
  on public.topics for select using (true);
-- Writes are seed-only (service role bypasses RLS). No public write policies.

-- ─── Follows: which topics a person follows (feeds into Home) ───────────────
create table if not exists public.topic_follows (
  user_id    uuid not null references public.users (id) on delete cascade,
  topic_id   uuid not null references public.topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.topic_follows enable row level security;

drop policy if exists "topic_follows: read own" on public.topic_follows;
create policy "topic_follows: read own"
  on public.topic_follows for select using (auth.uid() = user_id);

drop policy if exists "topic_follows: follow" on public.topic_follows;
create policy "topic_follows: follow"
  on public.topic_follows for insert with check (auth.uid() = user_id);

drop policy if exists "topic_follows: unfollow" on public.topic_follows;
create policy "topic_follows: unfollow"
  on public.topic_follows for delete using (auth.uid() = user_id);

-- ─── First-contact tracking: objective expands full-weight on first visit ───
create table if not exists public.topic_visits (
  user_id       uuid not null references public.users (id) on delete cascade,
  topic_id      uuid not null references public.topics (id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.topic_visits enable row level security;

drop policy if exists "topic_visits: read own" on public.topic_visits;
create policy "topic_visits: read own"
  on public.topic_visits for select using (auth.uid() = user_id);

drop policy if exists "topic_visits: record own" on public.topic_visits;
create policy "topic_visits: record own"
  on public.topic_visits for insert with check (auth.uid() = user_id);

-- ─── Seed the nine (manifesto verbatim; solution framing is editable) ───────
insert into public.topics (slug, name, manifesto_objective, solution_statement, icon, sort_order)
values
  ('education',    'Education',    'Take education away from the child molesters',              'Learning as exploration, not indoctrination.',                                'graduation-cap', 1),
  ('economics',    'Economics',    'Take economics away from the banksters',                    'An economics of distribution to all, not dominion by an elite.',               'coins',          2),
  ('healing',      'Healing',      'Take healing away from Big Pharma',                         'People-centered healing, not pharmaceutical disease management.',              'heart-pulse',    3),
  ('storytelling', 'Storytelling', 'Take storytelling away from the mass media',                'Storytelling returned to the people, not the mass media.',                     'book-open',      4),
  ('entertainment','Entertainment','Take entertainment away from Hollywood',                    'Entertainment as mystical stimulation, not sensual arousal.',                  'clapperboard',   5),
  ('food',         'Food',         'Take food production away from agribusiness',               'Food grown in Gaia-enhancing gratitude, not destructive profiteering.',        'wheat',          6),
  ('fire',         'Fire',         'Take fire away from the military-industrial complex',        'Energy and power in the hands of communities, not the military-industrial complex.', 'flame',    7),
  ('democracy',    'Democracy',    'Take democracy away from the politicians',                  'Democracy as issue-identified solutions, not party-affiliated blindness.',     'landmark',       8),
  ('spirituality', 'Spirituality', 'Take spirituality away from Mecca and from Rome',           'Spirituality as unity identity, not dogmatic sectarianism.',                   'sparkles',       9)
on conflict (slug) do update
  set name = excluded.name,
      manifesto_objective = excluded.manifesto_objective,
      icon = excluded.icon,
      sort_order = excluded.sort_order;
-- Note: solution_statement is intentionally NOT overwritten on conflict, so hand-edited
-- product copy survives re-runs. Manifesto text is authoritative and always synced.

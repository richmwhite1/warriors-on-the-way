-- Phase Two / Rec 6 — Trusted-member review queue for topic-level content.
-- Topic feed posts (community_id null) have no steward, so flags on them route to a
-- small queue staffed by trusted reviewers (tenure + clean history, granted by a
-- parent admin). Same flag machinery; thresholds still configurable per WS7.

create table if not exists public.topic_reviewers (
  topic_id   uuid not null references public.topics (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  granted_by uuid references public.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);

alter table public.topic_reviewers enable row level security;

-- Reviewers (and parent admins) can see the roster; nobody self-grants.
drop policy if exists "topic_reviewers: read" on public.topic_reviewers;
create policy "topic_reviewers: read"
  on public.topic_reviewers for select
  using (auth.uid() = user_id or public.is_parent_admin());

drop policy if exists "topic_reviewers: manage by parent admin" on public.topic_reviewers;
create policy "topic_reviewers: manage by parent admin"
  on public.topic_reviewers for all
  using (public.is_parent_admin())
  with check (public.is_parent_admin());

create or replace function public.is_topic_reviewer(p_topic_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.topic_reviewers
    where topic_id = p_topic_id and user_id = auth.uid()
  ) or public.is_parent_admin();
$$;

-- Reviewers can hide (reversible) topic-scoped posts they moderate.
drop policy if exists "posts: reviewer can moderate topic posts" on public.posts;
create policy "posts: reviewer can moderate topic posts"
  on public.posts for update
  using (
    community_id is null
    and topic_id is not null
    and public.is_topic_reviewer(topic_id)
  );

-- Let topic reviewers read + resolve reports on topic-scoped content (community_id null),
-- but ONLY for the topic they review — reporter anonymity is preserved for everyone else.
drop policy if exists "reports: read by steward or parent admin" on public.reports;
create policy "reports: read by reviewer/steward/parent admin"
  on public.reports for select
  using (
    public.is_parent_admin()
    or (community_id is not null and public.is_admin(community_id))
    or (
      community_id is null
      and target_type = 'post'
      and exists (
        select 1 from public.posts p
        where p.id = reports.target_id
          and p.topic_id is not null
          and public.is_topic_reviewer(p.topic_id)
      )
    )
  );

drop policy if exists "reports: resolve by steward or parent admin" on public.reports;
create policy "reports: resolve by reviewer/steward/parent admin"
  on public.reports for update
  using (
    public.is_parent_admin()
    or (community_id is not null and public.is_admin(community_id))
    or (
      community_id is null
      and target_type = 'post'
      and exists (
        select 1 from public.posts p
        where p.id = reports.target_id
          and p.topic_id is not null
          and public.is_topic_reviewer(p.topic_id)
      )
    )
  );

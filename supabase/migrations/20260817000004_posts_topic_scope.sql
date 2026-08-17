-- Phase One / WS3 — One posts entity, scoped by visibility (per §8 decision).
-- A single posts table serves both topic Info feeds and community discussions.
-- Cross-posting is a flag on the same row (visibility='both'), never a copy.
-- RLS enforces the access difference: topic-visible rows are world-readable AND
-- postable without community membership; community rows are member-scoped.

-- ─── Scope columns ─────────────────────────────────────────────────────────
do $$ begin
  create type public.post_visibility as enum ('topic', 'community', 'both');
exception when duplicate_object then null; end $$;

-- A topic-only post has no community, so community_id must be nullable.
alter table public.posts alter column community_id drop not null;

alter table public.posts
  add column if not exists topic_id       uuid references public.topics (id) on delete cascade,
  add column if not exists visibility     public.post_visibility not null default 'community',
  add column if not exists link_url       text,
  add column if not exists link_preview   jsonb,   -- {provider, embedUrl, thumbnailUrl, title, description}
  add column if not exists embed_provider text,     -- youtube|rumble|spotify|vimeo|soundcloud|podcast|link|none
  add column if not exists cross_posted_at timestamptz;

-- Every post must land in at least one scope, and visibility must match the scope.
alter table public.posts drop constraint if exists posts_scope_ck;
alter table public.posts add constraint posts_scope_ck check (
  (visibility = 'community' and community_id is not null)
  or (visibility = 'topic' and topic_id is not null)
  or (visibility = 'both' and community_id is not null and topic_id is not null)
);

create index if not exists posts_topic_created_idx
  on public.posts (topic_id, created_at desc)
  where deleted_at is null and topic_id is not null;

-- ─── Recreate posts RLS for the scoped model ───────────────────────────────
drop policy if exists "posts: read if member or parent push" on public.posts;
drop policy if exists "posts: create if member" on public.posts;
drop policy if exists "posts: update own post" on public.posts;
drop policy if exists "posts: soft-delete by admin" on public.posts;

create policy "posts: read (topic public / community members)"
  on public.posts for select
  using (
    deleted_at is null
    and (
      visibility in ('topic', 'both')                         -- topic feed: world-readable
      or (community_id is not null and public.is_member(community_id))
      or (community_id is not null and public.is_admin(community_id))
    )
  );

create policy "posts: create (topic = any member of platform / community = member)"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and (
      -- Topic feed post: first-class action, NO community membership required.
      (topic_id is not null and community_id is null and visibility = 'topic')
      -- Community post, optionally cross-posted to a topic (visibility 'both').
      or (community_id is not null and public.is_member(community_id)
          and visibility in ('community', 'both'))
    )
  );

create policy "posts: update own or by admin"
  on public.posts for update
  using (
    auth.uid() = author_id
    or (community_id is not null and public.is_admin(community_id))
  );

-- ─── Threaded comments ─────────────────────────────────────────────────────
alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at)
  where deleted_at is null;

drop policy if exists "comments: read if member" on public.comments;
drop policy if exists "comments: create if member" on public.comments;

create policy "comments: read (topic public / community members)"
  on public.comments for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and (
          p.visibility in ('topic', 'both')
          or (p.community_id is not null and public.is_member(p.community_id))
        )
    )
  );

create policy "comments: create (topic public / community members)"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and (
          p.visibility in ('topic', 'both')
          or (p.community_id is not null and public.is_member(p.community_id))
        )
    )
  );

-- Reactions currently require community membership (defined in the wall-features
-- migration). Recreate the read/write policies to allow reacting on topic posts too.
drop policy if exists "Members can read reactions" on public.reactions;
drop policy if exists "Members can manage their own reactions" on public.reactions;

create policy "reactions: read (topic public / community members)"
  on public.reactions for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = reactions.post_id
        and (
          p.visibility in ('topic', 'both')
          or (p.community_id is not null and public.is_member(p.community_id))
        )
    )
  );

create policy "reactions: manage own"
  on public.reactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

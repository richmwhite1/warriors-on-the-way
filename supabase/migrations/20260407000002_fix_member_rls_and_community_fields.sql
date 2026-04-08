-- Migration 002: fix community_members RLS + add location/telegram columns
--
-- Problem: users with pending_approval/waitlisted status couldn't read their
-- own community_members row, causing getMembership() to return null and the
-- community page to show "Join" instead of "Request pending".
--
-- Fix: allow users to always read their OWN membership row, regardless of status.

-- Drop and recreate the community_members read policy
drop policy if exists "community_members: read if member" on public.community_members;

create policy "community_members: read own or if active member"
  on public.community_members for select
  using (
    user_id = auth.uid()                        -- always see your own row
    or public.is_member(community_id)           -- active members see all in their community
    or public.is_parent_admin()
  );

-- Add location + Telegram columns to communities if not already present
-- (idempotent via IF NOT EXISTS)
alter table public.communities
  add column if not exists location             text,
  add column if not exists telegram_chat_id     text,
  add column if not exists telegram_invite_link text;

-- Add post_type, title, embed_url, is_pinned to posts if not already present
alter table public.posts
  add column if not exists post_type text not null default 'discussion'
    check (post_type in ('discussion', 'event', 'video', 'music')),
  add column if not exists title     text,
  add column if not exists embed_url text,
  add column if not exists is_pinned boolean not null default false;

-- Reactions table (idempotent)
create table if not exists public.reactions (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  type       text not null check (type in ('like', 'heart', 'fire')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

alter table public.reactions enable row level security;

-- Reactions policies (drop first to be idempotent)
drop policy if exists "Members can read reactions" on public.reactions;
drop policy if exists "Members can manage their own reactions" on public.reactions;

create policy "Members can read reactions"
  on public.reactions for select using (
    exists (
      select 1 from public.community_members cm
      join public.posts p on p.community_id = cm.community_id
      where p.id = reactions.post_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
  );

create policy "Members can manage their own reactions"
  on public.reactions for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

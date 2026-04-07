-- Migration: Community Wall Features
-- Adds post_type, title, embed_url, is_pinned to posts
-- Creates reactions table
-- Adds location, telegram_chat_id, telegram_invite_link to communities

-- Posts: new columns for unified content types + pinning
alter table public.posts
  add column if not exists post_type text not null default 'discussion'
    check (post_type in ('discussion', 'event', 'video', 'music')),
  add column if not exists title     text,
  add column if not exists embed_url text,
  add column if not exists is_pinned boolean not null default false;

-- Communities: location + Telegram integration fields
alter table public.communities
  add column if not exists location              text,
  add column if not exists telegram_chat_id      text,
  add column if not exists telegram_invite_link  text;

-- Reactions table
create table if not exists public.reactions (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  type       text not null check (type in ('like', 'heart', 'fire')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

alter table public.reactions enable row level security;

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

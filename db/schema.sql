-- Warriors on the Way — Canonical DB Schema
-- Phase 0: full initial schema for all phases (forward-compatible)
-- Apply via Supabase SQL editor. Never run DDL in application code.
-- Migrations go in db/migrations/ and are numbered sequentially.

-- ─── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- trigram search for future use

-- ─── Users ─────────────────────────────────────────────────────────────────
-- Mirrors auth.users; extended profile stored here.
create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bio          text,
  avatar_url   text,
  timezone     text not null default 'UTC',
  -- Notification preferences
  notify_telegram  boolean not null default false,
  notify_discord   boolean not null default false,
  notify_email     boolean not null default true,
  -- Cross-community DM opt-in (Phase 6)
  dm_cross_community boolean not null default false,
  -- Soft-delete
  suspended_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Communities ───────────────────────────────────────────────────────────
create table public.communities (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  name        text not null,
  description text,
  banner_url  text,
  -- is_parent flags the north-star account; seeded manually, never user-created
  is_parent   boolean not null default false,
  -- Private communities require join-request approval
  is_private  boolean not null default false,
  -- Members can create events toggle
  members_can_create_events boolean not null default true,
  -- 150-member Dunbar cap (enforced by trigger)
  member_cap  int not null default 150,
  created_by  uuid not null references public.users (id),
  -- Parent push frequency cap (max pushes per day from parent community)
  parent_push_cap_per_day int not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Community Members ─────────────────────────────────────────────────────
create type public.community_role as enum ('member', 'admin', 'organizer');
create type public.member_status as enum ('active', 'waitlisted', 'pending_approval', 'banned');

create table public.community_members (
  id           uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id      uuid not null references public.users (id) on delete cascade,
  role         public.community_role not null default 'member',
  status       public.member_status not null default 'active',
  joined_at    timestamptz not null default now(),
  unique (community_id, user_id)
);

create index on public.community_members (community_id, status);
create index on public.community_members (user_id);

-- ─── 150-member hard cap trigger ───────────────────────────────────────────
create or replace function public.enforce_member_cap()
returns trigger language plpgsql as $$
declare
  active_count int;
  cap int;
begin
  if new.status = 'active' then
    select member_cap into cap
    from public.communities
    where id = new.community_id;

    select count(*) into active_count
    from public.community_members
    where community_id = new.community_id
      and status = 'active';

    if active_count >= cap then
      raise exception 'Community has reached its member cap of % members.', cap;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_member_cap
  before insert or update on public.community_members
  for each row execute function public.enforce_member_cap();

-- ─── Posts ─────────────────────────────────────────────────────────────────
create table public.posts (
  id             uuid primary key default uuid_generate_v4(),
  community_id   uuid not null references public.communities (id) on delete cascade,
  author_id      uuid not null references public.users (id),
  body           text not null,
  -- Optional YouTube URL; oEmbed metadata cached below
  youtube_url    text,
  youtube_oembed jsonb,
  -- Parent-push flag: post from parent shown on all community walls
  push_to_all    boolean not null default false,
  -- Soft-delete (moderation)
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on public.posts (community_id, created_at desc) where deleted_at is null;
create index on public.posts (push_to_all) where push_to_all = true and deleted_at is null;

-- ─── Comments ──────────────────────────────────────────────────────────────
create table public.comments (
  id        uuid primary key default uuid_generate_v4(),
  post_id   uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.users (id),
  body      text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Reports ───────────────────────────────────────────────────────────────
create type public.report_target as enum ('post', 'comment', 'user', 'community');
create type public.report_status as enum ('open', 'reviewed', 'actioned', 'dismissed');

create table public.reports (
  id          uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.users (id),
  target_type public.report_target not null,
  target_id   uuid not null,
  reason      text not null,
  status      public.report_status not null default 'open',
  actioned_by uuid references public.users (id),
  actioned_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ─── Events ────────────────────────────────────────────────────────────────
create type public.event_status as enum ('draft', 'voting', 'confirmed', 'cancelled');

create table public.events (
  id           uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities (id) on delete cascade,
  created_by   uuid not null references public.users (id),
  title        text not null,
  description  text,
  location     text,
  virtual_url  text,
  -- Confirmed single date/time (set once voting resolves or organizer sets directly)
  starts_at    timestamptz,
  ends_at      timestamptz,
  timezone     text not null default 'UTC',
  status       public.event_status not null default 'draft',
  -- Voting threshold % (0–100); event auto-locks when leading option hits this
  vote_threshold int not null default 75
    check (vote_threshold between 0 and 100),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on public.events (community_id, starts_at) where deleted_at is null;

-- ─── Event Date Options (voting) ───────────────────────────────────────────
create table public.event_date_options (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references public.events (id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Event Date Votes ──────────────────────────────────────────────────────
create table public.event_date_votes (
  id         uuid primary key default uuid_generate_v4(),
  option_id  uuid not null references public.event_date_options (id) on delete cascade,
  user_id    uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  unique (option_id, user_id)
);

-- ─── RSVPs ─────────────────────────────────────────────────────────────────
create type public.rsvp_status as enum ('yes', 'no', 'maybe');

create table public.rsvps (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.users (id),
  status     public.rsvp_status not null,
  guests     int not null default 0 check (guests >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index on public.rsvps (event_id, status);

-- ─── Notifications ─────────────────────────────────────────────────────────
create type public.notification_type as enum (
  'event_created',
  'event_updated',
  'event_cancelled',
  'rsvp_reminder',
  'post_created',
  'comment_on_post',
  'member_joined',
  'waitlist_spot_opened',
  'join_request',
  'report_actioned',
  'dm_received'
);

create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users (id) on delete cascade,
  type        public.notification_type not null,
  -- Flexible payload: event_id, post_id, community_id, actor_id, etc.
  payload     jsonb not null default '{}',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index on public.notifications (user_id, created_at desc) where read_at is null;

-- ─── Direct Messages ───────────────────────────────────────────────────────
create table public.direct_messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.users (id),
  recipient_id uuid not null references public.users (id),
  body        text not null,
  read_at     timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index on public.direct_messages (recipient_id, created_at desc) where read_at is null;

-- ─── updated_at auto-trigger ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_communities_updated_at
  before update on public.communities
  for each row execute function public.set_updated_at();

create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger trg_rsvps_updated_at
  before update on public.rsvps
  for each row execute function public.set_updated_at();

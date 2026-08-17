-- Phase One / WS6 — Ask & Offer board (ports ikki's Serve *concept*, not its code).
-- Lifecycle: open → claimed → fulfilled → thank-you. Contact happens through the
-- ask thread and event attendance — never DMs. Fulfilled asks are the platform's
-- reputation currency and are visible on the fulfiller's profile.

-- Add 'ask' as a moderation target now (separate migration/tx from WS7 usage, so
-- the new enum value is committed before it is compared against).
alter type public.report_target add value if not exists 'ask';

do $$ begin
  create type public.ask_kind as enum ('ask', 'offer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ask_status as enum ('open', 'claimed', 'fulfilled');
exception when duplicate_object then null; end $$;

create table if not exists public.asks (
  id             uuid primary key default gen_random_uuid(),
  community_id   uuid not null references public.communities (id) on delete cascade,
  author_id      uuid not null references public.users (id) on delete cascade,
  kind           public.ask_kind not null,
  title          text not null,
  body           text,
  topic_id       uuid references public.topics (id) on delete set null,  -- topic tag
  status         public.ask_status not null default 'open',
  claimed_by     uuid references public.users (id) on delete set null,
  claimed_at     timestamptz,
  fulfilled_at   timestamptz,
  thanked_at     timestamptz,
  thank_you_note text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists asks_community_status_idx on public.asks (community_id, status, created_at desc);
create index if not exists asks_fulfiller_idx on public.asks (claimed_by) where status = 'fulfilled';

create trigger trg_asks_updated_at
  before update on public.asks
  for each row execute function public.set_updated_at();

-- Guard lifecycle transitions and stamp timestamps automatically.
create or replace function public.guard_ask_lifecycle()
returns trigger language plpgsql as $$
begin
  if new.status <> old.status then
    -- allowed: open->claimed, claimed->fulfilled, claimed->open (unclaim)
    if not (
      (old.status = 'open'    and new.status = 'claimed')
      or (old.status = 'claimed' and new.status = 'fulfilled')
      or (old.status = 'claimed' and new.status = 'open')
    ) then
      raise exception 'Invalid ask transition % -> %', old.status, new.status;
    end if;

    if new.status = 'claimed' then
      new.claimed_at := now();
    elsif new.status = 'fulfilled' then
      new.fulfilled_at := now();
    elsif new.status = 'open' then
      new.claimed_by := null;
      new.claimed_at := null;
    end if;
  end if;
  new.author_id := old.author_id;  -- author is immutable
  return new;
end;
$$;

drop trigger if exists trg_guard_ask_lifecycle on public.asks;
create trigger trg_guard_ask_lifecycle
  before update on public.asks
  for each row execute function public.guard_ask_lifecycle();

alter table public.asks enable row level security;

-- Read: community members, OR anyone for a fulfilled ask (reputation is public).
drop policy if exists "asks: read" on public.asks;
create policy "asks: read"
  on public.asks for select
  using (public.is_member(community_id) or status = 'fulfilled');

drop policy if exists "asks: create by member" on public.asks;
create policy "asks: create by member"
  on public.asks for insert
  with check (auth.uid() = author_id and public.is_member(community_id));

-- Update: author, current claimer, or steward can act; a member may claim an OPEN
-- ask. Field-level intent (who may claim vs fulfill vs thank) is enforced in the
-- server actions; the lifecycle trigger guards the state machine.
drop policy if exists "asks: update" on public.asks;
create policy "asks: update"
  on public.asks for update
  using (
    auth.uid() = author_id
    or auth.uid() = claimed_by
    or public.is_admin(community_id)
    or (status = 'open' and public.is_member(community_id))
  );

-- ─── Ask coordination thread (replaces DMs) ────────────────────────────────
create table if not exists public.ask_comments (
  id         uuid primary key default gen_random_uuid(),
  ask_id     uuid not null references public.asks (id) on delete cascade,
  author_id  uuid not null references public.users (id) on delete cascade,
  body       text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ask_comments_ask_idx on public.ask_comments (ask_id, created_at);

alter table public.ask_comments enable row level security;

drop policy if exists "ask_comments: read by member" on public.ask_comments;
create policy "ask_comments: read by member"
  on public.ask_comments for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.asks a
      where a.id = ask_id and public.is_member(a.community_id)
    )
  );

drop policy if exists "ask_comments: create by member" on public.ask_comments;
create policy "ask_comments: create by member"
  on public.ask_comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.asks a
      where a.id = ask_id and public.is_member(a.community_id)
    )
  );

-- Phase Two / depth behind the menu.
--
-- The six-need front door works, but everything behind it was read-only browsing:
-- an offering could be created and never corrected, a person could want something and
-- leave no trace, and a doorway with nothing behind it was a dead end. This migration
-- adds the four missing loops:
--
--   1. offering_interest  — "I'm coming", the commitment signal offerings never had
--   2. need_signups       — "tell me when this opens", so an empty doorway isn't a bounce
--   3. user_needs         — what a *person* needs, so the menu can eventually know them
--   4. format             — in-person / online / hybrid, so a doorway can be filtered
--
-- Offering lifecycle (pause/end/delete) needs no schema: 20260817000015 already shipped
-- `status` and `deleted_at`. Nothing in the app could set them; that's app code, not SQL.

-- ─── 1. Interest in a standing offering ────────────────────────────────────
-- Events have RSVP; offerings — the recurring majority of the menu — had nothing.
-- Deliberately lighter than an RSVP: an offering recurs, so "I'm coming" means "count
-- me in generally", not a per-session commitment we'd have to expire and re-ask.
create table if not exists public.offering_interest (
  offering_id uuid not null references public.offerings (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (offering_id, user_id)
);

create index if not exists offering_interest_user_idx on public.offering_interest (user_id);

alter table public.offering_interest enable row level security;

-- Who is coming to a grief group is not public information. You can see your own row;
-- a member of the hosting community can see the roster. Everyone else gets the count
-- only, via the denormalised column below — never the names.
drop policy if exists "offering_interest: read own or as member" on public.offering_interest;
create policy "offering_interest: read own or as member"
  on public.offering_interest for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.offerings o
      where o.id = offering_id and public.is_member(o.community_id)
    )
  );

drop policy if exists "offering_interest: add self" on public.offering_interest;
create policy "offering_interest: add self"
  on public.offering_interest for insert
  with check (user_id = auth.uid());

drop policy if exists "offering_interest: remove self" on public.offering_interest;
create policy "offering_interest: remove self"
  on public.offering_interest for delete
  using (user_id = auth.uid());

-- Public headcount without exposing the roster. A signed-out visitor deciding whether
-- to walk into a room full of strangers is helped by "9 coming" and harmed by nothing.
alter table public.offerings
  add column if not exists interest_count int not null default 0;

create or replace function public.sync_offering_interest_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.offerings
      set interest_count = interest_count + 1
      where id = new.offering_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.offerings
      set interest_count = greatest(interest_count - 1, 0)
      where id = old.offering_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_offering_interest_count on public.offering_interest;
create trigger trg_offering_interest_count
  after insert or delete on public.offering_interest
  for each row execute function public.sync_offering_interest_count();

-- ─── 2. Signups on an empty doorway ────────────────────────────────────────
-- The highest-intent moment in the app is someone opening a doorway with nothing
-- behind it — they have just told us exactly what they need. Asking them to found a
-- circle is the right ambition and the wrong only-option. This records the quieter
-- answer so the eleventh person to ask for a grief circle can be told about the tenth.
--
-- Works signed-out on purpose: the sign-in wall is what keeps people who need this
-- from ever reaching it.
create table if not exists public.need_signups (
  id         uuid primary key default gen_random_uuid(),
  need_id    uuid not null references public.needs (id) on delete cascade,
  user_id    uuid references public.users (id) on delete cascade,
  email      text,
  area       text,                    -- free-text "Park City" — no geo model yet
  created_at timestamptz not null default now(),
  -- Either a signed-in person or an email we can actually reach. Never neither.
  constraint need_signups_reachable check (user_id is not null or email is not null)
);

create index if not exists need_signups_need_idx on public.need_signups (need_id);

-- One signup per person per doorway, whichever way they identified themselves.
create unique index if not exists need_signups_user_uniq
  on public.need_signups (need_id, user_id) where user_id is not null;
create unique index if not exists need_signups_email_uniq
  on public.need_signups (need_id, lower(email)) where email is not null;

alter table public.need_signups enable row level security;

-- Anyone may raise their hand, including a guest. A guest may only leave an email
-- (not attach the row to somebody else's account).
drop policy if exists "need_signups: anyone may sign up" on public.need_signups;
create policy "need_signups: anyone may sign up"
  on public.need_signups for insert
  with check (user_id = auth.uid() or (user_id is null and email is not null));

-- A waiting list of people in crisis is not browsable. Own rows only; the organiser
-- view reads through the service role.
drop policy if exists "need_signups: read own" on public.need_signups;
create policy "need_signups: read own"
  on public.need_signups for select
  using (user_id is not null and user_id = auth.uid());

drop policy if exists "need_signups: withdraw own" on public.need_signups;
create policy "need_signups: withdraw own"
  on public.need_signups for delete
  using (user_id is not null and user_id = auth.uid());

-- ─── 3. What a person needs ────────────────────────────────────────────────
-- The needs taxonomy tagged events, offerings, circles and practitioners — everything
-- except the person doing the looking. Without this the menu is identical for everyone
-- and nothing can be told to the people who'd want to hear it.
--
-- Strictly private: "I need support" is a disclosure, not a profile field. Only you
-- can read your own rows.
create table if not exists public.user_needs (
  user_id    uuid not null references public.users (id) on delete cascade,
  need_id    uuid not null references public.needs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, need_id)
);

alter table public.user_needs enable row level security;

drop policy if exists "user_needs: read own" on public.user_needs;
create policy "user_needs: read own"
  on public.user_needs for select using (user_id = auth.uid());

drop policy if exists "user_needs: manage own" on public.user_needs;
create policy "user_needs: manage own"
  on public.user_needs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── 4. In person, online, or both ─────────────────────────────────────────
-- A doorway with thirty circles behind it is unusable without filters, and the first
-- filter anyone reaches for is "can I actually get there". Nothing in the schema could
-- answer that: `location` is free text and an online circle looked identical to one
-- meeting across the valley.
do $$ begin
  create type public.gathering_format as enum ('in_person', 'online', 'hybrid');
exception when duplicate_object then null; end $$;

-- Defaulting to in_person is the honest backfill: every row that exists today was
-- written by someone describing a physical place.
alter table public.offerings
  add column if not exists format public.gathering_format not null default 'in_person';
alter table public.events
  add column if not exists format public.gathering_format not null default 'in_person';
alter table public.communities
  add column if not exists format public.gathering_format not null default 'in_person';

create index if not exists offerings_format_idx on public.offerings (format) where deleted_at is null;

-- ─── Re-grant the communities column whitelist ─────────────────────────────
-- public.communities does not carry a table-level SELECT grant: 20260610000001
-- revoked it and re-granted an explicit column list, and 20260817000013 had to
-- re-run that block because `status` was added afterwards and never granted —
-- which made browse silently return zero rows for everyone.
--
-- We just added `format` to that table, so the same trap is armed again. Re-run the
-- whitelist against the current column set. Any future migration that adds a column
-- to public.communities must do this too.
REVOKE SELECT ON public.communities FROM anon, authenticated;

DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'communities'
    -- Keep the two secrets hidden from the API roles (read via service role only).
    AND column_name NOT IN ('invite_token', 'telegram_chat_id');

  EXECUTE format('GRANT SELECT (%s) ON public.communities TO anon, authenticated', cols);
END $$;

-- Column grants and new tables only reach the API after PostgREST reloads.
NOTIFY pgrst, 'reload schema';

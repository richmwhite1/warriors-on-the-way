-- Phase Two / Rec 5 + 9 — Inactivity sweep + the record the rejoin flow reads.
-- Six months of inactivity frees a member's seat (never a ban). Warn at five months
-- with a one-tap "still here". Activity is weighted: last_meaningful_action_at is
-- only touched by meaningful actions (RSVP/attend, post, comment, ask) — never likes.
-- Creators and stewards are never auto-removed (communities would orphan).

alter table public.community_members
  add column if not exists warned_at timestamptz;   -- 5-month "still here?" warning sent

-- Audit of seats freed by inactivity, so a returning member can be told kindly and
-- offered one-tap rejoin.
create table if not exists public.inactivity_removals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  removed_at   timestamptz not null default now(),
  acknowledged_at timestamptz,                        -- set when the user has seen the notice
  unique (user_id, community_id)
);

create index if not exists inactivity_removals_user_idx
  on public.inactivity_removals (user_id) where acknowledged_at is null;

alter table public.inactivity_removals enable row level security;

drop policy if exists "inactivity_removals: read own" on public.inactivity_removals;
create policy "inactivity_removals: read own"
  on public.inactivity_removals for select using (auth.uid() = user_id);

drop policy if exists "inactivity_removals: ack own" on public.inactivity_removals;
create policy "inactivity_removals: ack own"
  on public.inactivity_removals for update using (auth.uid() = user_id);

-- Is this member protected from auto-removal (creator or steward)?
create or replace function public.is_protected_member(p_community_id uuid, p_user_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community_id and c.created_by = p_user_id
  ) or exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = p_user_id
      and m.role in ('admin', 'organizer')
  );
$$;

-- Warn members inactive ~5 months. Returns count warned. Notifications are created
-- here; the app's "still here" tap bumps last_meaningful_action_at and clears warned_at.
create or replace function public.sweep_inactivity_warnings()
returns int language plpgsql security definer as $$
declare warned int := 0;
begin
  with due as (
    select m.id, m.user_id, m.community_id
    from public.community_members m
    where m.status = 'active'
      and m.warned_at is null
      and m.last_meaningful_action_at < now() - interval '5 months'
      and m.last_meaningful_action_at >= now() - interval '6 months'
      and not public.is_protected_member(m.community_id, m.user_id)
  ), upd as (
    update public.community_members m set warned_at = now()
    from due where m.id = due.id
    returning due.user_id, due.community_id
  )
  insert into public.notifications (user_id, type, payload)
  select user_id, 'waitlist_spot_opened',
         jsonb_build_object('kind', 'inactivity_warning', 'community_id', community_id)
  from upd;
  get diagnostics warned = row_count;
  return warned;
end;
$$;

-- Remove members inactive 6+ months (frees the seat). Records the removal.
create or replace function public.sweep_inactivity_removals()
returns int language plpgsql security definer as $$
declare removed int := 0;
begin
  with due as (
    select m.id, m.user_id, m.community_id
    from public.community_members m
    where m.status = 'active'
      and m.last_meaningful_action_at < now() - interval '6 months'
      and not public.is_protected_member(m.community_id, m.user_id)
  ), rec as (
    insert into public.inactivity_removals (user_id, community_id)
    select user_id, community_id from due
    on conflict (user_id, community_id)
      do update set removed_at = now(), acknowledged_at = null
    returning user_id, community_id
  )
  delete from public.community_members m
  using due where m.id = due.id;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- Phase One / WS5 — Event address gating.
-- General location is visible to all members; the exact address is revealed only
-- after RSVP. Postgres RLS is row-level, not column-level, so we revoke direct
-- read access to exact_address and expose it solely through a security-definer RPC
-- that verifies the caller has RSVP'd (or is the creator/steward).

alter table public.events
  add column if not exists general_location text,
  add column if not exists exact_address    text;

-- Backfill: treat the existing free-text location as the general location.
update public.events
  set general_location = coalesce(general_location, location)
  where general_location is null;

-- Lock down direct reads of the exact address (defense-in-depth: even a raw
-- member query cannot select it). All app reads go through the RPC below.
revoke select (exact_address) on public.events from authenticated;
revoke select (exact_address) on public.events from anon;

create or replace function public.event_exact_address(p_event_id uuid)
returns text
language plpgsql
security definer
stable
as $$
declare
  addr text;
  community uuid;
  creator uuid;
begin
  select e.exact_address, e.community_id, e.created_by
    into addr, community, creator
  from public.events e
  where e.id = p_event_id;

  if addr is null then
    return null;
  end if;

  -- Creator or steward always sees it.
  if auth.uid() = creator or public.is_admin(community) then
    return addr;
  end if;

  -- Members who have RSVP'd yes/maybe see it.
  if public.is_member(community) and exists (
    select 1 from public.rsvps r
    where r.event_id = p_event_id
      and r.user_id = auth.uid()
      and r.status in ('yes', 'maybe')
  ) then
    return addr;
  end if;

  return null;  -- not yet revealed
end;
$$;

grant execute on function public.event_exact_address(uuid) to authenticated;

-- Allow member_cap to be NULL, meaning unlimited (used for the parent community)
alter table public.communities
  alter column member_cap drop not null;

-- Update the trigger to skip cap enforcement for parent communities and when cap is NULL
create or replace function public.enforce_member_cap()
returns trigger language plpgsql as $$
declare
  active_count int;
  cap int;
  is_par boolean;
begin
  if new.status = 'active' then
    select member_cap, is_parent into cap, is_par
    from public.communities
    where id = new.community_id;

    -- Parent community and communities with no cap are unlimited
    if is_par or cap is null then
      return new;
    end if;

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

-- Set cap to NULL for the parent community
update public.communities
  set member_cap = null
  where is_parent = true;

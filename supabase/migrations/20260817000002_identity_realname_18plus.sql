-- Phase One / WS1 — Real-name + 18+ identity.
-- Constraints: real names (first name + last initial minimum) with a photo;
-- 18+ only, stated plainly at signup. No anonymous accounts.

alter table public.users
  add column if not exists first_name    text,
  add column if not exists last_initial  text,
  add column if not exists birthdate     date,
  add column if not exists adult_confirmed_at timestamptz;

-- last_initial is a single letter when present.
alter table public.users
  drop constraint if exists users_last_initial_len;
alter table public.users
  add constraint users_last_initial_len
  check (last_initial is null or char_length(last_initial) = 1);

-- Enforce 18+ whenever a birthdate is set. Kept as a trigger (not a CHECK) because
-- age is time-relative; we validate at write time.
create or replace function public.enforce_adult()
returns trigger language plpgsql as $$
begin
  if new.birthdate is not null
     and new.birthdate > (current_date - interval '18 years') then
    raise exception 'You must be 18 or older to use this platform.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_adult on public.users;
create trigger trg_enforce_adult
  before insert or update of birthdate on public.users
  for each row execute function public.enforce_adult();

-- Keep display_name synced to "First L." when the structured name is provided,
-- so existing display_name-based reads keep working during the transition.
create or replace function public.sync_display_name()
returns trigger language plpgsql as $$
begin
  if new.first_name is not null and new.first_name <> '' then
    new.display_name :=
      new.first_name ||
      case when new.last_initial is not null and new.last_initial <> ''
           then ' ' || upper(new.last_initial) || '.'
           else '' end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_display_name on public.users;
create trigger trg_sync_display_name
  before insert or update of first_name, last_initial on public.users
  for each row execute function public.sync_display_name();

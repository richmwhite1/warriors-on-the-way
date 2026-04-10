-- Invite token on communities (private community share link)
alter table public.communities
  add column if not exists invite_token uuid;

-- Push subscriptions for web push notifications
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  endpoint     text not null,
  p256dh       text not null,
  auth         text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: manage own"
  on public.push_subscriptions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RSVP list query needs attendee profiles — already covered by existing rsvps + users join
-- No schema change needed for that feature.

-- Allow anyone (authenticated) to read the invite_token indirectly via the join flow.
-- The token itself is never exposed via a SELECT policy; it's checked server-side only.

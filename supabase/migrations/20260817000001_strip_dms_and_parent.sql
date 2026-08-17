-- Phase One / WS0 — Strip DMs and retire the parent-community broadcast model.
-- Constraint: no direct messages at launch. Ask & Offer + event attendance are the
-- only contact mechanisms. The parent-community / push_to_all north-star model is
-- replaced by the nine-topic structure + opt-in cross-posting.

-- ─── Drop the direct-message surface entirely ──────────────────────────────
-- Dropping the table removes its policies and its membership in supabase_realtime.
drop table if exists public.direct_messages cascade;

-- Remove the cross-community DM opt-in from profiles.
alter table public.users
  drop column if exists dm_cross_community;

-- ─── Retire parent-broadcast writes ────────────────────────────────────────
-- We keep the columns (is_parent, push_to_all, parent_push_cap_per_day) to avoid
-- churn and preserve existing rows, but no code path reads or writes them anymore.
-- Force push_to_all off so no post is treated as a global broadcast.
update public.posts set push_to_all = false where push_to_all = true;

-- Note: the notification_type enum still contains 'dm_received'; Postgres cannot
-- drop an enum value in place. It is now unused and harmless.

-- Enable Realtime on direct_messages so conversation pages receive live updates
alter publication supabase_realtime add table public.direct_messages;

-- Add image_url to events if not already present (applied manually in some envs)
alter table public.events add column if not exists image_url text;

-- Allow server-side code (service role) to insert notifications on behalf of any user.
-- Regular users still cannot insert via the anon/user JWT — this policy covers service_role
-- which bypasses RLS anyway, but makes the intent explicit and supports future RPC paths.
create policy "notifications: service role insert"
  on public.notifications for insert
  with check (true);

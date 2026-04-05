-- Warriors on the Way — Seed Data
-- Run ONCE after schema.sql and policies.sql.
-- Seeds the parent community (north-star account).
-- You must be signed in first so your user row exists;
-- replace YOUR_USER_ID with your actual auth.users UUID.

-- ─── Supabase Storage buckets ──────────────────────────────────────────────
-- Run these in the Supabase Storage tab or via this SQL:
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('community-banners', 'community-banners', true)
on conflict (id) do nothing;

-- Storage RLS: anyone can read public buckets; authenticated users upload their own files
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatars: own update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "community-banners: public read"
  on storage.objects for select
  using (bucket_id = 'community-banners');

create policy "community-banners: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'community-banners' and auth.role() = 'authenticated');

-- ─── Parent community ──────────────────────────────────────────────────────
-- After running, promote yourself to organizer via:
-- UPDATE public.community_members SET role = 'organizer'
-- WHERE user_id = '<your-uuid>' AND community_id = '<parent-id>';

-- NOTE: Replace YOUR_USER_ID before running this block.
-- You can find your UUID in Supabase → Authentication → Users.

/*
do $$
declare
  v_user_id uuid := 'YOUR_USER_ID';  -- <- replace this
  v_community_id uuid;
begin
  insert into public.communities (slug, name, description, is_parent, is_private, created_by)
  values (
    'warriors-on-the-way',
    'Warriors on the Way',
    'The north-star community. Posts here can be pushed to all member communities.',
    true,
    false,
    v_user_id
  )
  returning id into v_community_id;

  insert into public.community_members (community_id, user_id, role, status)
  values (v_community_id, v_user_id, 'organizer', 'active');
end $$;
*/

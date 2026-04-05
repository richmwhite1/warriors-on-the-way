-- Warriors on the Way — Row-Level Security Policies
-- Review this file every PR. This is the security perimeter.
-- Apply AFTER schema.sql. Run in Supabase SQL editor.

-- ─── Enable RLS on all tables ──────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.events enable row level security;
alter table public.event_date_options enable row level security;
alter table public.event_date_votes enable row level security;
alter table public.rsvps enable row level security;
alter table public.notifications enable row level security;
alter table public.direct_messages enable row level security;

-- ─── Helper: is the current user an active member of a community? ──────────
create or replace function public.is_member(p_community_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

-- ─── Helper: is the current user an admin/organizer of a community? ────────
create or replace function public.is_admin(p_community_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('admin', 'organizer')
  );
$$;

-- ─── Helper: is the current user the parent account? ──────────────────────
-- Parent account = member of the seeded parent community as organizer.
create or replace function public.is_parent_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1
    from public.community_members cm
    join public.communities c on c.id = cm.community_id
    where c.is_parent = true
      and cm.user_id = auth.uid()
      and cm.role = 'organizer'
      and cm.status = 'active'
  );
$$;

-- ─── users ─────────────────────────────────────────────────────────────────
-- Anyone authenticated can read basic profiles.
create policy "users: read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users: read public profiles"
  on public.users for select
  using (true); -- profiles are public; sensitive fields handled in app layer

create policy "users: update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "users: insert own profile on signup"
  on public.users for insert
  with check (auth.uid() = id);

-- ─── communities ───────────────────────────────────────────────────────────
-- Public communities are visible to all authenticated users.
-- Private communities are visible only to members.
create policy "communities: read public"
  on public.communities for select
  using (
    not is_private
    or public.is_member(id)
    or public.is_parent_admin()
  );

create policy "communities: create"
  on public.communities for insert
  with check (auth.uid() = created_by);

create policy "communities: update by admin"
  on public.communities for update
  using (public.is_admin(id) or public.is_parent_admin());

-- Only parent admin can delete communities.
create policy "communities: delete by parent admin"
  on public.communities for delete
  using (public.is_parent_admin());

-- ─── community_members ──────────────────────────────────────────────────────
create policy "community_members: read if member"
  on public.community_members for select
  using (public.is_member(community_id) or public.is_parent_admin());

create policy "community_members: join"
  on public.community_members for insert
  with check (auth.uid() = user_id);

create policy "community_members: admin can update roles/status"
  on public.community_members for update
  using (public.is_admin(community_id) or public.is_parent_admin());

create policy "community_members: leave own membership"
  on public.community_members for delete
  using (auth.uid() = user_id or public.is_admin(community_id) or public.is_parent_admin());

-- ─── posts ─────────────────────────────────────────────────────────────────
-- Members of a community can see its posts.
-- Parent push_to_all posts are visible to all authenticated users.
create policy "posts: read if member or parent push"
  on public.posts for select
  using (
    deleted_at is null
    and (
      public.is_member(community_id)
      or (push_to_all = true)
      or public.is_parent_admin()
    )
  );

create policy "posts: create if member"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and public.is_member(community_id)
    -- push_to_all only allowed for parent admin
    and (push_to_all = false or public.is_parent_admin())
  );

create policy "posts: update own post"
  on public.posts for update
  using (auth.uid() = author_id or public.is_admin(community_id) or public.is_parent_admin());

create policy "posts: soft-delete by admin"
  on public.posts for update
  using (public.is_admin(community_id) or public.is_parent_admin());

-- ─── comments ───────────────────────────────────────────────────────────────
create policy "comments: read if member"
  on public.comments for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and (public.is_member(p.community_id) or p.push_to_all = true)
    )
  );

create policy "comments: create if member"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and public.is_member(p.community_id)
    )
  );

create policy "comments: delete own or admin"
  on public.comments for update
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.posts p
      where p.id = post_id
        and public.is_admin(p.community_id)
    )
    or public.is_parent_admin()
  );

-- ─── reports ────────────────────────────────────────────────────────────────
create policy "reports: create (any authenticated user)"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports: read by parent admin"
  on public.reports for select
  using (public.is_parent_admin());

create policy "reports: update by parent admin"
  on public.reports for update
  using (public.is_parent_admin());

-- ─── events ─────────────────────────────────────────────────────────────────
create policy "events: read if member"
  on public.events for select
  using (
    deleted_at is null
    and (public.is_member(community_id) or public.is_parent_admin())
  );

create policy "events: create if member (and community allows it)"
  on public.events for insert
  with check (
    auth.uid() = created_by
    and (
      public.is_admin(community_id)
      or (
        public.is_member(community_id)
        and (select members_can_create_events from public.communities where id = community_id)
      )
    )
  );

create policy "events: update by creator or admin"
  on public.events for update
  using (
    auth.uid() = created_by
    or public.is_admin(community_id)
    or public.is_parent_admin()
  );

-- ─── event_date_options ─────────────────────────────────────────────────────
create policy "event_date_options: read if member"
  on public.event_date_options for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_member(e.community_id)
    )
  );

create policy "event_date_options: create by event creator or admin"
  on public.event_date_options for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (auth.uid() = e.created_by or public.is_admin(e.community_id))
    )
  );

-- ─── event_date_votes ───────────────────────────────────────────────────────
create policy "event_date_votes: read if member"
  on public.event_date_votes for select
  using (
    exists (
      select 1
      from public.event_date_options o
      join public.events e on e.id = o.event_id
      where o.id = option_id
        and public.is_member(e.community_id)
    )
  );

create policy "event_date_votes: vote if member"
  on public.event_date_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.event_date_options o
      join public.events e on e.id = o.event_id
      where o.id = option_id
        and public.is_member(e.community_id)
        and e.status = 'voting'
    )
  );

create policy "event_date_votes: delete own vote"
  on public.event_date_votes for delete
  using (auth.uid() = user_id);

-- ─── rsvps ──────────────────────────────────────────────────────────────────
create policy "rsvps: read if member"
  on public.rsvps for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_member(e.community_id)
    )
  );

create policy "rsvps: upsert own rsvp"
  on public.rsvps for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_member(e.community_id)
        and e.status = 'confirmed'
    )
  );

create policy "rsvps: update own rsvp"
  on public.rsvps for update
  using (auth.uid() = user_id);

-- ─── notifications ──────────────────────────────────────────────────────────
create policy "notifications: read own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: mark read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Notifications are inserted by server-side actions (service role), not by users directly.

-- ─── direct_messages ────────────────────────────────────────────────────────
create policy "direct_messages: read own"
  on public.direct_messages for select
  using (
    deleted_at is null
    and (auth.uid() = sender_id or auth.uid() = recipient_id)
  );

create policy "direct_messages: send"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id
    -- Same-community check or cross-community opt-in enforced in server action
    -- (complex multi-table join not efficient in RLS; RLS is the backstop)
  );

create policy "direct_messages: soft-delete own"
  on public.direct_messages for update
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

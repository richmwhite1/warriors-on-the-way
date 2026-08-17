-- Phase One / WS7 — Flag-based moderation with a configurable threshold dial.
-- Invariants (constraints): flags are anonymous to the accused; the accused sees
-- what was removed and why; a lone steward can HIDE (reversible) but not permanently
-- delete. Auto-hide fires when distinct flags reach the community's flag_threshold.

-- Reversible soft-hide, distinct from the permanent deleted_at.
alter table public.posts
  add column if not exists hidden_at     timestamptz,
  add column if not exists hidden_reason text;
alter table public.comments
  add column if not exists hidden_at     timestamptz,
  add column if not exists hidden_reason text;
alter table public.asks
  add column if not exists hidden_at     timestamptz,
  add column if not exists hidden_reason text;

-- Scope reports to a community so stewards get a local queue; add a resolution note.
alter table public.reports
  add column if not exists community_id    uuid references public.communities (id) on delete cascade,
  add column if not exists resolution_note text;

-- Prevent duplicate flags from the same reporter on the same target (distinct count).
create unique index if not exists reports_unique_reporter_target
  on public.reports (reporter_id, target_type, target_id);

-- Stewards can read/resolve reports for their own community; parent admins see all.
drop policy if exists "reports: read by parent admin" on public.reports;
create policy "reports: read by steward or parent admin"
  on public.reports for select
  using (
    public.is_parent_admin()
    or (community_id is not null and public.is_admin(community_id))
  );

drop policy if exists "reports: update by parent admin" on public.reports;
create policy "reports: resolve by steward or parent admin"
  on public.reports for update
  using (
    public.is_parent_admin()
    or (community_id is not null and public.is_admin(community_id))
  );

-- ─── Hide content once distinct flags reach the threshold ──────────────────
create or replace function public.apply_flag_threshold()
returns trigger language plpgsql security definer as $$
declare
  distinct_flags int;
  threshold int := 3;              -- default for topic/global content
  target_community uuid;
begin
  -- Resolve the owning community (for the configurable per-community threshold).
  if new.target_type = 'post' then
    select community_id into target_community from public.posts where id = new.target_id;
  elsif new.target_type = 'comment' then
    select p.community_id into target_community
      from public.comments c join public.posts p on p.id = c.post_id
      where c.id = new.target_id;
  elsif new.target_type = 'ask' then
    select community_id into target_community from public.asks where id = new.target_id;
  end if;

  if target_community is not null then
    select flag_threshold into threshold from public.communities where id = target_community;
  end if;

  select count(distinct reporter_id) into distinct_flags
    from public.reports
    where target_type = new.target_type and target_id = new.target_id;

  if distinct_flags >= threshold then
    if new.target_type = 'post' then
      update public.posts
        set hidden_at = coalesce(hidden_at, now()),
            hidden_reason = coalesce(hidden_reason, 'Hidden after community flags')
        where id = new.target_id;
    elsif new.target_type = 'comment' then
      update public.comments
        set hidden_at = coalesce(hidden_at, now()),
            hidden_reason = coalesce(hidden_reason, 'Hidden after community flags')
        where id = new.target_id;
    elsif new.target_type = 'ask' then
      update public.asks
        set hidden_at = coalesce(hidden_at, now()),
            hidden_reason = coalesce(hidden_reason, 'Hidden after community flags')
        where id = new.target_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_flag_threshold on public.reports;
create trigger trg_apply_flag_threshold
  after insert on public.reports
  for each row execute function public.apply_flag_threshold();

-- Fold hidden_at into content visibility (recreate the read policies from WS3 to
-- also exclude hidden rows). The accused still sees their own hidden content plus
-- the reason (author_id / claimed_by paths remain readable to the owner).
drop policy if exists "posts: read (topic public / community members)" on public.posts;
create policy "posts: read (topic public / community members)"
  on public.posts for select
  using (
    deleted_at is null
    and (
      auth.uid() = author_id                                   -- owner sees own (even if hidden) + reason
      or (
        hidden_at is null
        and (
          visibility in ('topic', 'both')
          or (community_id is not null and public.is_member(community_id))
          or (community_id is not null and public.is_admin(community_id))
        )
      )
    )
  );

drop policy if exists "comments: read (topic public / community members)" on public.comments;
create policy "comments: read (topic public / community members)"
  on public.comments for select
  using (
    deleted_at is null
    and (
      auth.uid() = author_id
      or (
        hidden_at is null
        and exists (
          select 1 from public.posts p
          where p.id = post_id
            and (
              p.visibility in ('topic', 'both')
              or (p.community_id is not null and public.is_member(p.community_id))
            )
        )
      )
    )
  );

drop policy if exists "asks: read" on public.asks;
create policy "asks: read"
  on public.asks for select
  using (
    auth.uid() = author_id
    or (hidden_at is null and (public.is_member(community_id) or status = 'fulfilled'))
  );

-- Migration: Fix guest event access
--
-- 1. Reset allow_guest_rsvp to TRUE for all existing communities.
--    The intent was always to default to TRUE. Any FALSE value was set accidentally.
--
-- 2. Add explicit public-read RLS policies to communities, events, and related
--    tables so that unauthenticated (anon) users can view events shared via link.

-- ── Reset allow_guest_rsvp ────────────────────────────────────────────────────
UPDATE public.communities
SET allow_guest_rsvp = TRUE;

-- ── Communities: public read ──────────────────────────────────────────────────
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communities: public read" ON public.communities;
CREATE POLICY "communities: public read"
  ON public.communities FOR SELECT
  USING (true);

-- Authenticated users can insert/update communities they own or admin
DROP POLICY IF EXISTS "communities: authenticated write" ON public.communities;
CREATE POLICY "communities: authenticated write"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "communities: admin update" ON public.communities;
CREATE POLICY "communities: admin update"
  ON public.communities FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = created_by
      OR EXISTS (
        SELECT 1 FROM public.community_members cm
        WHERE cm.community_id = communities.id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('admin', 'organizer')
          AND cm.status = 'active'
      )
    )
  );

-- ── Events: public read ───────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events: public read" ON public.events;
CREATE POLICY "events: public read"
  ON public.events FOR SELECT
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "events: member write" ON public.events;
CREATE POLICY "events: member write"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = events.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "events: creator or admin update" ON public.events;
CREATE POLICY "events: creator or admin update"
  ON public.events FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = created_by
      OR EXISTS (
        SELECT 1 FROM public.community_members cm
        WHERE cm.community_id = events.community_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('admin', 'organizer')
          AND cm.status = 'active'
      )
    )
  );

-- ── Event date options: public read ──────────────────────────────────────────
ALTER TABLE public.event_date_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_date_options: public read" ON public.event_date_options;
CREATE POLICY "event_date_options: public read"
  ON public.event_date_options FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "event_date_options: member write" ON public.event_date_options;
CREATE POLICY "event_date_options: member write"
  ON public.event_date_options FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── RSVPs: member read ────────────────────────────────────────────────────────
-- RSVPs remain member-only (guests use guest_rsvps table instead)
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsvps: member read" ON public.rsvps;
CREATE POLICY "rsvps: member read"
  ON public.rsvps FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = rsvps.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "rsvps: own write" ON public.rsvps;
CREATE POLICY "rsvps: own write"
  ON public.rsvps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

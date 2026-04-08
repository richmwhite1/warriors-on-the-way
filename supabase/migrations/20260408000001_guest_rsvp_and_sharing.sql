-- Migration: Guest RSVP + sharing settings
-- Adds allow_guest_rsvp to communities (default true — open & shareable by default)
-- Creates guest_rsvps table for unauthenticated event attendance

-- Community setting
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS allow_guest_rsvp BOOLEAN NOT NULL DEFAULT TRUE;

-- Guest RSVPs table
CREATE TABLE IF NOT EXISTS public.guest_rsvps (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  email      TEXT,
  status     TEXT        NOT NULL CHECK (status IN ('yes', 'maybe', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.guest_rsvps ENABLE ROW LEVEL SECURITY;

-- Organizers / active members can read guest RSVPs for their events
CREATE POLICY "guest_rsvps: members can read"
  ON public.guest_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.events e
      JOIN   public.community_members cm ON cm.community_id = e.community_id
      WHERE  e.id = guest_rsvps.event_id
        AND  cm.user_id = auth.uid()
        AND  cm.status  = 'active'
    )
  );

-- Inserts are handled server-side via the service-role client, so no anon policy needed.
-- If you later want direct client-side submission, add:
-- CREATE POLICY "guest_rsvps: anyone can insert" ON public.guest_rsvps FOR INSERT WITH CHECK (true);

-- Add per-community Telegram push type preferences
-- Default: all four post types are pushed
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS telegram_push_types text[]
  DEFAULT ARRAY['discussion', 'video', 'music', 'event'];

-- Allow anyone (including anon guests) to INSERT into guest_rsvps
-- The submitGuestRsvp server action uses the admin client, but add this
-- as defense-in-depth so direct API calls also work
DROP POLICY IF EXISTS "guest_rsvps: public insert" ON public.guest_rsvps;
CREATE POLICY "guest_rsvps: public insert"
  ON public.guest_rsvps FOR INSERT
  WITH CHECK (true);

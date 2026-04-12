-- Add payment tracking and check-in to rsvps
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'waived')),
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

-- Allow admins/organizers to update payment_status and check-in fields on any rsvp for their events
CREATE POLICY "rsvps: admin update"
  ON public.rsvps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.community_members cm ON cm.community_id = e.community_id
      WHERE e.id = rsvps.event_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('admin', 'organizer')
    )
  );

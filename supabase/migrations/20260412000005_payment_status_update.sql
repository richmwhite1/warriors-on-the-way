-- Update payment_status values on rsvps to support the cleaner two-step flow:
--   unpaid   → attendee hasn't self-reported yet (shown as "Pending")
--   sent     → attendee clicked "I've paid" at the RSVP gate (shown as "Sent")
--   confirmed→ organizer has verified receipt (shown as "Confirmed")
--   waived   → organizer waived the fee (shown as "Waived")
--
-- Previously 'paid' was used for organizer-confirmed; migrate those to 'confirmed'.

ALTER TABLE public.rsvps
  DROP CONSTRAINT IF EXISTS rsvps_payment_status_check;

UPDATE public.rsvps SET payment_status = 'confirmed' WHERE payment_status = 'paid';

ALTER TABLE public.rsvps
  ADD CONSTRAINT rsvps_payment_status_check
    CHECK (payment_status IN ('unpaid', 'sent', 'confirmed', 'waived'));

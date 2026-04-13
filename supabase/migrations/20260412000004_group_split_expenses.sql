-- Add is_group_split flag to event_expenses so the system can auto-rebalance
-- when new attendees RSVP yes (as long as no splits have been paid yet).
ALTER TABLE public.event_expenses
  ADD COLUMN IF NOT EXISTS is_group_split boolean NOT NULL DEFAULT false;

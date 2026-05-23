-- Migration: Add phone numbers and SMS reminder idempotency tracking
-- Supports: phone on users + guest RSVPs, SMS opt-out, reminder dedup

-- ─── Phone on users ──────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS notify_sms boolean NOT NULL DEFAULT true;

-- ─── Phone on guest RSVPs ────────────────────────────────────────────────────
ALTER TABLE public.guest_rsvps
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS notify_sms boolean NOT NULL DEFAULT true;

-- ─── Event reminder idempotency table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_reminders_sent (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  channel        text NOT NULL CHECK (channel IN ('email', 'sms')),
  reminder_type  text NOT NULL CHECK (reminder_type IN ('day_before', 'day_of')),
  user_id        uuid REFERENCES public.users(id) ON DELETE CASCADE,
  guest_rsvp_id  uuid REFERENCES public.guest_rsvps(id) ON DELETE CASCADE,
  sent_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, channel, reminder_type, user_id),
  UNIQUE (event_id, channel, reminder_type, guest_rsvp_id),
  CHECK (user_id IS NOT NULL OR guest_rsvp_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_sent_lookup
  ON public.event_reminders_sent (event_id, reminder_type);

-- RLS: only admin/service-role touches this table (cron runs as admin)
ALTER TABLE public.event_reminders_sent ENABLE ROW LEVEL SECURITY;

-- ─── Update handle_new_user for phone-only signups + identity linking ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url, phone)
  VALUES (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      CASE WHEN new.email IS NOT NULL THEN split_part(new.email, '@', 1) ELSE NULL END,
      CASE WHEN new.phone IS NOT NULL THEN 'User ' || right(new.phone, 4) ELSE 'New User' END
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = CASE
      WHEN users.display_name LIKE 'User ____' AND excluded.display_name NOT LIKE 'User ____'
      THEN excluded.display_name
      ELSE users.display_name
    END,
    avatar_url = COALESCE(users.avatar_url, excluded.avatar_url),
    phone = COALESCE(users.phone, excluded.phone);
  RETURN new;
END;
$$;

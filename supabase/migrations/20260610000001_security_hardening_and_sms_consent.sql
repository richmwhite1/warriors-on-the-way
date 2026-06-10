-- Migration: security hardening + SMS consent
--
-- 1. Close privilege-escalation hole: the old "community_members: join" policy
--    let any authenticated user insert themselves as organizer/active into ANY
--    community (including the parent → full platform control). Joins now go
--    through the server (service role); the only direct insert allowed is the
--    creator bootstrapping themselves as organizer of a community they created.
-- 2. Hide credential-like columns (invite_token, telegram_chat_id) from the
--    anon/authenticated API roles via column-level privileges.
-- 3. Guard rsvps.payment_status / checked_in_at from self-service escalation.
-- 4. Guest RSVP identity: client_token enables upsert instead of duplicate rows.
-- 5. SMS consent: timestamps for TCPA recordkeeping, opt-IN defaults.

-- ─── 1. community_members insert lockdown ───────────────────────────────────
DROP POLICY IF EXISTS "community_members: join" ON public.community_members;

CREATE POLICY "community_members: creator bootstrap"
  ON public.community_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'organizer'
    AND status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

-- Tighten community creation (the 20260409 "authenticated write" policy did
-- not require created_by = auth.uid())
DROP POLICY IF EXISTS "communities: authenticated write" ON public.communities;
DROP POLICY IF EXISTS "communities: create" ON public.communities;
CREATE POLICY "communities: create"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ─── 2. Column privileges: hide invite_token + telegram_chat_id ─────────────
REVOKE SELECT ON public.communities FROM anon, authenticated;

DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'communities'
    AND column_name NOT IN ('invite_token', 'telegram_chat_id');

  EXECUTE format('GRANT SELECT (%s) ON public.communities TO anon, authenticated', cols);
END $$;

-- ─── 3. rsvps protected fields ───────────────────────────────────────────────
-- RLS can't do column-level checks; a trigger guards organizer-only fields.
-- Server code uses the service role and is unaffected.
CREATE OR REPLACE FUNCTION public.guard_rsvp_protected_fields()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(auth.role(), 'service_role') <> 'authenticated' THEN
    RETURN new;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF new.checked_in_at IS NOT NULL THEN
      RAISE EXCEPTION 'Check-in can only be set by an organizer.';
    END IF;
    IF new.payment_status IS NOT NULL AND new.payment_status NOT IN ('unpaid', 'sent') THEN
      RAISE EXCEPTION 'Payment status % can only be set by an organizer.', new.payment_status;
    END IF;
  ELSE
    IF new.checked_in_at IS DISTINCT FROM old.checked_in_at THEN
      RAISE EXCEPTION 'Check-in can only be changed by an organizer.';
    END IF;
    IF new.payment_status IS DISTINCT FROM old.payment_status
       AND new.payment_status NOT IN ('unpaid', 'sent') THEN
      RAISE EXCEPTION 'Payment status % can only be set by an organizer.', new.payment_status;
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_rsvp_protected ON public.rsvps;
CREATE TRIGGER trg_guard_rsvp_protected
  BEFORE INSERT OR UPDATE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.guard_rsvp_protected_fields();

-- ─── 4. guest_rsvps identity + dedupe ────────────────────────────────────────
ALTER TABLE public.guest_rsvps
  ADD COLUMN IF NOT EXISTS client_token uuid,
  ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz;

-- Remove exact duplicates created by the old insert-on-every-change flow
-- (same event + name + email + phone → keep the most recent row)
DELETE FROM public.guest_rsvps g
USING public.guest_rsvps newer
WHERE g.event_id = newer.event_id
  AND g.name = newer.name
  AND COALESCE(g.email, '') = COALESCE(newer.email, '')
  AND COALESCE(g.phone, '') = COALESCE(newer.phone, '')
  AND newer.created_at > g.created_at;

UPDATE public.guest_rsvps SET client_token = gen_random_uuid() WHERE client_token IS NULL;

ALTER TABLE public.guest_rsvps
  ALTER COLUMN client_token SET NOT NULL,
  ALTER COLUMN client_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN notify_sms SET DEFAULT false;

ALTER TABLE public.guest_rsvps
  ADD CONSTRAINT guest_rsvps_event_client_unique UNIQUE (event_id, client_token);

CREATE INDEX IF NOT EXISTS idx_guest_rsvps_event ON public.guest_rsvps (event_id);

-- ─── 5. SMS consent recordkeeping ────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_consent_source text;

-- New users/guests must opt IN to SMS, not opt out
ALTER TABLE public.users ALTER COLUMN notify_sms SET DEFAULT false;

-- Ask PostgREST to reload its schema cache so column grants take effect
NOTIFY pgrst, 'reload schema';

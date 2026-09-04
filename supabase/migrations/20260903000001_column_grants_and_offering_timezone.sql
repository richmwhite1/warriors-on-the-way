-- Close two column-level leaks, and give offerings a timezone.
--
-- ─── 1. events.exact_address was never actually hidden ──────────────────────
--
-- 20260817000006 introduced the RSVP address gate and wrote:
--
--     revoke select (exact_address) on public.events from authenticated, anon;
--
-- That is a no-op. Postgres privileges are additive, and `anon`/`authenticated`
-- already hold a table-wide SELECT on public.events (granted to every table in
-- the `public` schema by Supabase). A column-level REVOKE cannot subtract from a
-- table-level GRANT — the table grant keeps covering every column, including the
-- one just "revoked". The only way to hide a column is to drop the table grant
-- and re-grant an explicit whitelist, which is what 20260610000001 did correctly
-- for public.communities.
--
-- The consequence was that the address gate was decorative. `events` has a
-- `USING (deleted_at IS NULL)` public-read policy so shared invite links preview
-- without a login, which means anyone holding the anon key — it ships in every
-- client bundle, it is not a secret — could read the exact street address of
-- every gathering with one request, RSVP or no RSVP. For events hosted at
-- someone's home that is the whole point of the gate.
--
-- ─── 2. public.users exposed phone numbers and birthdates ───────────────────
--
-- `users` has "users: read public profiles USING (true)" so members can see each
-- other's names and avatars. No column whitelist was ever applied, so the same
-- anon key also returned `phone`, `birthdate`, `sms_consent_at` and
-- `sms_consent_source` for every account — a full PII dump of the membership,
-- available to anyone, unauthenticated.
--
-- The split below: `anon` gets only what a signed-out visitor needs to render a
-- byline; `authenticated` additionally gets the member-facing profile fields.
-- Nobody gets contact details or date of birth through the table. A member reads
-- their *own* phone/birthdate through public.my_profile() (defined at the end),
-- which is SECURITY DEFINER and scoped to auth.uid().
--
-- ─── 3. communities.telegram_link_token ─────────────────────────────────────
--
-- The "add the bot to your group" deep link carried the community's UUID:
--
--     https://t.me/BOT?startgroup=<community id>
--
-- and the webhook linked whatever chat sent `/start <uuid>` to that community. But
-- `communities.id` is readable with the anon key — it has to be, the browse page
-- lists them — so the deep link was not a secret. Anyone could add the bot to a
-- group they own, send `/start` with a community's id, and have that community's
-- posts and events delivered into their chat instead.
--
-- The link now carries a per-community secret that only a steward can read, so
-- possession of it is the proof of authority the UUID never was. It is separate
-- from invite_token on purpose: this token gets pasted into a group chat, and
-- invite_token grants membership of a private community.
--
-- ─── 4. offerings.timezone ──────────────────────────────────────────────────
--
-- `next_starts_at` was written from a datetime-local input with no timezone
-- attached, so it was interpreted in the server's zone (UTC on Vercel) while the
-- edit form re-rendered it in the *browser's* zone — meaning every save shifted a
-- recurring session by the steward's UTC offset. Events already carry a timezone
-- column; offerings need the same so both can be read back on the clock they
-- were entered on.

-- ─── 1. events: hide exact_address for real ─────────────────────────────────

REVOKE SELECT ON public.events FROM anon, authenticated;

DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'events'
    -- Revealed only by public.event_exact_address(uuid), which checks RSVP.
    AND column_name <> 'exact_address';

  EXECUTE format('GRANT SELECT (%s) ON public.events TO anon, authenticated', cols);
END $$;

-- Only SELECT was revoked, so writes are untouched: hosts still INSERT/UPDATE
-- exact_address and the events RLS policies decide who may. Reading it back
-- directly is what is now blocked.

-- ─── 2. users: contact details and DOB leave the table API ──────────────────

REVOKE SELECT ON public.users FROM anon, authenticated;

-- Signed-out: enough to render a name and face on a public event or post.
GRANT SELECT (id, display_name, avatar_url, bio, created_at)
  ON public.users TO anon;

-- Signed-in: the member-facing profile, minus contact details and DOB.
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name NOT IN (
      'phone',
      'birthdate',
      'sms_consent_at',
      'sms_consent_source'
    );

  EXECUTE format('GRANT SELECT (%s) ON public.users TO authenticated', cols);
END $$;

-- Editing your own profile still writes those columns — only SELECT was revoked,
-- and the users UPDATE policy (auth.uid() = id) keeps it to your own row.

-- Your own full row, including the columns hidden above. auth.uid() is the whole
-- authorization check — there is no argument to point at someone else's record.
CREATE OR REPLACE FUNCTION public.my_profile()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.my_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_profile() TO authenticated;

-- ─── 3. communities: a secret for the Telegram deep link ────────────────────

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS telegram_link_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Re-run the communities whitelist so the new column is hidden from the API roles
-- alongside the other two secrets — and so any column added since 20260817000013
-- is granted rather than silently un-selectable (the failure that migration fixed).
REVOKE SELECT ON public.communities FROM anon, authenticated;

DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'communities'
    AND column_name NOT IN ('invite_token', 'telegram_chat_id', 'telegram_link_token');

  EXECUTE format('GRANT SELECT (%s) ON public.communities TO anon, authenticated', cols);
END $$;

-- ─── 4. offerings: carry the timezone their session was entered in ──────────

ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Denver';

-- PostgREST caches column privileges and the schema shape; both just changed.
NOTIFY pgrst, 'reload schema';

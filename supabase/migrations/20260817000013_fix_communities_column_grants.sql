-- Fix: browse/find-a-group returns zero communities for everyone.
--
-- 20260610000001 revoked table-level SELECT on public.communities and re-granted
-- SELECT on an explicit column whitelist (every column EXCEPT invite_token and
-- telegram_chat_id). That GRANT was computed against the columns that existed in
-- June. Columns added later — notably `status` (20260817000005), plus dormant_at
-- and flag_threshold — were never granted. Any query that SELECTs or FILTERS on
-- one of those columns fails with "permission denied for table communities".
--
-- listPublicCommunities() filters on status (`.or(status.eq.listed,...)`), so the
-- browse query errors; the error is swallowed (data ?? []) and the page silently
-- shows an empty list. This re-runs the whitelist grant against the CURRENT column
-- set so newly-added columns (status, etc.) are covered — and stays correct if more
-- columns are added, as long as this block is re-run.

REVOKE SELECT ON public.communities FROM anon, authenticated;

DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'communities'
    -- Keep the two secrets hidden from the API roles (read via service role only).
    AND column_name NOT IN ('invite_token', 'telegram_chat_id');

  EXECUTE format('GRANT SELECT (%s) ON public.communities TO anon, authenticated', cols);
END $$;

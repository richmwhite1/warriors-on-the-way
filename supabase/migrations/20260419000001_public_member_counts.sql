-- Denormalized public member count so unauthenticated users can see community sizes
-- without exposing individual community_members rows.

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS public_member_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_community_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.communities
  SET public_member_count = (
    SELECT count(*)::integer FROM public.community_members
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
      AND status = 'active'
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_member_count ON public.community_members;
CREATE TRIGGER trg_sync_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_count();

-- Backfill existing counts
UPDATE public.communities c
SET public_member_count = (
  SELECT count(*)::integer FROM public.community_members cm
  WHERE cm.community_id = c.id AND cm.status = 'active'
);

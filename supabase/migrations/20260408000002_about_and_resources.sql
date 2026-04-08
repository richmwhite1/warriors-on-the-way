-- Migration: About page content + resources table
-- Adds mission, rules_md to communities
-- Creates resources table with RLS

-- Communities: about page content
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS mission  TEXT,
  ADD COLUMN IF NOT EXISTS rules_md TEXT;

-- Resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID        NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  category     TEXT        NOT NULL CHECK (category IN ('book', 'link', 'article', 'video', 'organization')),
  title        TEXT        NOT NULL,
  description  TEXT,
  url          TEXT,
  author       TEXT,
  sort_order   INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources: read if member"
  ON public.resources FOR SELECT
  USING (public.is_member(community_id) OR public.is_parent_admin());

CREATE POLICY "resources: manage by admin"
  ON public.resources FOR ALL
  USING (public.is_admin(community_id) OR public.is_parent_admin());

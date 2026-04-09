-- Migration: Make resources publicly readable + add practitioner category
-- Resources are WoW-level content (books, practitioners, links) visible to everyone.

-- Drop the member-only read policy
DROP POLICY IF EXISTS "resources: read if member" ON public.resources;

-- Anyone can read resources (public library)
CREATE POLICY "resources: public read"
  ON public.resources FOR SELECT
  USING (true);

-- Expand the category check to include practitioners
ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_category_check;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_category_check
  CHECK (category IN ('book', 'link', 'article', 'video', 'organization', 'practitioner'));

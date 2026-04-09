-- Drop the old check constraint (had legacy types: general, question, quote, checkin, recommendation)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

-- Migrate any rows using the legacy post type names
UPDATE public.posts SET post_type = 'discussion'
  WHERE post_type IN ('general', 'question', 'quote', 'checkin', 'recommendation');

-- Add the correct constraint matching the app's PostType union
ALTER TABLE public.posts ADD CONSTRAINT posts_post_type_check
  CHECK (post_type = ANY (ARRAY['discussion'::text, 'event'::text, 'video'::text, 'music'::text]));

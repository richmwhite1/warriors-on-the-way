-- Add three spiritual post flair types: reflection, wisdom, prayer

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE public.posts ADD CONSTRAINT posts_post_type_check
  CHECK (post_type = ANY (ARRAY[
    'discussion'::text,
    'event'::text,
    'video'::text,
    'music'::text,
    'reflection'::text,
    'wisdom'::text,
    'prayer'::text
  ]));

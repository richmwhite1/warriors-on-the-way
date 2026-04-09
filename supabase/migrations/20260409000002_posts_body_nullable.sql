-- Allow posts.body to be NULL.
-- Video and music posts have no body text (they use embed_url instead).
-- Discussion posts with only a title also need nullable body.
ALTER TABLE public.posts ALTER COLUMN body DROP NOT NULL;

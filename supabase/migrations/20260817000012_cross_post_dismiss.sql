-- Phase Two / Rec 10 — Cross-post post-hoc prompt.
-- After a community post gains local traction we prompt the author to also publish
-- to the relevant topic feed (opt-in after the fact — cross-posting still defaults
-- OFF at compose time). This column records that the author dismissed the prompt so
-- we don't nag. Cross-posting itself flips visibility to 'both' + sets cross_posted_at.

alter table public.posts
  add column if not exists cross_post_prompt_dismissed_at timestamptz;

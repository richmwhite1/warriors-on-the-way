-- Add per-community Telegram push type preferences
-- Default: all four post types are pushed
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS telegram_push_types text[]
  DEFAULT ARRAY['discussion', 'video', 'music', 'event'];

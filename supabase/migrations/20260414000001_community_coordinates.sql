-- Add geocoded coordinates to communities so the discover page can sort by proximity.
-- Populated automatically when a community's location string is saved via the settings form.
-- NULL means the community has no location set or geocoding failed.

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

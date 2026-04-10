-- Migration 002: add image_url to events
-- Events already accept image_url in the application layer; this column was missing from schema.sql.

alter table public.events add column if not exists image_url text;

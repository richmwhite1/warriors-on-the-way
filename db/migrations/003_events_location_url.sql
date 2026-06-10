-- Migration 003: add location_url to events
-- Stores the Google Maps URL for the event location (from Places API or user-pasted).

alter table public.events add column if not exists location_url text;

-- Registration fee for events (optional, 0 = free)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_fee numeric(10,2) DEFAULT 0;

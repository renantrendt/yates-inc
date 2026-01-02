-- Run this in your Supabase SQL Editor to create the warning tracking table

CREATE TABLE IF NOT EXISTS warning_seen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL UNIQUE,
  seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow anonymous inserts and reads (for tracking visitors)
ALTER TABLE warning_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON warning_seen
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON warning_seen
  FOR SELECT
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_warning_seen_visitor_id ON warning_seen(visitor_id);


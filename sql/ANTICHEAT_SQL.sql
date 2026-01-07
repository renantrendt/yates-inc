-- Anti-Cheat System SQL Setup
-- Run this in your Supabase SQL Editor

-- Add anti-cheat columns to user_game_data table
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS anti_cheat_warnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_on_watchlist BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS appeal_pending BOOLEAN DEFAULT FALSE;

-- Create cheat appeals table
CREATE TABLE IF NOT EXISTS cheat_appeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('employee', 'client')),
  username TEXT NOT NULL,
  appeal_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE cheat_appeals ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for production)
CREATE POLICY "Allow all on cheat_appeals" ON cheat_appeals
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cheat_appeals_user_id ON cheat_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_cheat_appeals_status ON cheat_appeals(status);



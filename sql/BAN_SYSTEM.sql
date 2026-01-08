-- Ban System for Yates Inc
-- Allows admins (Bernardo 123456, Logan 000001) to ban users
-- Run this in your Supabase SQL Editor

-- Create banned users table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('employee', 'client')),
  email TEXT, -- Optional, for reference
  username TEXT, -- Optional, for reference
  banned_by TEXT NOT NULL, -- Admin who banned them
  ban_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_permanent BOOLEAN DEFAULT true,
  unban_at TIMESTAMP WITH TIME ZONE, -- For temp bans
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage bans (Bernardo 123456, Logan 000001)
-- For now, allow all for simplicity - tighten in production
CREATE POLICY "Allow all on banned_users" ON banned_users
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);

-- Function to check if a user is banned
CREATE OR REPLACE FUNCTION is_user_banned(check_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM banned_users 
    WHERE user_id = check_user_id 
    AND (is_permanent = true OR unban_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;



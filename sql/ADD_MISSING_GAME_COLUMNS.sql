-- Add missing columns to user_game_data table
-- Run this in your Supabase SQL Editor

-- Add prestige columns
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS prestige_count INTEGER DEFAULT 0;

ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS prestige_multiplier NUMERIC(10, 2) DEFAULT 1.00;

-- Add autoclicker columns
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS has_autoclicker BOOLEAN DEFAULT false;

ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS autoclicker_enabled BOOLEAN DEFAULT false;

-- Add anti-cheat columns
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS anti_cheat_warnings INTEGER DEFAULT 0;

ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS is_on_watchlist BOOLEAN DEFAULT false;

ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS appeal_pending BOOLEAN DEFAULT false;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_game_data'
ORDER BY ordinal_position;


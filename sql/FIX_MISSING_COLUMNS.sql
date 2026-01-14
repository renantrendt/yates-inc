-- =====================================================
-- FIX MISSING COLUMNS - Causing 400 Errors on Save
-- Run this in Supabase SQL Editor IMMEDIATELY
-- =====================================================
-- These columns were added to the code but never had migrations created.
-- Without them, saves fail with 400 Bad Request when these fields are included.

-- Add stocks unlock tracking (permanent unlock flag)
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS has_stocks_unlocked BOOLEAN DEFAULT false;

-- Add achievements tracking (permanently unlocked achievement IDs)
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS unlocked_achievement_ids TEXT[] DEFAULT '{}';

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_game_data' 
AND column_name IN ('has_stocks_unlocked', 'unlocked_achievement_ids');

-- =====================================================
-- FIX INTEGER OVERFLOW - CRITICAL!
-- These columns can exceed INTEGER max (~2.1 billion)
-- Change to BIGINT (max ~9.2 quintillion)
-- =====================================================
-- Run this in Supabase SQL Editor IMMEDIATELY if saves are failing!

-- =====================================================
-- STEP 1: Fix total_clicks overflow (user has 20+ billion!)
-- =====================================================
ALTER TABLE user_game_data 
ALTER COLUMN total_clicks TYPE BIGINT;

-- =====================================================
-- STEP 2: Fix rocks_mined_count overflow (could also overflow)
-- =====================================================
ALTER TABLE user_game_data 
ALTER COLUMN rocks_mined_count TYPE BIGINT;

-- =====================================================
-- STEP 3: Fix current_rock_hp overflow (high prestige = huge HP)
-- =====================================================
ALTER TABLE user_game_data 
ALTER COLUMN current_rock_hp TYPE BIGINT;

-- =====================================================
-- STEP 4: Add missing columns for new features
-- =====================================================

-- Tax system (1QI+ wealth tax)
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS last_tax_time BIGINT;

-- Playtime tracking
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS total_playtime_seconds BIGINT DEFAULT 0;

-- =====================================================
-- VERIFICATION: Check the column types are now BIGINT
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  udt_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_game_data' 
  AND column_name IN (
    'total_clicks', 
    'rocks_mined_count', 
    'current_rock_hp',
    'last_tax_time',
    'total_playtime_seconds'
  );

-- =====================================================
-- WHY THIS MATTERS:
-- =====================================================
-- INTEGER max: 2,147,483,647 (~2.1 billion)
-- BIGINT max:  9,223,372,036,854,775,807 (~9.2 quintillion)
--
-- If a user has 20 billion clicks (like prestige: 231),
-- PostgreSQL will REJECT the insert/update because the
-- value exceeds INTEGER range. The error is often silent
-- in the UI, showing "SAVE SUCCESS" but data isn't saved!
-- =====================================================

-- =====================================================
-- UPGRADE TO NUMERIC(24) - SEXTILLION SUPPORT
-- =====================================================
-- Upgrades money/counter columns from BIGINT to NUMERIC(24)
-- NUMERIC(24,0) supports up to 10^24 (well past Sextillion = 10^21)
-- PostgreSQL handles BIGINT -> NUMERIC conversion losslessly
-- Run this in Supabase SQL Editor BEFORE deploying the code changes
-- =====================================================

-- =====================================================
-- STEP 1: Upgrade user_game_data (normal mode)
-- =====================================================

-- Money columns (need Sextillion range)
ALTER TABLE user_game_data
ALTER COLUMN yates_dollars TYPE NUMERIC(24,2);

ALTER TABLE user_game_data
ALTER COLUMN total_money_earned TYPE NUMERIC(24,0);

-- Counter columns (also grow very large with high prestige)
ALTER TABLE user_game_data
ALTER COLUMN total_clicks TYPE NUMERIC(24,0);

ALTER TABLE user_game_data
ALTER COLUMN rocks_mined_count TYPE NUMERIC(24,0);

ALTER TABLE user_game_data
ALTER COLUMN current_rock_hp TYPE NUMERIC(24,0);

-- =====================================================
-- STEP 2: Upgrade user_game_hard_data (hard mode)
-- =====================================================

ALTER TABLE user_game_hard_data
ALTER COLUMN yates_dollars TYPE NUMERIC(24,2);

ALTER TABLE user_game_hard_data
ALTER COLUMN total_money_earned TYPE NUMERIC(24,0);

ALTER TABLE user_game_hard_data
ALTER COLUMN total_clicks TYPE NUMERIC(24,0);

ALTER TABLE user_game_hard_data
ALTER COLUMN rocks_mined_count TYPE NUMERIC(24,0);

ALTER TABLE user_game_hard_data
ALTER COLUMN current_rock_hp TYPE NUMERIC(24,0);

-- =====================================================
-- STEP 3: Backfill total_money_earned for existing users
-- Many users have total_money_earned = 0 because the column
-- was added after they started playing. Use yates_dollars
-- as a minimum floor (they earned at least that much).
-- =====================================================

UPDATE user_game_data
SET total_money_earned = yates_dollars
WHERE (total_money_earned IS NULL OR total_money_earned = 0)
  AND yates_dollars > 0;

UPDATE user_game_hard_data
SET total_money_earned = yates_dollars
WHERE (total_money_earned IS NULL OR total_money_earned = 0)
  AND yates_dollars > 0;

-- =====================================================
-- VERIFICATION: Check the column types are now NUMERIC
-- =====================================================
SELECT
  table_name,
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name IN ('user_game_data', 'user_game_hard_data')
  AND column_name IN (
    'yates_dollars',
    'total_money_earned',
    'total_clicks',
    'rocks_mined_count',
    'current_rock_hp'
  )
ORDER BY table_name, column_name;

-- =====================================================
-- WHY THIS MATTERS:
-- =====================================================
-- BIGINT max:     9,223,372,036,854,775,807 (~9.2 Quintillion)
-- NUMERIC(24,0):  999,999,999,999,999,999,999,999 (~1 Septillion)
--
-- Players reaching Sextillion ($1,000,000,000,000,000,000,000)
-- were getting silently capped at ~9 Quintillion by the old
-- BIGINT + JS MAX_SAFE_INTEGER limits. This upgrade supports
-- the full K -> M -> B -> T -> Q -> Qi -> Sx progression.
-- =====================================================

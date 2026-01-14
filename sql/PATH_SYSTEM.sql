-- =====================================================
-- PATH SYSTEM SQL MIGRATION
-- Light vs Darkness Path Update
-- =====================================================

-- Add path system columns to user_game_data table
-- Run this in your Supabase SQL Editor

-- 1. Add chosen_path column (light, darkness, or null)
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS chosen_path TEXT;

-- Add constraint to ensure valid path values
ALTER TABLE user_game_data
ADD CONSTRAINT valid_chosen_path CHECK (chosen_path IN ('light', 'darkness') OR chosen_path IS NULL);

-- 2. Add golden cookie ritual status (Darkness path feature)
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS golden_cookie_ritual_active BOOLEAN DEFAULT FALSE;

-- 3. Add sacrifice buff storage (JSON with buff details and expiry)
-- Format: { moneyBonus: 0.5, pcxDamageBonus: 0, minerDamageBonus: 0, allBonus: 0, endsAt: timestamp }
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS sacrifice_buff JSONB;

-- 4. Add admin commands expiry timestamp (Golden Cookie reward)
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS admin_commands_until TIMESTAMPTZ;

-- 5. Add show_path_selection flag for triggering modal
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS show_path_selection BOOLEAN DEFAULT FALSE;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check the new columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_game_data' 
  AND column_name IN (
    'chosen_path', 
    'golden_cookie_ritual_active', 
    'sacrifice_buff', 
    'admin_commands_until',
    'show_path_selection'
  );

-- =====================================================
-- EXAMPLE DATA QUERIES
-- =====================================================

-- Check all players who have chosen a path
-- SELECT user_id, chosen_path, golden_cookie_ritual_active 
-- FROM user_game_data 
-- WHERE chosen_path IS NOT NULL;

-- Check players with active sacrifice buffs
-- SELECT user_id, sacrifice_buff 
-- FROM user_game_data 
-- WHERE sacrifice_buff IS NOT NULL 
--   AND (sacrifice_buff->>'endsAt')::bigint > EXTRACT(EPOCH FROM NOW()) * 1000;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- ALTER TABLE user_game_data DROP COLUMN IF EXISTS chosen_path;
-- ALTER TABLE user_game_data DROP COLUMN IF EXISTS golden_cookie_ritual_active;
-- ALTER TABLE user_game_data DROP COLUMN IF EXISTS sacrifice_buff;
-- ALTER TABLE user_game_data DROP COLUMN IF EXISTS admin_commands_until;
-- ALTER TABLE user_game_data DROP COLUMN IF EXISTS show_path_selection;

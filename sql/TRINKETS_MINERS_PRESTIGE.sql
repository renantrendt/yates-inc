-- =============================================
-- TRINKETS, MINERS, AND PRESTIGE UPGRADES
-- Run this in Supabase SQL Editor
-- =============================================

-- Add trinket columns
ALTER TABLE user_game_data 
ADD COLUMN IF NOT EXISTS owned_trinket_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipped_trinket_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trinket_shop_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS trinket_shop_last_refresh BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_totem_protection BOOLEAN DEFAULT false;

-- Add miner columns
ALTER TABLE user_game_data
ADD COLUMN IF NOT EXISTS miner_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS miner_last_tick BIGINT DEFAULT 0;

-- Add prestige upgrade columns
ALTER TABLE user_game_data
ADD COLUMN IF NOT EXISTS prestige_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS owned_prestige_upgrade_ids TEXT[] DEFAULT '{}';

-- Add auto-prestige column
ALTER TABLE user_game_data
ADD COLUMN IF NOT EXISTS auto_prestige_enabled BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_game_data' 
AND column_name IN (
  'owned_trinket_ids', 
  'equipped_trinket_ids', 
  'trinket_shop_items',
  'trinket_shop_last_refresh',
  'has_totem_protection',
  'miner_count',
  'miner_last_tick',
  'prestige_tokens',
  'owned_prestige_upgrade_ids',
  'auto_prestige_enabled'
);

